# Backend Integration Guide

This guide explains how to use the integrated backend processing system for the India Sweet House analytics dashboard.

## Overview

The system now includes a Python backend API that uses the sophisticated data processing logic from `data_backend.py` to handle Excel file uploads. This provides more accurate and robust data extraction compared to frontend-only processing.

## Architecture

```
Frontend (React) ←→ Backend API (Flask) ←→ data_backend.py logic
     ↓                    ↓
File Upload          Excel Processing
     ↓                    ↓
Analytics Dashboard  Clean Data Output
```

## Quick Start

### 1. Start the Backend API

```bash
# Option 1: Use the startup script (recommended)
python start_backend.py

# Option 2: Manual start
pip install -r requirements.txt
python backend_api.py
```

The backend will be available at `http://localhost:5000`

### 2. Start the Frontend

```bash
# In a separate terminal
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`

### 3. Upload Files

1. Open the web interface at `http://localhost:5173`
2. Go to the "Overview" tab
3. Upload your Excel file using the drag-and-drop area
4. The system will automatically:
   - Try backend processing first (more accurate)
   - Fall back to frontend processing if backend is unavailable
   - Display results in the analytics dashboard

## Backend API Endpoints

### Health Check
```
GET http://localhost:5000/health
```
Returns the status of the backend API.

### Process File
```
POST http://localhost:5000/process-file
Content-Type: multipart/form-data

file: [Excel file]
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "Outlet": "Outlet Name",
      "Outlet Manager": "Manager Name",
      "Month": "June",
      "Direct Income": 100000,
      "TOTAL REVENUE": 120000,
      "COGS": 30000,
      "Outlet Expenses": 20000,
      "EBIDTA": 70000,
      "Finance Cost": 5000,
      "PBT": 65000,
      "WASTAGE": 2000
    }
  ],
  "outlets_count": 5,
  "message": "Successfully processed 5 outlet records"
}
```

## Data Processing Features

The backend processing includes all the sophisticated logic from `data_backend.py`:

### 1. Automatic Header Detection
- Finds "PARTICULARS" column automatically
- Handles various Excel layouts and formats
- Robust scanning for outlet and manager names

### 2. Financial Metrics Extraction
- Direct Income
- Total Revenue
- COGS (Cost of Goods Sold)
- Outlet Expenses
- EBITDA
- Finance Cost
- PBT (Profit Before Tax)
- Wastage

### 3. Outlet Information
- Outlet names
- Manager names
- Month information
- Automatic data validation

### 4. Error Handling
- Comprehensive error messages
- Fallback to frontend processing
- Detailed logging for debugging

## File Format Requirements

The backend expects Excel files with:
- A "PARTICULARS" column containing financial metrics
- Month-based columns (e.g., "June-25", "July-25")
- Outlet names in rows above the data
- Manager names in rows above outlet names

## Troubleshooting

### Backend Not Starting
1. Check if port 5000 is available
2. Install dependencies: `pip install -r requirements.txt`
3. Check Python version (3.7+ required)

### File Processing Errors
1. Check file format (Excel files only)
2. Verify file has "PARTICULARS" column
3. Check console for detailed error messages
4. Try with a smaller file first

### Frontend Connection Issues
1. Ensure backend is running on port 5000
2. Check browser console for CORS errors
3. Verify network connectivity

## Development

### Adding New Features
1. Modify `backend_api.py` for API changes
2. Update `FileUpload.tsx` for frontend integration
3. Test with various file formats

### Debugging
- Backend logs are printed to console
- Frontend errors appear in browser console
- Use browser dev tools to inspect API calls

## Production Deployment

For production deployment:
1. Use a production WSGI server (e.g., Gunicorn)
2. Configure proper CORS settings
3. Set up file upload limits
4. Add authentication if needed
5. Use environment variables for configuration

## Support

If you encounter issues:
1. Check the console logs
2. Verify file format requirements
3. Test with the provided sample files
4. Check network connectivity between frontend and backend
