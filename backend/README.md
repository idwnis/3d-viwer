# 3D Vision Studio - AI Backend (Stability AI Stable Fast 3D / SF3D)

This backend powers the 360-degree single-image 3D reconstruction using **Stability AI Stable Fast 3D (SF3D)** and **rembg**. It produces UV-unwrapped textured 3D meshes with normal maps in **< 1 second** on a T4 GPU.

---

## 🚀 How to Run in Google Colab (Free T4 GPU)

1. Open [Google Colab](https://colab.research.google.com/).
2. Click **Upload** and upload the file: `backend/3d_reconstruction_colab.ipynb`.
3. Set the hardware accelerator to GPU:
   - Click **Runtime** → **Change runtime type**.
   - Under *Hardware accelerator*, select **T4 GPU** → Click **Save**.
4. Run all cells:
   - Click **Runtime** → **Run all**.
   - *(Note: Ensure you have accepted the license at [huggingface.co/stabilityai/stable-fast-3d](https://huggingface.co/stabilityai/stable-fast-3d). The notebook includes a pre-configured Hugging Face token or supports Colab Secrets).*
5. Once Cell 4 runs, you will see output like:
   ```text
   ============================================================
   🎉 SUCCESS! YOUR COLAB BACKEND IS ONLINE!
   👉 COPY THIS URL INTO YOUR WEB APP:
   https://random-words-here.trycloudflare.com
   ============================================================
   ```
6. Copy that HTTPS URL, open your **3D Vision Studio** web application, click the **Colab Settings** icon, paste the URL, and click **Connect**.

---

## 🛠️ Running Locally (If you have an NVIDIA GPU)

If you have a local PC with an NVIDIA GPU (CUDA):

```bash
cd backend
git clone https://github.com/Stability-AI/stable-fast-3d.git
pip install -r stable-fast-3d/requirements.txt
pip install ./stable-fast-3d/uv_unwrapper ./stable-fast-3d/texture_baker
pip install -r requirements.txt
export HF_TOKEN="your_huggingface_token"
python server.py
```
The server will run on `http://localhost:8000`.

---

## 📡 API Endpoints

- `GET /health`
  - Returns GPU device name, VRAM status, and model readiness.
- `POST /api/generate`
  - Body: Multipart Form with `image` file (`.png` or `.jpg`).
  - Returns: Binary `.glb` 3D model file.
