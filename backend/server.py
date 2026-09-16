"""
3D Vision Studio - Backend API Server
FastAPI server for Single-Image to 3D Model Generation.
Compatible with Google Colab (T4 GPU) or local NVIDIA GPU systems.
"""

import os
import io
import time
import torch
import numpy as np
from PIL import Image
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

app = FastAPI(
    title="3D Vision Studio - Reconstruction API",
    description="Transforms 2D images into textured 3D meshes using TripoSR",
    version="1.0.0"
)

# Enable CORS so the web app can communicate from any domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

device = "cuda:0" if torch.cuda.is_available() else "cpu"
model = None
active_model_repo = "idwnis/TripoSR-bucket"

def prepare_image(pil_img: Image.Image) -> Image.Image:
    """Prepares image for TripoSR: ensures RGBA format, removes solid backgrounds, and centers foreground."""
    from tsr.utils import resize_foreground

    if pil_img.mode == 'RGBA':
        img_rgba = pil_img
    else:
        img_rgba = pil_img.convert("RGBA")
        # Auto-remove pure white / solid background if present
        data = np.array(img_rgba)
        r, g, b = data[:, :, 0], data[:, :, 1], data[:, :, 2]
        white_mask = (r > 240) & (g > 240) & (b > 240)
        data[:, :, 3][white_mask] = 0
        img_rgba = Image.fromarray(data)

    return resize_foreground(img_rgba, ratio=0.85)

def load_models():
    """Initializes the TripoSR model using idwnis/TripoSR-bucket."""
    global model, active_model_repo
    print(f"[*] Initializing models on device: {device}...")

    # Ensure TripoSR repo is in sys.path
    import sys
    for p in ['./TripoSR', '/content/TripoSR', os.path.expanduser('~/TripoSR')]:
        if os.path.exists(p) and p not in sys.path:
            sys.path.insert(0, p)

    # 1. Compatibility layer for rembg
    import types
    try:
        import rembg
    except Exception:
        rembg_mock = types.ModuleType("rembg")
        rembg_mock.remove = lambda image, *args, **kwargs: image.convert("RGBA") if hasattr(image, "convert") else image
        rembg_mock.new_session = lambda *args, **kwargs: None
        sys.modules["rembg"] = rembg_mock

    # 2. Compatibility layer for torchmcubes
    try:
        import torchmcubes
    except Exception:
        try:
            import mcubes
            def mc_compat(volume, thresh):
                vol = volume.detach().cpu().numpy() if isinstance(volume, torch.Tensor) else volume
                v, f = mcubes.marching_cubes(vol, float(thresh))
                return torch.from_numpy(v.copy()).float(), torch.from_numpy(f.copy()).long()
        except Exception:
            from skimage.measure import marching_cubes as _sk_mc
            def mc_compat(volume, thresh):
                vol = volume.detach().cpu().numpy() if isinstance(volume, torch.Tensor) else volume
                v, f, _, _ = _sk_mc(vol, float(thresh))
                return torch.from_numpy(v.copy()).float(), torch.from_numpy(f.copy()).long()

        tm_mock = types.ModuleType("torchmcubes")
        tm_mock.marching_cubes = mc_compat
        sys.modules["torchmcubes"] = tm_mock

    try:
        from tsr.system import TSR

        target_repo = "idwnis/TripoSR-bucket"
        fallback_repo = "stabilityai/TripoSR"
        hf_token = os.environ.get("HF_TOKEN", None)

        try:
            print(f"[*] Loading model from '{target_repo}'...")
            model = TSR.from_pretrained(
                target_repo,
                config_name="config.yaml",
                weight_name="model.ckpt",
                token=hf_token
            )
            active_model_repo = target_repo
            print(f"[+] Loaded model from '{target_repo}' successfully.")
        except Exception as err:
            print(f"[!] Warning: Could not load from '{target_repo}': {err}")
            print(f"[*] Falling back to '{fallback_repo}'...")
            model = TSR.from_pretrained(
                fallback_repo,
                config_name="config.yaml",
                weight_name="model.ckpt",
            )
            active_model_repo = fallback_repo
            print(f"[+] Loaded fallback model from '{fallback_repo}'.")

        model.renderer.set_chunk_size(8192)
        model.to(device)
        print(f"[+] TripoSR ({active_model_repo}) initialized on {device}.")
    except Exception as e:
        print(f"[!] TripoSR initialization failed: {e}")
        model = None

@app.on_event("startup")
def startup_event():
    load_models()

@app.get("/health")
def health_check():
    """Returns GPU information and model readiness."""
    gpu_name = None
    vram_alloc = 0.0
    vram_total = 0.0

    if torch.cuda.is_available():
        gpu_name = torch.cuda.get_device_name(0)
        vram_alloc = torch.cuda.memory_allocated(0) / (1024 ** 3)
        vram_total = torch.cuda.get_device_properties(0).total_memory / (1024 ** 3)

    return {
        "status": "ok",
        "device": device,
        "gpu_name": gpu_name or "CPU",
        "vram_allocated_gb": round(vram_alloc, 2),
        "vram_total_gb": round(vram_total, 2),
        "model_ready": model is not None,
        "model_repo": active_model_repo,
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
            detail="TripoSR 3D model is not loaded. Please verify GPU runtime."
        )

    try:
        # 1. Read input image
        contents = await image.read()
        pil_img = Image.open(io.BytesIO(contents))

        # 2. Preprocess and center foreground
        foreground = prepare_image(pil_img)

        # 3. Neural 3D synthesis
        with torch.no_grad():
            scene_codes = model([foreground], device=device)
            # Extract mesh via marching cubes
            meshes = model.extract_mesh(scene_codes, resolution=256, has_texture=True)

        mesh = meshes[0]

        # 4. Export to GLB in-memory
        glb_bytes_io = io.BytesIO()
        mesh.export(glb_bytes_io, file_type="glb")
        glb_bytes = glb_bytes_io.getvalue()

        return Response(
            content=glb_bytes,
            media_type="model/gltf-binary",
            headers={"Content-Disposition": 'attachment; filename="model.glb"'}
        )

    except Exception as err:
        print(f"[!] Error in 3D generation pipeline: {err}")
        raise HTTPException(status_code=500, detail=str(err))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
