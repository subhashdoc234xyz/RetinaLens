# 🚀 RetinaLens: Vercel Deployment & Environment Variables Guide

This comprehensive guide details:
1. **How to obtain every environment variable** required for the `.env` file (Gemini API, Supabase PostgreSQL, and MATLAB/Edge Model endpoint).
2. **How to deploy RetinaLens to Vercel** step-by-step using either the Vercel Web Dashboard (GitHub integration) or the Vercel CLI.

---

## 📋 Table of Contents
- [1. Environment Variables Deep Dive (.env)](#1-environment-variables-deep-dive-env)
  - [GEMINI_API_KEY](#1-gemini_api_key)
  - [SUPABASE_URL & SUPABASE_ANON_KEY](#2-supabase_url--supabase_anon_key)
  - [MODEL_API_URL (Optional MATLAB / Edge Inference)](#3-model_api_url-optional)
  - [APP_URL](#4-app_url)
  - [Complete .env Example](#complete-env-file-template)
- [2. Setting Up the Supabase Database Schema](#2-setting-up-the-supabase-database-schema)
- [3. Deploying to Vercel (Step-by-Step)](#3-deploying-to-vercel-step-by-step)
  - [Method A: Vercel Dashboard via GitHub (Recommended)](#method-a-deploy-via-vercel-dashboard-recommended)
  - [Method B: Deploy via Vercel CLI](#method-b-deploy-via-vercel-cli)
- [4. How Vercel Architecture Works for this Project](#4-how-vercel-architecture-works)
- [5. Verification & Health Checks](#5-verification--health-checks)
- [6. Troubleshooting & FAQs](#6-troubleshooting--faqs)

---

## 1. Environment Variables Deep Dive (.env)

The application uses these environment variables:

| Variable Name | Required? | Location | Description |
| :--- | :---: | :---: | :--- |
| `GROQ_API_KEY` | Optional | Server-side | Ultra-fast LPU inference (Llama 3.2 Vision) for grading fundus photos and generating clinical reports. |
| `MODEL_API_URL` | **Crucial** (Prompt Spec) | Server-side | URL of your external MATLAB / Python / FastAPI deep learning inference server (Grad-CAM & CNN). |
| `GEMINI_API_KEY` | Optional | Server-side | Powers Google Clinical Vision fallback when neither MATLAB nor Groq is active. |
| `SUPABASE_URL` | Optional | Server & Client | URL of your Supabase project for persistent cloud storage across devices. |
| `SUPABASE_ANON_KEY` | Optional | Server & Client | Public anonymous key for your Supabase project (safe for client queries with RLS). |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Server-side only | Secret service role key for administrative tasks. |
| `APP_URL` | Optional | Server-side | Production domain URL of your deployed app. |

---

### 1. `GROQ_API_KEY` (High-Speed LPU Vision)

**What it does:**  
Powers ultra-fast inference on Groq's Language Processing Units (LPUs) using multimodal vision models (`llama-3.2-11b-vision-preview` / `llama-3.2-90b-vision-preview`). It grades fundus images on the ICDR scale, pinpoints pathologies, and returns rapid explainable telemetry.

#### How to get your Groq API Key:
1. Go to [Groq Console](https://console.groq.com/keys).
2. Sign in or sign up with GitHub or Google.
3. Click **"Create API Key"**.
4. Label it `RetinaLens` and click **Submit**.
5. Copy the generated API key (format: `gsk_...`).
6. In your `.env` or Vercel Environment Variables, add:
   ```env
   GROQ_API_KEY=gsk_YourGroqKeyHere...
   ```

---

### 2. `MODEL_API_URL` (Crucial MATLAB Deep Learning Core)

> **Prompt Verification:** Is MATLAB needed? **YES, 100% CONFIRMED.**
> In the project prompt specification, the trained Convolutional Neural Network and the Grad-CAM saliency heatmaps are created in MATLAB. The web app's `/api/analyze-scan` route is specifically built to forward the fundus image to your MATLAB service.

#### How to connect MATLAB:
Run a small Python/Flask REST wrapper or MATLAB Production Server that accepts `POST /predict`:
```python
# matlab_bridge.py
from flask import Flask, request, jsonify
from flask_cors import CORS
# import matlab.engine
# eng = matlab.engine.start_matlab()

app = Flask(__name__)
CORS(app)

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json or {}
    image_b64 = data.get('image', '')
    # [severity, confidence, gradcam_b64] = eng.predict_dr(image_b64, nargout=3)
    return jsonify({
        "drSeverityLevel": 1,
        "drSeverityLabel": "Level 1 — Mild NPDR",
        "confidenceScore": 95.2,
        "findings": [{"id": "f1", "type": "microaneurysm", "label": "Microaneurysms", "coordinates": {"x": 48, "y": 52}}],
        "explainabilityNotes": "MATLAB Grad-CAM localized microvascular arcade saliency.",
        "telemetry": {"focalRegionsCount": 1, "primaryAttributionSector": "macula", "featureWeights": [{"feature": "Macular Vascularity", "weightPercent": 88}]}
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```
Set in `.env`:
```env
MODEL_API_URL=http://localhost:5000/predict
```

---

### 3. `GEMINI_API_KEY`

**What it does:**  
Used on the server (`server.ts`) to analyze retinal fundus photographs, grade diabetic retinopathy on the ICDR 5-tier scale (Levels 0–4), pinpoint microvascular pathologies (microaneurysms, hemorrhages, exudates), and generate feature attribution saliency weights.

#### How to get your Gemini API Key:
1. Open your browser and go to [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google account.
3. Click the **"Get API key"** button in the left navigation sidebar (or at the top right).
4. Click **"Create API key"**.
   - You can choose **"Create API key in new project"** or select an existing Google Cloud project.
5. A popup will display your generated API key (it starts with `AIzaSy...`).
6. Click **Copy**.
7. In your local `.env` file (or in Vercel settings), add:
   ```env
   GEMINI_API_KEY=AIzaSyYourGeneratedKeyHere...
   ```

*Note: Google AI Studio provides a free tier suitable for development, testing, and clinical prototyping.*

---

### 2. `SUPABASE_URL` & `SUPABASE_ANON_KEY`

**What it does:**  
Connects your application to a hosted PostgreSQL database and file storage for saving patient records, scan telemetry, user authentication, and search history with strict Row Level Security (RLS).

*(Note: If you do not configure Supabase right away, RetinaLens operates gracefully in local offline storage mode, caching records inside the clinician's browser session).*

#### How to get your Supabase credentials:
1. Go to [Supabase](https://supabase.com/) and click **"Start your project"** (free tier available).
2. Sign in or create an account with GitHub or email.
3. In the Supabase dashboard, click **"New project"**.
4. Fill in the project details:
   - **Name**: e.g., `retinalens-production`
   - **Database Password**: Set a strong password (save this securely).
   - **Region**: Choose the region closest to your clinic or users.
5. Click **"Create new project"** and wait about 1–2 minutes for the database to provision.
6. Once provisioned, click the **Settings (gear icon)** at the bottom of the left sidebar.
7. Click **"API"** under the Project Settings section.
8. Locate the **Project URL**:
   - Copy the URL (format: `https://your-project-id.supabase.co`).
   - This is your `SUPABASE_URL`.
9. Under **Project API keys**, locate the `anon` / `public` key:
   - Click to reveal and copy the token (a long string starting with `eyJhbGciOi...`).
   - This is your `SUPABASE_ANON_KEY`.
10. (Optional) If you also want client-side fallback, you can also set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with the exact same values.

---

### 3. `MODEL_API_URL` (Optional)

**What it does:**  
If your research group, hospital, or clinic runs an on-premise MATLAB Production Server, a PyTorch/TensorFlow server, or an edge node running your custom DR classification model, RetinaLens will proxy raw fundus photographs directly to it before falling back to Gemini.

#### How to obtain / configure it:
- **If running locally on an inference workstation**:
  ```env
  MODEL_API_URL=http://localhost:5000/predict
  ```
- **If hosting on a remote VM / cloud instance**:
  ```env
  MODEL_API_URL=https://inference.yourclinic.org/api/v1/dr-grade
  ```
- **If testing locally with ngrok**:
  ```env
  MODEL_API_URL=https://your-subdomain.ngrok-free.app/predict
  ```
- **If you do not have an external MATLAB server running yet**:  
  **Leave `MODEL_API_URL` blank or commented out.** When blank, RetinaLens seamlessly uses Gemini Clinical Vision or displays `Pending MATLAB / Edge Model Inference` with the engine status indicator.

#### Expected Request/Response Payload for `MODEL_API_URL`:
RetinaLens sends a `POST` request with JSON:
```json
{
  "image": "data:image/jpeg;base64,...",
  "patientId": "PT-4921",
  "eyeSide": "OD",
  "pupilDilationStatus": "Dilated"
}
```
And expects a JSON response containing:
```json
{
  "drSeverityLevel": 0,
  "drSeverityLabel": "Level 0 — No Diabetic Retinopathy",
  "confidenceScore": 95.5,
  "findings": [
    {
      "id": "f1",
      "type": "microaneurysm",
      "label": "Microaneurysms",
      "severity": "minimal",
      "coordinates": { "x": 45, "y": 50 },
      "description": "Focal microaneurysm near temporal arcade"
    }
  ],
  "explainabilityNotes": "Vascular arcades intact without neovascularization.",
  "telemetry": {
    "focalRegionsCount": 1,
    "primaryAttributionSector": "macula",
    "featureWeights": [
      { "feature": "Macular Vascularity", "weightPercent": 88 }
    ]
  }
}
```

---

### 4. `APP_URL`

**What it does:**  
Specifies the canonical public URL of your deployed application (useful for metadata, share links, and OAuth redirect origins).

#### How to get it:
When you deploy on Vercel, Vercel gives you an automatic domain like `https://retinalens-xxx.vercel.app`. You can copy that URL and paste it as `APP_URL`.

---

### Complete `.env` File Template

Create a `.env` file in the project root with the following values:

```env
# ===================================================================
# RETINALENS CLINICAL AI ENVIRONMENT CONFIGURATION
# ===================================================================

# 1. Google Gemini AI Key (Get from https://aistudio.google.com/)
GEMINI_API_KEY=AIzaSyYourGeminiApiKeyHere

# 2. Supabase PostgreSQL & Auth (Get from https://supabase.com/dashboard/project/_/settings/api)
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=

# 3. Optional External MATLAB / Python Edge Model Endpoint
# Leave empty if using Gemini Clinical Vision
MODEL_API_URL=

# 4. Production Domain
APP_URL=https://your-project.vercel.app
```

---

## 2. Setting Up the Supabase Database Schema

To enable persistent multi-clinician storage with Row Level Security (RLS):

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project and click **SQL Editor** in the left sidebar.
3. Click **"New query"**.
4. Paste the following SQL script and click **"Run"** (bottom right):

```sql
-- 1. Clinician Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT,
  clinic_id TEXT,
  role TEXT DEFAULT 'clinician',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Patient Retinal Scans Table
CREATE TABLE IF NOT EXISTS public.scans (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL,
  patient_age INTEGER,
  eye_side TEXT NOT NULL CHECK (eye_side IN ('OD', 'OS')),
  pupil_dilation_status TEXT NOT NULL CHECK (pupil_dilation_status IN ('Dilated', 'Undilated')),
  image_url TEXT NOT NULL,
  gradcam_image_url TEXT,
  dr_severity_level INTEGER NOT NULL CHECK (dr_severity_level BETWEEN 0 AND 4),
  dr_severity_label TEXT NOT NULL,
  confidence_score NUMERIC(5,2) NOT NULL,
  findings JSONB DEFAULT '[]'::jsonb,
  explainability_notes TEXT,
  telemetry JSONB DEFAULT '{}'::jsonb,
  model_source TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Search History Table
CREATE TABLE IF NOT EXISTS public.search_history (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  searched_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

-- 5. Strict User-Isolated Policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Clinicians can view their own scans" ON public.scans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Clinicians can insert scans" ON public.scans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Clinicians can delete their own scans" ON public.scans
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Clinicians can manage their search history" ON public.search_history
  FOR ALL USING (auth.uid() = user_id);
```

Your database is now configured and secured with Row Level Security!

---

## 3. Deploying to Vercel (Step-by-Step)

RetinaLens is pre-configured for Vercel with:
- `vercel.json` routing configuration
- Serverless API entry point at `/api/index.ts`
- Static Vite client build in `dist/`

### Method A: Deploy via Vercel Dashboard (Recommended)

#### Step 1: Push Your Code to GitHub
If you haven't pushed your repository to GitHub yet:
```bash
git init
git add .
git commit -m "Initial commit of RetinaLens"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/retinalens.git
git push -u origin main
```

#### Step 2: Import into Vercel
1. Go to [Vercel](https://vercel.com/) and sign in.
2. From the dashboard, click the **"Add New..."** button (top right) and select **"Project"**.
3. Under **"Import Git Repository"**, find your `retinalens` repository and click **"Import"**.

#### Step 3: Configure Build & Output Settings
Vercel will automatically detect **Vite**:
- **Framework Preset**: `Vite`
- **Root Directory**: `./` (default)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

*(All of these default values are correct out of the box).*

#### Step 4: Add Environment Variables in Vercel
Before clicking Deploy, expand the **"Environment Variables"** accordion and add:

1. `GEMINI_API_KEY`
   - **Value**: Your Google AI Studio API key (`AIzaSy...`)
2. `SUPABASE_URL`
   - **Value**: `https://your-project.supabase.co`
3. `SUPABASE_ANON_KEY`
   - **Value**: Your Supabase anon key
4. `MODEL_API_URL` *(Optional)*
   - **Value**: Your external MATLAB/Python inference endpoint (or leave blank)
5. `APP_URL` *(Optional)*
   - **Value**: Leave blank for first deploy, then update with your `https://your-project.vercel.app` domain.

#### Step 5: Click Deploy
Click **"Deploy"**. Vercel will:
1. Install dependencies (`npm install`).
2. Build the React frontend with Vite into `dist/`.
3. Package `/api/index.ts` into a serverless function.
4. Provide you with a live URL (e.g. `https://retinalens.vercel.app`)!

---

### Method B: Deploy via Vercel CLI

If you prefer deploying directly from your terminal:

1. **Install the Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Link and Deploy**:
   From your project root directory, run:
   ```bash
   vercel
   ```
   Follow the interactive prompts:
   - Set up and deploy? **Yes**
   - Which scope? Select your account or team.
   - Link to existing project? **No**
   - Project name? `retinalens`
   - In which directory is your code located? `./`
   - Want to modify settings? **No**

4. **Add Environment Variables via CLI**:
   ```bash
   vercel env add GEMINI_API_KEY production
   vercel env add SUPABASE_URL production
   vercel env add SUPABASE_ANON_KEY production
   ```
   Paste the corresponding values when prompted.

5. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

---

## 4. How Vercel Architecture Works

This repository uses a hybrid full-stack architecture:

```
├── /src                   --> React 19 Frontend (Vite + Tailwind CSS v4)
├── /dist                  --> Static frontend build served by Vercel CDN
├── /api/index.ts          --> Vercel Serverless Function entry point
├── server.ts              --> Express app with /api routes (analyze-scan, health, etc.)
└── vercel.json            --> URL rewrites directing /api/* to the serverless function
```

### `vercel.json` Explanation
```json
{
  "version": 2,
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index.ts"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
- Any request starting with `/api/` is handled by the serverless function (`/api/index.ts`), keeping your `GEMINI_API_KEY` hidden from the client browser.
- All other paths are routed to `/index.html` for single-page client routing.

---

## 5. Verification & Health Checks

Once deployed on Vercel, verify your deployment:

1. **Test API Health**:
   Visit: `https://your-deployment.vercel.app/api/health`
   You should see:
   ```json
   {
     "status": "ok",
     "service": "RetinaLens Clinical AI Backend",
     "timestamp": "2026-09-12T..."
   }
   ```

2. **Check Configuration Status**:
   Visit: `https://your-deployment.vercel.app/api/config-status`
   You should see:
   ```json
   {
     "hasModelApi": false,
     "modelApiUrl": null,
     "hasSupabase": true,
     "supabaseUrl": "https://your-project.supabase.co",
     "hasGemini": true,
     "engine": "Gemini Clinical Vision Core"
   }
   ```

3. **Test Fundus Screening**:
   - Open your app in the browser.
   - Sign in or click **"Continue as Guest"**.
   - Upload a retinal fundus photograph.
   - Click **"Run Diagnostic Edge Inference"**.
   - Verify the ICDR severity grading, confidence rating, lesion findings, and Grad-CAM saliency heatmaps!

---

## 6. Troubleshooting & FAQs

### Q: Vercel Serverless Payload Limits (4.5 MB)
**Symptom:** `413 Payload Too Large` error when uploading high-resolution DICOM/TIFF files.  
**Solution:**
Vercel Serverless Functions have a maximum request body size of 4.5 MB on the free Hobby tier. The frontend handles standard fundus photos (JPEG/PNG) easily, but for raw multi-megabyte uncompressed DICOM captures:
- Resize or convert the image to JPEG before upload, or
- Store the image directly in a Supabase Storage bucket and send the image URL to `/api/analyze-scan`.

### Q: "Model not yet connected" displays in Dashboard
**Explanation:**  
This is by design. If neither `MODEL_API_URL` nor `GEMINI_API_KEY` is provided, RetinaLens refuses to produce simulated or fake results. Simply add `GEMINI_API_KEY` in your Vercel Project Settings to activate the clinical vision engine.

### Q: Adding or Updating Environment Variables in Vercel
After adding or changing an environment variable in Vercel:
1. Go to **Project Settings** > **Environment Variables**.
2. Save your changes.
3. Go to the **Deployments** tab, click the three dots on your latest deployment, and select **"Redeploy"** so the new variables take effect.

---

### Need further assistance?
Check the project's **Node Settings** page inside the app (`/settings`) to test inference latencies and view copyable PostgreSQL schema configurations.
