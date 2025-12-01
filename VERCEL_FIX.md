# Quick Vercel Deployment Fix

## What Was Wrong?
The backend only ran locally via `python backend_api.py`. We told Vercel to ignore every Python file, so production lacked any API to handle `/process-file`, causing the uploads to fail after deployment.

## What Was Fixed?

### 1. Unified Frontend + Backend Deployment
- Restored Python files to the Vercel build and exposed the Flask app as a serverless function via `api/backend.py`.
- Added runtime config in `vercel.json` so Vercel provisions Python 3.11 with enough memory/time for Pandas/OpenPyXL, plus rewrites so `/process-file`, `/health`, and `/interest-analysis` map to the serverless endpoint.

### 2. Temporary Storage Compatible with Vercel
- `backend_api.py` now writes uploads to `/tmp` automatically when running on Vercel (using `tempfile.gettempdir()`), so the filesystem limitation in serverless environments no longer breaks file processing.

### 3. Fixed Interest Analysis Helper
- Replaced the accidental JavaScript-style `parseFloat` calls with a safe Python `parse_float` helper to avoid runtime errors in production.

### 4. Frontend Auto-Targets Serverless Backend
- `FileUpload.tsx` now defaults to `/api/backend` when `VITE_BACKEND_URL` is not provided, so the deployed frontend automatically talks to the colocated serverless API. The backend request timeout was also increased to handle large Excel processing.

## Deploy Now!

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Enable Flask API on Vercel serverless runtime"
git push origin main
```

### Step 2: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project" (or redeploy existing)
3. Import your GitHub repository
4. Vercel runs `npm install && npm run build`, then bundles the Python serverless function automatically
5. Click "Deploy"

### Step 3: (Optional) Custom Backend URL
If you ever move the backend elsewhere, set `VITE_BACKEND_URL` in the Vercel dashboard. Otherwise the default `/api/backend` works without any env vars.

## Local Development Still Works
```bash
# Terminal 1 - Backend
python backend_api.py

# Terminal 2 - Frontend
npm run dev
```
