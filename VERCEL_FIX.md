# Quick Vercel Deployment Fix

## What Was Wrong?
Vercel was trying to run `pip3 install` because it detected Python files in your project, but this is a React frontend that should be deployed independently from the Python backend.

## What Was Fixed?

### 1. Created `vercel.json`
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "installCommand": "npm install"
}
```
This tells Vercel to only build the frontend using npm/Vite.

### 2. Created `.vercelignore`
```
*.py
requirements.txt
uploads/
```
This prevents Vercel from trying to process Python files.

### 3. Updated Backend URL Configuration
Changed `FileUpload.tsx` to use environment variables:
```typescript
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
```

## Deploy Now!

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Fix Vercel deployment configuration"
git push origin main
```

### Step 2: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect the settings from `vercel.json`
5. Click "Deploy"

### Step 3: Deploy Backend Separately
Your Flask backend needs to be deployed separately. Easiest options:

**Render.com (Free tier available):**
1. Go to [render.com](https://render.com)
2. New → Web Service → Connect GitHub
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `python backend_api.py`

**Railway.app (Free tier available):**
1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Auto-detects Python

### Step 4: Connect Frontend to Backend
1. In Vercel, go to your project → Settings → Environment Variables
2. Add: `VITE_BACKEND_URL` = `https://your-backend-url.com`
3. Redeploy frontend

## That's It!
Your frontend will be on Vercel and backend on Render/Railway, working together seamlessly.

## Local Development Still Works
```bash
# Terminal 1 - Backend
python backend_api.py

# Terminal 2 - Frontend
npm run dev
```
