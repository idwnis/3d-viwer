# 3D Vision Studio - AI Backend (Google Colab T4 GPU)

This backend powers the 360-degree single-image 3D reconstruction using **TripoSR** and **rembg**.

---

## 🚀 How to Run in Google Colab (Free T4 GPU)

1. Open [Google Colab](https://colab.research.google.com/).
2. Click **Upload** and upload the file: `backend/3d_reconstruction_colab.ipynb`.
3. Set the hardware accelerator to GPU:
   - Click **Runtime** → **Change runtime type**.
   - Under *Hardware accelerator*, select **T4 GPU** → Click **Save**.
4. Run all cells:
   - Click **Runtime** → **Run all**.
5. Once Cell 4 runs, you will see output like:
   ```text
   ============================================================
   🎉 SUCCESS! YOUR COLAB BACKEND IS ONLINE!
   👉 COPY THIS URL INTO YOUR WEB APP:
   https://random-words-here.trycloudflare.com
   ============================================================
   ```
6. Copy that HTTPS URL, open your **3D Vision Studio** web application, click the **Colab Settings** icon (or top right status), paste the URL, and click **Connect**.

---

## 🛠️ Running Locally (If you have an NVIDIA GPU)

If you have a local PC with an NVIDIA GPU (CUDA):

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
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
