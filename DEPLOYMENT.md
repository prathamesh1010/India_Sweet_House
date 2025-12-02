# Vercel Deployment Guide

## Fixed Issues

- The Flask backend now deploys alongside the Vite frontend using Vercel’s Python 3.11 serverless runtime (see `api/backend.py`).
- File uploads are stored in `/tmp` when running on Vercel, solving the previous filesystem write errors.
- Frontend defaults to `/api/backend` so no manual backend URL is needed for the hosted build.

## Deployment Steps

### 1. Deploy to Vercel (Frontend + Serverless Backend)

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Deploy (interactive)
vercel

# Deploy to production once ready
vercel --prod
```

Vercel will:
1. Run `npm install` and `npm run build` (per `vercel.json`)
2. Package any files under `api/` as serverless functions
3. Install `requirements.txt` for the Python runtime

### 2. Optional Environment Variables

| Scope        | Variable          | Purpose                                  |
|--------------|-------------------|------------------------------------------|
| Frontend     | `VITE_BACKEND_URL`| Override backend endpoint (default `/api/backend`) |
| Backend      | `ALLOWED_ORIGINS` | Comma-separated list of allowed origins for CORS   |
| Backend      | `UPLOAD_FOLDER`   | Custom temp folder (defaults to `/tmp` on Vercel)  |

Only set `VITE_BACKEND_URL` if you plan to host the backend elsewhere.

### 3. Local Development

```bash
# Terminal 1 - Backend
python backend_api.py

# Terminal 2 - Frontend
npm run dev
```

Set `VITE_BACKEND_URL=http://localhost:5000` in `.env.local` for the frontend when running locally.

## Project Structure

```
├── src/                    # React frontend (Vite)
├── api/backend.py          # Entry point for Vercel serverless Flask app
├── backend_api.py          # Full Flask application logic (shared locally + Vercel)
├── requirements.txt        # Python dependencies
├── vercel.json             # Build + function configuration
├── .vercelignore           # Ignore bulky artifacts only
└── .env.example            # Environment variable template
```

## Testing Before Deployment

Before deploying, test locally that the serverless function structure works:

```bash
# Test imports and routes
python test_vercel_import.py
```

This verifies:
- All imports work correctly
- Flask app routes are configured
- Dependencies are installed

## Testing Deployment

1. Visit your Vercel URL (e.g., `https://your-app.vercel.app`)
2. Test health endpoint: `https://your-app.vercel.app/health`
3. Upload an Excel file through the UI
4. Check browser console (F12) for any errors
5. Check Vercel Function logs in dashboard if issues occur

## Troubleshooting

- **CORS:** set `ALLOWED_ORIGINS=https://your-vercel-domain.vercel.app` in Vercel if you want to lock it down (default `*`).
- **Timeouts:** the frontend waits up to 25 seconds; if files still time out, inspect logs in the Vercel “Functions” tab.
- **Large Dependencies:** ensure the `functions.api/*.py` config in `vercel.json` has enough memory/time for Pandas (already set to 1024 MB / 60s).
