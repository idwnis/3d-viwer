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
    description="Transforms 2D images into textured 3D meshes using TripoSR & rembg",
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
rembg_session = None

def load_models():
    """Initializes the background removal session and TripoSR model."""
    global model, rembg_session
    print(f"[*] Initializing models on device: {device}...")

    # Initialize rembg for object isolation
    try:
        import rembg
        rembg_session = rembg.new_session("u2net")
        print("[+] Background removal model loaded.")
    except Exception as e:
        print(f"[!] Warning: rembg could not be loaded: {e}")

    # Initialize TripoSR
    try:
        import sys
        for p in ['./TripoSR', '/content/TripoSR', os.path.expanduser('~/TripoSR')]:
            if os.path.exists(p) and p not in sys.path:
                sys.path.insert(0, p)
        from tsr.system import TSR
        model = TSR.from_pretrained(
            "stabilityai/TripoSR",
            config_name="config.yaml",
            weight_name="model.ckpt",
        )
        model.renderer.set_chunk_size(8192)
        model.to(device)
        print("[+] TripoSR 3D reconstruction model loaded successfully.")
    except Exception as e:
        print(f"[!] TripoSR direct import failed: {e}. Attempting fallback...")
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
        pil_img = Image.open(io.BytesIO(contents)).convert("RGB")

        # 2. Remove background to isolate object
        if rembg_session is not None:
            import rembg
            input_rgba = rembg.remove(pil_img, session=rembg_session)
        else:
            input_rgba = pil_img.convert("RGBA")

        # 3. Preprocess for TripoSR
        # Resize and center object
        from tsr.utils import remove_background, resize_foreground
        foreground = resize_foreground(input_rgba, ratio=0.85)

        # 4. Neural 3D synthesis
        with torch.no_grad():
            scene_codes = model([foreground], device=device)
            # Extract mesh via marching cubes
            meshes = model.extract_mesh(scene_codes, resolution=256, has_texture=True)

        mesh = meshes[0]

        # 5. Export to GLB in-memory
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
