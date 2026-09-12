# RetinaLens: Explainable AI Diabetic Retinopathy Screening Platform

RetinaLens is an ophthalmic screening application designed for rural and low-resource healthcare nodes. It performs automated Diabetic Retinopathy (DR) grading on the 5-tier International Clinical Diabetic Retinopathy (ICDR) scale, coupled with Grad-CAM saliency heatmaps, microvascular lesion pinpointing, and printable clinical diagnostic reports.

---

## 🚀 Deployment Guides

- 👉 **[RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)** — **Recommended**: Deploy on **Render.com** with persistent Node.js Web Services, native `pnpm` builds, 25MB+ medical image support, and zero serverless timeouts. Includes ready-to-use `render.yaml`.
- 👉 **[VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)** — Alternative serverless deployment on Vercel.

---

## ⚡ Quick Start (pnpm)

### 1. Install Dependencies with pnpm
```bash
pnpm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in:
- `GROQ_API_KEY`: Ultra-fast LPU vision inference (obtain from [console.groq.com/keys](https://console.groq.com/keys))
- `MODEL_API_URL`: Crucial MATLAB / Python edge inference server (e.g. `http://localhost:5000/predict`)
- `GEMINI_API_KEY`: Clinical vision fallback (obtain from [Google AI Studio](https://aistudio.google.com/))
- `SUPABASE_URL` & `SUPABASE_ANON_KEY`: Cloud PostgreSQL database & Auth (obtain from [Supabase](https://supabase.com/))

### 3. Run Development Server
```bash
pnpm run dev
```
Open your browser at `http://localhost:3000`.

### 4. Build for Production
```bash
pnpm run build
```

### 5. Production Start
```bash
pnpm run start
```

---

## 🧠 Model Architecture & MATLAB Confirmation

> **Is MATLAB required? YES, 100% CONFIRMED.**
> As specified in the project build prompt:
> *"Since the actual DR-grading model (Grad-CAM, severity classification) is built separately in MATLAB, add a clearly marked backend integration point — an API route (e.g. `/api/analyze-scan`) that sends the uploaded image to an external inference endpoint (`MODEL_API_URL`)... Until that endpoint is connected, clearly log/display 'Model not yet connected' rather than faking a result."*

RetinaLens acts as the full-stack clinical interface (React 19 + Vite + Tailwind CSS + Supabase + Express). The actual Deep Learning Convolutional Network and exact Grad-CAM feature map gradients run on your MATLAB model.
You can link MATLAB directly via:
1. **MATLAB Production Server** or
2. **Lightweight Python/Flask REST wrapper** (`matlab.engine` or ONNX model) listening on `http://localhost:5000/predict`, which you configure in `MODEL_API_URL`.
3. If you also configure `GROQ_API_KEY`, RetinaLens can additionally invoke Groq's high-speed **Llama 3.2 Vision** on LPUs!

---

## 🛠 Features
- **Macro Human Eye Iris Canvas**: Atmospheric medical glassmorphism theme designed to clinical specifications.
- **Explainable AI (XAI)**: Grad-CAM saliency heatmaps with opacity controls and red-free optical filters.
- **Pathological Pinpointing**: Interactive detection markers for microaneurysms, hemorrhages, and exudates.
- **Secure Multi-Tier Storage**: Supabase PostgreSQL with Row Level Security (RLS) policies and isolated guest triage mode.
- **Printable Medical Reports**: Standardized ophthalmic diagnostic reports with clinician and patient telemetry.
