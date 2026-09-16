"""
3D Vision Studio - Backend API Server (OpenAI Shap-E)
FastAPI server for Single-Image to 3D Model Generation.
Uses official Hugging Face diffusers ShapEImg2ImgPipeline.
100% stable on Google Colab (T4 GPU) or local CUDA systems without custom CUDA C++ extensions.
"""

import os
import io
import time
import torch
import trimesh
from PIL import Image
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

app = FastAPI(
    title="3D Vision Studio - Reconstruction API (OpenAI Shap-E)",
    description="Transforms 2D images into textured 3D meshes using OpenAI Shap-E & Hugging Face Diffusers",
    version="3.1.0"
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
pipe = None


def load_models():
    """Initializes the OpenAI Shap-E pipeline."""
    global pipe
    print(f"[*] Initializing OpenAI Shap-E pipeline on device: {device}...")

    try:
        from diffusers import ShapEImg2ImgPipeline

        pipe = ShapEImg2ImgPipeline.from_pretrained(
            "openai/shap-e-img2img",
            torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
            variant="fp16" if torch.cuda.is_available() else None,
        ).to(device)

        print("[+] OpenAI Shap-E model loaded successfully.")
    except Exception as e:
        print(f"[!] Shap-E initialization failed: {e}")
        pipe = None


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
        "model": "OpenAI Shap-E (openai/shap-e-img2img)",
        "device": device,
        "gpu_name": gpu_name or "CPU",
        "vram_allocated_gb": round(vram_alloc, 2),
        "vram_total_gb": round(vram_total, 2),
        "model_ready": pipe is not None,
        "timestamp": time.time()
    }


@app.post("/api/generate")
async def generate_3d(image: UploadFile = File(...)):
    """
    Accepts an input image and returns a textured .GLB 3D mesh.
    """
    if pipe is None:
        raise HTTPException(
            status_code=503,
            detail="Shap-E 3D model is not loaded. Please verify GPU runtime."
        )

    try:
        from diffusers.utils import export_to_obj

        # 1. Read input image
        contents = await image.read()
        pil_img = Image.open(io.BytesIO(contents)).convert("RGB").resize((256, 256))

        # 2. Neural 3D synthesis with OpenAI Shap-E
        mesh = pipe(
            pil_img,
            guidance_scale=3.0,
            num_inference_steps=64,
            output_type="mesh"
        ).images[0]

        # 3. Export to temp OBJ and convert to GLB via trimesh
        temp_obj = "/tmp/shap_e_server_temp.obj"
        export_to_obj(mesh, temp_obj)

        scene = trimesh.load(temp_obj)
        glb_bytes_io = io.BytesIO()
        scene.export(glb_bytes_io, file_type="glb")
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



