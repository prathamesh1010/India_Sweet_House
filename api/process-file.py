from http.server import BaseHTTPRequestHandler
import json
import tempfile
import os
import traceback
from data_processor import process_financial_data

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        return

    def do_POST(self):
        try:
            # Parse multipart form data
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            # Simple multipart parsing for file upload
            boundary = None
            for header in self.headers.get_all('Content-Type', []):
                if 'boundary=' in header:
                    boundary = header.split('boundary=')[1]
                    break
            
            if not boundary:
                self.send_error_response("No boundary found in multipart data")
                return
            
            # Parse the multipart data
            parts = post_data.split(f'--{boundary}'.encode())
            file_data = None
            filename = None
            
            for part in parts:
                if b'Content-Disposition: form-data' in part and b'filename=' in part:
                    # Extract filename
                    lines = part.split(b'\r\n')
                    for line in lines:
                        if b'filename=' in line:
                            filename = line.decode().split('filename="')[1].split('"')[0]
                            break
                    
                    # Find the file data (after the headers)
                    file_start = part.find(b'\r\n\r\n')
                    if file_start != -1:
                        file_data = part[file_start + 4:]
                        # Remove trailing boundary markers
                        if file_data.endswith(b'\r\n'):
                            file_data = file_data[:-2]
                        break
            
            if not file_data or not filename:
                self.send_error_response("No file found in request")
                return
            
            # Validate file type
            allowed_extensions = {'xlsx', 'xls', 'csv'}
            file_ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
            if file_ext not in allowed_extensions:
                self.send_error_response("File type not allowed. Please upload Excel files (.xlsx, .xls)")
                return
            
            # Save file temporarily
            with tempfile.NamedTemporaryFile(delete=False, suffix=f'.{file_ext}') as temp_file:
                temp_file.write(file_data)
                temp_path = temp_file.name
            
            try:
                # Process the file
                result = process_financial_data(temp_path)
                
                # Clean up temporary file
                try:
                    os.unlink(temp_path)
                except:
                    pass
                
                # Send response
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                self.wfile.write(json.dumps(result).encode())
                
            except Exception as e:
                # Clean up temporary file on error
                try:
                    os.unlink(temp_path)
                except:
                    pass
                raise e
                
        except Exception as e:
            self.send_error_response(f"Processing failed: {str(e)}")
    
    def send_error_response(self, error_message):
        self.send_response(500)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        response = {
            "success": False,
            "error": error_message,
            "traceback": traceback.format_exc()
        }
        
        self.wfile.write(json.dumps(response).encode())
