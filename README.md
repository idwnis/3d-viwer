# 3D Vision Studio: Single-Image to 3D Model Generator & CAD Studio
## استودیو بینایی سه‌بعدی: تبدیل تصویر تک به مدل سه‌بعدی و استودیو CAD

> **University Final Project in Computer Engineering | پروژه پایانی مهندسی کامپیوتر**  
> *Cross-platform web application converting 2D images (.jpg, .png, .webp) into interactive, downloadable 3D models (.glb, .obj, .stl) running on any computer with complete Persian (فارسی) interface.*

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/idwnis/3d-viwer/blob/main/backend/3d_reconstruction_colab.ipynb)
[![GitHub Pages Deployment](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-blue?style=flat&logo=github)](https://idwnis.github.io/3d-viwer/)

---

## 🌟 Key Project Highlights | ویژگی‌های برجسته پروژه

1. **Persian UI & Modern Typography (رابط کاربری کاملاً فارسی)**:
   - پشتیبانی کامل از چینش راست‌به‌چپ (`dir="rtl"`) با فونت زیبای **وزیرمتن (Vazirmatn)**.
   - ترجمه دقیق تمامی بخش‌ها اعم از نوار ابزار، تنظیمات سرور، گزارش توپولوژی و پنجره‌های دانلود.
2. **Runs on Every PC (Zero Install)**:
   - Built as a modern, responsive **Web Application** (React, TypeScript, Three.js, Tailwind CSS).
   - Runs smoothly on Windows, macOS, Linux, ChromeOS, and mobile devices in any modern browser.
3. **Dual-Engine Architecture (معماری دوگانه برای تضمین ارائه دفاعیه)**:
   - **Engine 1: Cloud/Colab GPU (360° AI Mesh)**: Powered by **OpenAI Shap-E** (`openai/shap-e-img2img` via Hugging Face `diffusers`). Runs without any custom C++/CUDA compilation or license gating, generating full 360-degree meshes.
   - **Engine 2: Universal CPU Offline Fallback**: In-browser depth-to-mesh reconstruction running in pure WebGL/JavaScript. Guarantees your live project defense will **never fail** even if offline or disconnected from Colab.
4. **Interactive 3D Studio & Geometry Telemetry (استودیو تعاملی و تحلیل هندسه)**:
   - **OrbitControls**: چرخش ۳۶۰ درجه، جابجایی (Pan) و بزرگ‌نمایی (Zoom).
   - **Inspection Shaders**: حالت‌های رندر بافت‌دار (Textured)، ساختار مش (Wireframe)، سطح گلی (Clay) و نقشه‌برداری بردار نرمال (Surface Normals).
   - **Lighting**: نورپردازی سه‌نقطه‌ای استودیویی، حالت ترن‌تیبل خودکار و شبکه شطرنجی کف.
   - **Real-Time Mesh Metrics**: نمایش زنده تعداد رئوس (Vertices)، مثلث‌ها (Faces) و ابعاد فیزیکی احاطه‌کننده (Bounding Box).
5. **Universal 3D Export Suite (خروجی در فرمت‌های استاندارد مهندسی)**:
   - **`.GLB` (glTF Binary)**: وب، واقعیت افزوده (AR)، موتورهای یونیتی و آنریل انجین.
   - **`.OBJ` + `.MTL`**: نرم‌افزارهای استاندارد مدل‌سازی (Blender, Maya, 3ds Max).
   - **`.STL`**: خروجی صلب بهینه‌سازی‌شده برای اسلایسرهای پرینتر سه‌بعدی (Cura, PrusaSlicer, Bambu Studio).

---

## 🏗️ System Architecture

```text
+-------------------------------------------------------------------------+
|                      CLIENT BROWSER (Persian RTL)                       |
|  +-------------------------------------------------------------------+  |
|  |                 3D Vision Studio Web Application                  |  |
|  |             (React + Three.js + Tailwind CSS + Vazir)             |  |
|  +-------------------------------------------------------------------+  |
|         |                                              |                |
|         v                                              v                |
|  [Engine 1: Colab AI]                        [Engine 2: CPU Fallback]   |
|         |                                              |                |
+---------|----------------------------------------------|----------------+
          | HTTPS REST API                               | In-browser WebGL
          v                                              v
+------------------------+                     +--------------------+
|  GOOGLE COLAB (T4 GPU) |                     |  Heightfield Mesh  |
|  FastAPI + Cloudflared |                     |  Delaunay Surface  |
|  OpenAI Shap-E Model   |                     +--------------------+
|  Returns: .GLB binary  |                               |
+------------------------+                               |
          |                                              |
          +----------------------+-----------------------+
                                 |
                                 v
                 +-------------------------------+
                 |  Three.js Interactive Studio  |
                 |  - 360° Orbit, Pan, Zoom      |
                 |  - Wireframe & Clay Shaders   |
                 |  - Live Geometry Telemetry    |
                 |  - Export: .GLB / .OBJ / .STL |
                 +-------------------------------+
```

---

## 🚀 Quick Start Guide

### Step 1: Run the Web App (Frontend)

```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

> *Note: The app immediately launches with pre-loaded demo samples (Chair, Sneaker, Vase, Robot Crest) in Universal CPU mode, so you can test 360° rotation and 3D export immediately.*

---

### Step 2: Connect the Google Colab AI Backend (For 360° Meshes)

1. Open [Google Colab](https://colab.research.google.com/).
2. Upload `backend/3d_reconstruction_colab.ipynb`.
3. Switch runtime to GPU: **Runtime** → **Change runtime type** → select **T4 GPU** → **Save**.
4. Click **Runtime** → **Run all**.
5. Once Cell 4 completes, copy the generated Cloudflare tunnel URL:
   ```text
   https://xxxx.trycloudflare.com
   ```
6. In your web app, click **Colab Settings** in the top bar, paste the URL, and click **Connect**.
7. Switch the engine toggle to **Colab AI (360°)** and enjoy instant 3D model generation!

---

## 📁 Repository Structure

```text
├── backend/
│   ├── 3d_reconstruction_colab.ipynb  # 1-Click Google Colab Jupyter Notebook
│   ├── server.py                     # Standalone FastAPI server for GPU machines
│   ├── requirements.txt              # Python AI backend dependencies
│   └── README.md                     # Detailed backend setup documentation
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── src/
│       ├── App.tsx                   # Main Studio coordinator
│       ├── main.tsx
│       ├── index.css
│       ├── components/
│       │   ├── Header.tsx            # Navigation, status & engine switch
│       │   ├── Viewport3D.tsx        # Three.js canvas & OrbitControls
│       │   ├── Toolbar.tsx           # Wireframe/Clay/Auto-rotate controls
│       │   ├── SidebarControls.tsx   # Uploads, presets, parameters
│       │   ├── MeshStats.tsx         # Live geometry metrics inspector
│       │   ├── ExportModal.tsx       # Download .GLB, .OBJ, .STL
│       │   └── ColabSettingsModal.tsx# Colab connection instructions & ping
│       └── services/
│           ├── api.ts                # Colab REST API client
│           ├── exporters.ts          # Three.js GLTF/OBJ/STL exporters
│           ├── meshGenerators.ts     # In-browser offline depth-to-mesh engine
│           └── sampleData.ts         # Pre-packaged demo images
└── README.md
```

---

## 🎓 University Final Project Defense Checklist

- [x] **Problem Statement**: Single-view 3D reconstruction as an ill-posed inverse problem.
- [x] **Cross-Platform Compatibility**: Tested and running on any OS through standard WebGL.
- [x] **GPU Cost Optimization**: Leveraged free Google Colab T4 cloud runtimes with zero server cost.
- [x] **Fault Tolerance**: Offline fallback ensures demonstration never crashes if internet drops.
- [x] **Multi-Disciplinary Output**:
  - Web & AR visualization (`.glb`)
  - Computer Graphics & Animation (`.obj`)
  - Additive Manufacturing & 3D Printing (`.stl`)
