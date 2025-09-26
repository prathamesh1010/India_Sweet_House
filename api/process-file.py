import json
import tempfile
import os
import traceback
import cgi
import io
from api.data_processor import process_financial_data

def handler(request):
    """
    Vercel serverless function handler for file processing
    """
    # Set CORS headers
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    }
    
    # Handle OPTIONS request for CORS
    if request.method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': ''
        }
    
    # Only allow POST requests
    if request.method != 'POST':
        return {
            'statusCode': 405,
            'headers': headers,
            'body': json.dumps({
                "success": False,
                "error": "Method not allowed. Use POST."
            })
        }
    
    try:
        # Parse multipart form data
        content_type = request.headers.get('content-type', '')
        if not content_type.startswith('multipart/form-data'):
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({
                    "success": False,
                    "error": "Content-Type must be multipart/form-data"
                })
            }
        
        # Get the request body
        body = request.body
        if isinstance(body, str):
            body = body.encode('utf-8')
        
        # Parse the multipart data
        fp = io.BytesIO(body)
        environ = {
            'REQUEST_METHOD': 'POST',
            'CONTENT_TYPE': content_type,
            'CONTENT_LENGTH': str(len(body))
        }
        
        form = cgi.FieldStorage(fp=fp, environ=environ)
        
        # Check if file was uploaded
        if 'file' not in form:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({
                    "success": False,
                    "error": "No file provided"
                })
            }
        
        file_item = form['file']
        if not file_item.filename:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({
                    "success": False,
                    "error": "No file selected"
                })
            }
        
        # Validate file type
        allowed_extensions = {'xlsx', 'xls', 'csv'}
        filename = file_item.filename
        if not ('.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions):
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({
                    "success": False,
                    "error": "File type not allowed. Please upload Excel files (.xlsx, .xls)"
                })
            }
        
        # Save file temporarily
        temp_path = os.path.join('/tmp', filename)
        with open(temp_path, 'wb') as temp_file:
            temp_file.write(file_item.file.read())
        
        try:
            # Process the file
            result = process_financial_data(temp_path)
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps(result)
            }
        finally:
            # Clean up temporary file
            if os.path.exists(temp_path):
                os.remove(temp_path)
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                "success": False,
                "error": f"An unexpected error occurred: {str(e)}",
                "traceback": traceback.format_exc()
            })
        }