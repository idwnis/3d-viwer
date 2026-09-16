"""
3D Vision Studio - Backend API Server (TripoSR - Direct Download)
FastAPI server for fast Single-Image to 3D Textured Model Generation.
100% Tokenless & Open: Direct weight download, zero Hugging Face authentication required.
Compatible with Google Colab (T4 GPU) or local CUDA systems.
"""

import os
import io
import sys
import time
import urllib.request
from typing import Optional

import numpy as np
import torch
import trimesh
from PIL import Image
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

# Ensure TripoSR sub-modules can be imported if cloned in backend or subfolder
sys.path.append(os.path.abspath("TripoSR"))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "TripoSR")))

app = FastAPI(
    title="3D Vision Studio - Reconstruction API (TripoSR)",
    description="Transforms 2D images into 3D meshes using TripoSR. Direct download, zero Hugging Face login required.",
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

# Local weights configuration
WEIGHTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "checkpoints"))
CONFIG_PATH = os.path.join(WEIGHTS_DIR, "config.yaml")
MODEL_PATH = os.path.join(WEIGHTS_DIR, "model.ckpt")

# Direct public download URLs (un-gated, no login/token required)
DIRECT_CONFIG_URL = "https://huggingface.co/stabilityai/TripoSR/resolve/main/config.yaml"
DIRECT_MODEL_URL = "https://huggingface.co/stabilityai/TripoSR/resolve/main/model.ckpt"


def ensure_weights():
    """Downloads model weights directly if not already present on disk."""
    os.makedirs(WEIGHTS_DIR, exist_ok=True)

    if not os.path.exists(CONFIG_PATH):
        print(f"[*] Downloading TripoSR config directly from: {DIRECT_CONFIG_URL}...")
        urllib.request.urlretrieve(DIRECT_CONFIG_URL, CONFIG_PATH)
        print(f"[+] Saved config to {CONFIG_PATH}")

    if not os.path.exists(MODEL_PATH):
        print(f"[*] Downloading TripoSR weights directly (~1.68 GB, no token required)...")
        urllib.request.urlretrieve(DIRECT_MODEL_URL, MODEL_PATH)
        print(f"[+] Saved model checkpoint to {MODEL_PATH}")


def load_models():
    """Initializes the TripoSR pipeline from local checkpoint files."""
    global model, rembg_session
    print(f"[*] Initializing TripoSR on device: {device}...")

    try:
        import rembg
        rembg_session = rembg.new_session()

        ensure_weights()

        from tsr.system import TSR

        model = TSR.from_pretrained(
            WEIGHTS_DIR,
            config_name="config.yaml",
            weight_name="model.ckpt",
            is_local=True
        )
        model.renderer.set_chunk_size(8192)
        model.to(device)

        print("[+] TripoSR model loaded successfully from local direct download.")
    except Exception as e:
        print(f"[!] TripoSR initialization failed: {e}")
        model = None


@app.on_event("startup")
def startup_event():
    load_models()


def preprocess_image(input_image: Image.Image, foreground_ratio: float = 0.85) -> Image.Image:
    """Removes background, isolates foreground object, and normalizes into 512x512 with neutral gray."""
    import rembg
    global rembg_session
    if rembg_session is None:
        rembg_session = rembg.new_session()

    # 1. Background removal via rembg
    raw_rgb = input_image.convert("RGB")
    img_rgba = rembg.remove(raw_rgb, session=rembg_session)

    # 2. Crop transparent bounding box
    bbox = img_rgba.getbbox()
    if bbox:
        img_rgba = img_rgba.crop(bbox)

    # 3. Center foreground with margin
    w, h = img_rgba.size
    max_side = max(w, h)
    target_box_size = int(max_side / foreground_ratio)
    padded = Image.new("RGBA", (target_box_size, target_box_size), (0, 0, 0, 0))
    paste_x = (target_box_size - w) // 2
    paste_y = (target_box_size - h) // 2
    padded.paste(img_rgba, (paste_x, paste_y))

    # 4. Fill background with neutral gray (TripoSR requirement)
    arr = np.array(padded.resize((512, 512), Image.Resampling.LANCZOS)).astype(np.float32) / 255.0
    rgb = arr[:, :, :3] * arr[:, :, 3:4] + (1.0 - arr[:, :, 3:4]) * 0.5
    return Image.fromarray((rgb * 255.0).astype(np.uint8))


@app.get("/health")
def health_check():
    """Returns GPU information, model readiness, and VRAM telemetry."""
    gpu_name = None
    vram_alloc = 0.0
    vram_total = 0.0

    if torch.cuda.is_available():
        gpu_name = torch.cuda.get_device_name(0)
        vram_alloc = torch.cuda.memory_allocated(0) / (1024 ** 3)
        vram_total = torch.cuda.get_device_properties(0).total_memory / (1024 ** 3)

    return {
        "status": "ok",
        "model": "TripoSR (Direct Download, Tokenless)",
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
    Accepts an input image and returns a textured .GLB 3D mesh.
    """
    if model is None:
        raise HTTPException(
            status_code=503,
            detail="TripoSR model is not loaded. Please verify GPU runtime and checkpoint files."
        )

    try:
        # 1. Read input image
        contents = await image.read()
        raw_img = Image.open(io.BytesIO(contents))

        # 2. Preprocessing: background removal + centered framing
        proc_img = preprocess_image(raw_img)

        # 3. Neural 3D synthesis via TripoSR (~2–3s)
        with torch.no_grad():
            scene_codes = model([proc_img], device=device)
            meshes = model.extract_mesh(scene_codes, has_vertex_color=True, resolution=256)
            mesh = meshes[0]

        # 4. Export to standard binary GLB
        glb_bytes_io = io.BytesIO()
        mesh.export(glb_bytes_io, file_type="glb")
        glb_bytes = glb_bytes_io.getvalue()

        return Response(
            content=glb_bytes,
            media_type="model/gltf-binary",
            headers={"Content-Disposition": 'attachment; filename="model.glb"'}
        )

    except Exception as err:
        print(f"[!] Error in TripoSR generation pipeline: {err}")
        raise HTTPException(status_code=500, detail=str(err))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


