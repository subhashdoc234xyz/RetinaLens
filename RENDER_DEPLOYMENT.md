# 🚀 RetinaLens: Render.com Deployment Guide

This guide details how to deploy **RetinaLens** on [Render](https://render.com) using **pnpm** and persistent Node.js Web Services.

---

## 💡 Why Render is Ideal for RetinaLens (vs Vercel)

| Feature | Render Web Service | Vercel Serverless |
| :--- | :--- | :--- |
| **Payload Size** | **25 MB+** (Handles uncompressed high-res fundus images) | ❌ Restricted to 4.5 MB |
| **Execution Timeout** | **Unlimited** (Ideal for deep MATLAB Grad-CAM inference) | ❌ Cut off after 10–15s on free tier |
| **Runtime Model** | **Persistent Node.js Server** (`node dist/server.cjs`) | Serverless micro-functions |
| **Package Manager** | **Native `pnpm` support** | npm / pnpm / yarn |
| **Health Check Path** | Native `/api/health` monitoring | Custom |

---

## 📋 Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [Method A: Deploy via Render Dashboard (Recommended)](#2-method-a-deploy-via-render-dashboard-recommended)
3. [Method B: Deploy via Render Blueprint (render.yaml)](#3-method-b-deploy-via-render-blueprint-renderyaml)
4. [Configuring Environment Variables](#4-configuring-environment-variables)
5. [Inference Engine Options (MATLAB, Groq, Gemini)](#5-inference-engine-options)
6. [Testing & Health Checks](#6-testing--health-checks)
7. [Troubleshooting & FAQs](#7-troubleshooting--faqs)

---

## 1. Prerequisites

1. A [Render account](https://render.com/) (free tier available).
2. A GitHub or GitLab repository containing your RetinaLens project code:
   ```bash
   git init
   git add .
   git commit -m "Configure RetinaLens for Render with pnpm"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/retinalens.git
   git push -u origin main
   ```

---

## 2. Method A: Deploy via Render Dashboard (Recommended)

### Step 1: Create a New Web Service
1. Sign in to your [Render Dashboard](https://dashboard.render.com/).
2. Click the **"New +"** button at the top-right and select **"Web Service"**.
3. Select **"Build and deploy from a Git repository"** and click **Next**.
4. Choose your connected GitHub/GitLab account and select your `retinalens` repository.

### Step 2: Configure Service Settings
Fill in the deployment settings:

| Setting | Value | Notes |
| :--- | :--- | :--- |
| **Name** | `retinalens` | Or any unique name for your clinic |
| **Region** | Closest to your users | e.g., *Oregon (US West)*, *Frankfurt (EU)*, or *Singapore* |
| **Branch** | `main` | Production branch |
| **Root Directory** | *(leave blank)* | Root of the repo |
| **Runtime** | **Node** | Node.js environment |
| **Build Command** | `pnpm install && pnpm run build` | Builds Vite frontend + esbuild server bundle |
| **Start Command** | `pnpm run start` | Executes `node dist/server.cjs` |
| **Instance Type** | **Free** | Generous free tier for prototypes |

### Step 3: Add Environment Variables
Scroll down to the **"Environment Variables"** section and click **"Add Environment Variable"** for each:

| Key | Value | Notes |
| :--- | :--- | :--- |
| `NODE_VERSION` | `20.18.0` | Ensures modern LTS Node.js |
| `NODE_ENV` | `production` | Enables production optimizations |
| `GROQ_API_KEY` | `gsk_...` | Optional: Ultra-fast Llama 3.2 Vision |
| `MODEL_API_URL` | `http://.../predict` | Crucial MATLAB / Edge inference endpoint |
| `GEMINI_API_KEY` | `AIzaSy...` | Optional: Clinical Vision fallback |
| `SUPABASE_URL` | `https://xyz.supabase.co` | Optional: Persistent PostgreSQL storage |
| `SUPABASE_ANON_KEY` | `eyJ...` | Optional: Client-safe Supabase key |

*(See [Section 4](#4-configuring-environment-variables) for how to get each key).*

### Step 4: Configure Health Check Path
Under **Advanced Settings**:
- **Health Check Path**: `/api/health`

### Step 5: Deploy
Click **"Create Web Service"**.  
Render will:
1. Clone your repo.
2. Run `pnpm install && pnpm run build`.
3. Start the application on `http://0.0.0.0:$PORT` using `node dist/server.cjs`.
4. Issue a free SSL/TLS certificate with a URL like `https://retinalens.onrender.com`.

---

## 3. Method B: Deploy via Render Blueprint (render.yaml)

RetinaLens includes a ready-to-use `render.yaml` file in the project root!

1. Push this repository to GitHub.
2. In the Render Dashboard, click **"New +"** and select **"Blueprint"**.
3. Connect your repository. Render will automatically read `render.yaml`.
4. Enter any secret values (`GROQ_API_KEY`, `SUPABASE_URL`, etc.) in the prompts.
5. Click **"Apply"** to launch the service!

---

## 4. Configuring Environment Variables

### 1. `GROQ_API_KEY`
- Go to [Groq Console](https://console.groq.com/keys).
- Click **"Create API Key"** and copy the `gsk_...` key.
- Paste it as `GROQ_API_KEY`.

### 2. `MODEL_API_URL` (Crucial MATLAB Node)
- If your MATLAB model runs on a local workstation, use ngrok or Cloudflare Tunnels:
  ```bash
  ngrok http 5000
  ```
- Set `MODEL_API_URL` to your tunnel URL, e.g.:
  `https://your-subdomain.ngrok-free.app/predict`

### 3. `SUPABASE_URL` & `SUPABASE_ANON_KEY`
- Go to [Supabase Dashboard](https://supabase.com/dashboard) ➔ Select Project ➔ **Settings** ➔ **API**.
- Copy **Project URL** and `anon` `public` key.

### 4. `GEMINI_API_KEY`
- Go to [Google AI Studio](https://aistudio.google.com/) ➔ **"Get API key"** ➔ Copy the key.

---

## 5. Inference Engine Options

RetinaLens checks models in this order:

1. **MATLAB / Edge Deep Learning Model (`MODEL_API_URL`)**:
   Sends the fundus scan to your trained MATLAB CNN and Grad-CAM feature map extractor.
2. **Groq LPU Vision (`GROQ_API_KEY`)**:
   Uses `llama-3.2-11b-vision-preview` on Groq LPUs for sub-second classification and explainable feature weights.
3. **Gemini Clinical Vision (`GEMINI_API_KEY`)**:
   Clinical vision fallback when external nodes are offline.
4. **Standby**:
   Displays *"Model not yet connected"* if no keys or endpoints are configured (matching the project prompt requirement).

---

## 6. Testing & Health Checks

Once your Render Web Service shows **"Live"**:

1. **Check Health**:
   Open in your browser:
   ```
   https://your-service.onrender.com/api/health
   ```
   Expected response:
   ```json
   {
     "status": "ok",
     "service": "RetinaLens Clinical AI Backend",
     "timestamp": "2026-09-12T..."
   }
   ```

2. **Check Connected Engines**:
   ```
   https://your-service.onrender.com/api/config-status
   ```
   Expected response:
   ```json
   {
     "hasModelApi": true,
     "modelApiUrl": "https://your-node.org/predict",
     "hasSupabase": true,
     "hasGroq": true,
     "hasGemini": false,
     "engine": "External MATLAB / Edge Node"
   }
   ```

---

## 7. Troubleshooting & FAQs

### Q: Free Tier Sleep Mode
On Render's free tier, Web Services automatically spin down after 15 minutes of inactivity. When a new request arrives, it takes ~30–50 seconds to wake up (cold start).  
**Tip:** You can set up a free monitor (like [UptimeRobot](https://uptimerobot.com/)) pinging `https://your-service.onrender.com/api/health` every 10 minutes to keep it awake during clinical clinic hours.

### Q: Does Render support pnpm out of the box?
**Yes!** Render automatically uses `pnpm` when specified in your Build Command (`pnpm install && pnpm run build`).

### Q: How do I redeploy after changing code?
Whenever you run `git push origin main`, Render automatically pulls the latest commit, runs `pnpm run build`, and redeploys with zero downtime!
