# Vercel Deployment Guide

## Fixed Issues

The deployment error `"Error: Command "pip3 install" exited with 2"` has been fixed by:

1. **Created `vercel.json`** - Properly configured for Vite/React frontend deployment
2. **Created `.vercelignore`** - Prevents Vercel from trying to process Python backend files
3. **Updated FileUpload.tsx** - Uses environment variable for backend URL configuration

## Deployment Steps

### 1. Deploy Frontend to Vercel

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Deploy to Vercel
vercel
```

Follow the prompts:
- Set up and deploy: Yes
- Which scope: Select your account
- Link to existing project: No
- Project name: (press Enter or provide name)
- Directory: ./
- Override settings: No

### 2. Configure Environment Variable

After deployment, add the backend URL as an environment variable:

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add: `VITE_BACKEND_URL` = `your-backend-url` (see backend deployment options below)

### 3. Deploy Backend (Choose One Option)

#### Option A: Deploy to Render (Recommended for Flask)

1. Create account at [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: sweetmart-backend
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python backend_api.py`
5. Deploy and copy the URL
6. Add this URL to Vercel environment variable `VITE_BACKEND_URL`

#### Option B: Deploy to Railway

1. Create account at [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-detect Python and deploy
5. Copy the generated URL
6. Add this URL to Vercel environment variable `VITE_BACKEND_URL`

#### Option C: Keep Backend Local (Development Only)

For local development:
```bash
# In one terminal - run backend
python backend_api.py

# In another terminal - run frontend
npm run dev
```

### 4. Redeploy Frontend

After adding the environment variable:
```bash
vercel --prod
```

## Project Structure

```
├── src/                    # React frontend (deployed to Vercel)
├── backend_api.py          # Flask backend (deploy separately)
├── requirements.txt        # Python dependencies
├── vercel.json            # Vercel configuration
├── .vercelignore          # Ignore Python files in Vercel
└── .env.example           # Environment variable template
```

## Environment Variables

### Frontend (Vercel)
- `VITE_BACKEND_URL` - URL of your deployed Flask backend

### Backend (Render/Railway)
No additional environment variables required for basic setup.

## Testing Deployment

1. Visit your Vercel URL
2. Try uploading an Excel file
3. Check browser console for any API connection errors
4. Verify data is processed correctly

## Troubleshooting

### CORS Errors
If you see CORS errors, ensure your backend has proper CORS configuration:
```python
from flask_cors import CORS
app = Flask(__name__)
CORS(app, origins=["https://your-vercel-domain.vercel.app"])
```

### Backend Not Responding
- Verify the backend URL in Vercel environment variables
- Check backend logs in Render/Railway dashboard
- Ensure backend is running and accessible

### Build Failures
- Clear Vercel cache: `vercel --force`
- Check build logs in Vercel dashboard
- Ensure all npm dependencies are in package.json
