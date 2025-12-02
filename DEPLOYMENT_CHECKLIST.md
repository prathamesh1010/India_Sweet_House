# Vercel Deployment Checklist

## ✅ Pre-Deployment Verification

Run these checks before deploying:

1. **Test Local Imports**
   ```bash
   python test_vercel_import.py
   ```
   Expected: All imports succeed, 4 routes found

2. **Verify Files Exist**
   - [x] `api/backend.py` - Vercel serverless entry point
   - [x] `api/__init__.py` - Makes api/ a Python package
   - [x] `backend_api.py` - Flask application
   - [x] `requirements.txt` - Python dependencies
   - [x] `vercel.json` - Vercel configuration
   - [x] `.vercelignore` - Excludes unnecessary files

3. **Check Configuration**
   - [x] `vercel.json` specifies Python 3.11 runtime
   - [x] `vercel.json` has maxDuration: 60s, memory: 1024MB
   - [x] Routes configured: `/health`, `/process-file`, `/interest-analysis`
   - [x] Frontend defaults to `/api/backend` when `VITE_BACKEND_URL` not set

## 🚀 Deployment Steps

1. **Commit and Push**
   ```bash
   git add .
   git commit -m "Fix Vercel serverless function deployment"
   git push origin main
   ```

2. **Deploy via Vercel Dashboard**
   - Go to [vercel.com](https://vercel.com)
   - Import/redeploy your repository
   - Vercel will automatically:
     - Install npm dependencies
     - Build frontend (`npm run build`)
     - Install Python dependencies (`pip install -r requirements.txt`)
     - Deploy serverless functions

3. **Verify Deployment**
   - Visit `https://your-app.vercel.app/health`
   - Should return: `{"status": "healthy", "message": "Backend API is running", ...}`
   - Upload a test Excel file through the UI
   - Check browser console for any errors

## 🔧 Troubleshooting

### Build Fails
- Check Vercel build logs
- Verify `requirements.txt` has all dependencies
- Ensure Python 3.11 is supported (should be auto-detected)

### Function Timeout
- Check function logs in Vercel dashboard
- Increase `maxDuration` in `vercel.json` if needed (max 60s for hobby)
- Consider processing smaller files or optimizing pandas code

### CORS Errors
- Default allows all origins (`*`)
- To restrict: Set `ALLOWED_ORIGINS` environment variable in Vercel
- Format: `https://your-domain.vercel.app,https://another-domain.com`

### File Upload Fails
- Check `/tmp` directory is writable (Vercel serverless)
- Verify file size < 4.5MB (Vercel limit)
- Check function logs for detailed error messages

## 📝 Key Changes Made

1. **Simplified `api/backend.py`** - Direct Flask app export, no middleware
2. **Serverless-aware file handling** - Uses `/tmp` on Vercel automatically
3. **Improved error handling** - Better error messages for debugging
4. **Fixed CORS configuration** - Works with wildcard and specific origins
5. **Frontend auto-routing** - Defaults to `/api/backend` when no env var set

## ✅ Ready to Deploy!

All checks pass. The code is ready for Vercel deployment.

