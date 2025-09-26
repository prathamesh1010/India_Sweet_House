# Vercel Deployment Guide

This guide will help you deploy your India Sweet House Analytics application to Vercel with both frontend and backend functionality.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Git Repository**: Your project should be in a Git repository (GitHub, GitLab, or Bitbucket)
3. **Vercel CLI** (optional): Install with `npm i -g vercel`

## Project Structure

The project has been configured for Vercel deployment with the following structure:

```
├── api/                          # Serverless functions
│   ├── health.py                # Health check endpoint
│   ├── process-file.py          # File processing endpoint
│   ├── interest-analysis.py     # Interest analysis endpoint
│   ├── data_processor.py       # Shared data processing logic
│   └── requirements.txt        # Python dependencies
├── src/                         # React frontend
├── vercel.json                  # Vercel configuration
├── .vercelignore               # Files to exclude from deployment
└── package.json                # Node.js dependencies
```

## Deployment Steps

### Method 1: Deploy via Vercel Dashboard (Recommended)

1. **Push to Git Repository**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your Git repository
   - Vercel will automatically detect the configuration

3. **Configure Build Settings**
   - **Framework Preset**: Vite
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete
   - Your app will be available at `https://your-project-name.vercel.app`

### Method 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```
   - Follow the prompts to configure your project
   - Choose your Git repository
   - Vercel will automatically detect the configuration

## Configuration Details

### Vercel Configuration (`vercel.json`)

The `vercel.json` file configures:
- **Frontend Build**: Static React app built with Vite
- **API Routes**: Python serverless functions for backend processing
- **CORS**: Enabled for cross-origin requests
- **Function Timeouts**: Optimized for file processing (30s max)

### API Endpoints

After deployment, your API will be available at:
- `https://your-domain.vercel.app/api/health` - Health check
- `https://your-domain.vercel.app/api/process-file` - File processing
- `https://your-domain.vercel.app/api/interest-analysis` - Interest analysis

### Environment Variables

The frontend automatically detects the environment:
- **Development**: Uses `http://localhost:5000` for local backend
- **Production**: Uses `/api` for Vercel serverless functions

## Testing Your Deployment

### 1. Health Check
```bash
curl https://your-domain.vercel.app/api/health
```
Expected response:
```json
{
  "status": "healthy",
  "message": "Backend API is running on Vercel"
}
```

### 2. File Upload Test
- Open your deployed application
- Navigate to the file upload section
- Upload a sample Excel file (.xlsx or .xls)
- Verify that the data is processed and displayed correctly

### 3. Analytics Features
- Test the dashboard overview
- Check the analytics charts
- Verify interest analysis functionality
- Test the data table with filtering and sorting

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check that all dependencies are in `package.json`
   - Ensure Python dependencies are in `api/requirements.txt`
   - Verify `vercel.json` configuration

2. **API Errors**
   - Check Vercel function logs in the dashboard
   - Verify file upload limits (Vercel has 4.5MB limit for serverless functions)
   - Ensure CORS headers are properly set

3. **File Processing Issues**
   - Large Excel files may timeout (30s limit)
   - Check file format compatibility
   - Verify data structure matches expected format

### Debugging

1. **View Logs**
   - Go to Vercel Dashboard → Your Project → Functions
   - Click on individual function to view logs

2. **Local Testing**
   ```bash
   # Test frontend locally
   npm run dev:frontend
   
   # Test backend locally
   npm run dev:backend
   ```

3. **Vercel CLI Debugging**
   ```bash
   vercel logs
   ```

## Performance Optimization

### For Large Files
- The API processes files in chunks (limited to 1000 rows)
- Consider implementing pagination for very large datasets
- Use streaming for better memory management

### For Better UX
- Implement loading states for file uploads
- Add progress indicators for long-running operations
- Cache processed data when possible

## Security Considerations

1. **File Upload Security**
   - File type validation is implemented
   - File size limits are enforced
   - Temporary files are cleaned up after processing

2. **CORS Configuration**
   - CORS is enabled for all origins in development
   - Consider restricting CORS in production if needed

3. **Environment Variables**
   - No sensitive data is stored in the codebase
   - All configuration is environment-specific

## Scaling Considerations

- **Vercel Limits**: 100GB bandwidth, 1000 serverless function invocations per month (free tier)
- **Upgrade Options**: Vercel Pro for higher limits and better performance
- **Database Integration**: Consider adding a database for persistent storage if needed

## Support

If you encounter issues:
1. Check the Vercel documentation: [vercel.com/docs](https://vercel.com/docs)
2. Review the function logs in Vercel Dashboard
3. Test locally first to isolate issues
4. Check the GitHub repository for updates

## Next Steps

After successful deployment:
1. Set up a custom domain (optional)
2. Configure environment variables if needed
3. Set up monitoring and analytics
4. Consider implementing user authentication
5. Add database integration for data persistence
