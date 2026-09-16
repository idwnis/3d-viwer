"""
3D Vision Studio - Backend API Server (Stable Fast 3D / SF3D)
FastAPI server for ultra-fast Single-Image to 3D Textured Model Generation.
Generates crisp, UV-unwrapped .GLB meshes with normal maps in < 1 second.
Compatible with Google Colab (T4 GPU) or local CUDA systems.
"""

import os
import io
import sys
import time
from contextlib import nullcontext
from typing import Any

import numpy as np
import torch
import trimesh
from PIL import Image
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

# Ensure sub-modules are found if cloned locally or in subfolder
sys.path.append(os.path.abspath("stable-fast-3d"))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "stable-fast-3d")))

# Hugging Face Access Token for stabilityai/stable-fast-3d (gated weights)
DEFAULT_HF_TOKEN = "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"
hf_token = os.environ.get("HF_TOKEN", DEFAULT_HF_TOKEN)
if hf_token:
    try:
        from huggingface_hub import login
        login(token=hf_token)
    except Exception as e:
        print(f"[*] Hugging Face auth note: {e}")

app = FastAPI(
    title="3D Vision Studio - Reconstruction API (Stable Fast 3D)",
    description="Transforms 2D images into high-resolution textured 3D meshes using Stability AI SF3D",
    version="3.0.0"
)

# Enable CORS so the web app can communicate from any domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

device = "cuda:0" if torch.cuda.is_available() else ("mps" if torch.backends.mps.is_available() else "cpu")
model = None
rembg_session = None

# SF3D Camera & Condition parameters
COND_WIDTH = 512
COND_HEIGHT = 512
COND_DISTANCE = 1.6
COND_FOVY_DEG = 40
BACKGROUND_COLOR = [0.5, 0.5, 0.5]

c2w_cond = None
intrinsic = None
intrinsic_normed_cond = None


def load_models():
    """Initializes the Stable Fast 3D pipeline and rembg session."""
    global model, rembg_session, c2w_cond, intrinsic, intrinsic_normed_cond
    print(f"[*] Initializing Stable Fast 3D (SF3D) pipeline on device: {device}...")

    try:
        import rembg
        rembg_session = rembg.new_session()

        import sf3d.utils as sf3d_utils
        from sf3d.system import SF3D

        # Precompute camera matrices
        c2w_cond = sf3d_utils.default_cond_c2w(COND_DISTANCE)
        intrinsic, intrinsic_normed_cond = sf3d_utils.create_intrinsic_from_fov_deg(
            COND_FOVY_DEG, COND_HEIGHT, COND_WIDTH
        )

        model = SF3D.from_pretrained(
            "stabilityai/stable-fast-3d",
            config_name="config.yaml",
            weight_name="model.safetensors",
            token=hf_token,
        )
        model.eval()
        model = model.to(device)

        print("[+] Stable Fast 3D (SF3D) model loaded successfully.")
    except Exception as e:
        print(f"[!] SF3D initialization failed: {e}")
        model = None


@app.on_event("startup")
def startup_event():
    load_models()


def preprocess_image(input_image: Image.Image) -> Image.Image:
    """Removes background, isolates foreground object, and pads into 512x512."""
    import rembg
    global rembg_session
    if rembg_session is None:
        rembg_session = rembg.new_session()

    # Remove background with rembg
    img_rgba = rembg.remove(input_image, session=rembg_session)

    # Crop to object bounding box
    bbox = img_rgba.getbbox()
    if bbox:
        img_rgba = img_rgba.crop(bbox)

    # Pad foreground so object fits nicely with ~15% margin
    w, h = img_rgba.size
    max_side = max(w, h)
    target_box_size = int(max_side / 0.85)
    padded = Image.new("RGBA", (target_box_size, target_box_size), (0, 0, 0, 0))
    paste_x = (target_box_size - w) // 2
    paste_y = (target_box_size - h) // 2
    padded.paste(img_rgba, (paste_x, paste_y))

    return padded.resize((COND_WIDTH, COND_HEIGHT), Image.Resampling.LANCZOS)


def create_batch(input_image: Image.Image) -> dict[str, Any]:
    """Prepares conditioning tensors for SF3D feedforward pass."""
    img_cond = (
        torch.from_numpy(
            np.asarray(input_image.resize((COND_WIDTH, COND_HEIGHT))).astype(np.float32)
            / 255.0
        )
        .float()
        .clip(0, 1)
    )
    mask_cond = img_cond[:, :, -1:]
    rgb_cond = torch.lerp(
        torch.tensor(BACKGROUND_COLOR)[None, None, :], img_cond[:, :, :3], mask_cond
    )

    batch_elem = {
        "rgb_cond": rgb_cond,
        "mask_cond": mask_cond,
        "c2w_cond": c2w_cond.unsqueeze(0),
        "intrinsic_cond": intrinsic.unsqueeze(0),
        "intrinsic_normed_cond": intrinsic_normed_cond.unsqueeze(0),
    }
    return {k: v.unsqueeze(0) for k, v in batch_elem.items()}


@app.get("/health")
def health_check():
    """Returns GPU information, model status, and VRAM telemetry."""
    gpu_name = None
    vram_alloc = 0.0
    vram_total = 0.0

    if torch.cuda.is_available():
        gpu_name = torch.cuda.get_device_name(0)
        vram_alloc = torch.cuda.memory_allocated(0) / (1024 ** 3)
        vram_total = torch.cuda.get_device_properties(0).total_memory / (1024 ** 3)

    return {
        "status": "ok",
        "model": "Stability AI Stable Fast 3D (SF3D)",
        "device": device,
        "gpu_name": gpu_name or "CPU",
        "vram_allocated_gb": round(vram_alloc, 2),
        "vram_total_gb": round(vram_total, 2),
        "model_ready": model is not None,
        "timestamp": time.time()
    }


@app.post("/api/generate")
async def generate_3d(image: UploadFile = File(...)):
    """
    Accepts an input image and returns a textured, UV-unwrapped .GLB 3D mesh.
    """
    if model is None:
        raise HTTPException(
            status_code=503,
            detail="SF3D model is not loaded. Please verify GPU runtime and Hugging Face token."
        )

    try:
        # 1. Read input image
        contents = await image.read()
        raw_img = Image.open(io.BytesIO(contents)).convert("RGBA")

        # 2. Preprocessing: background removal + center scaling
        proc_img = preprocess_image(raw_img)

        # 3. Prepare conditioning batch
        model_batch = create_batch(proc_img)
        model_batch = {k: v.to(device) for k, v in model_batch.items()}

        # 4. Neural 3D synthesis + UV texture baking (< 1s)
        with torch.no_grad():
            with torch.autocast(
                device_type="cuda" if "cuda" in device else "cpu",
                dtype=torch.bfloat16
            ) if "cuda" in device else nullcontext():
                trimesh_mesh, _ = model.generate_mesh(
                    model_batch,
                    texture_size=1024,
                    remesh_option="none",
                    vertex_count=-1
                )
                trimesh_mesh = trimesh_mesh[0]

        # 5. Export to binary GLB with full normals and UV textures
        glb_bytes_io = io.BytesIO()
        trimesh_mesh.export(glb_bytes_io, file_type="glb", include_normals=True)
        glb_bytes = glb_bytes_io.getvalue()

        return Response(
            content=glb_bytes,
            media_type="model/gltf-binary",
            headers={"Content-Disposition": 'attachment; filename="model.glb"'}
        )

    except Exception as err:
        print(f"[!] Error in SF3D generation pipeline: {err}")
        raise HTTPException(status_code=500, detail=str(err))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

