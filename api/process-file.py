from flask import Flask, request, jsonify
from flask_cors import CORS
import tempfile
import os
import traceback
from werkzeug.utils import secure_filename
from data_processor import process_financial_data

# Vercel expects an 'app' instance to be exposed
app = Flask(__name__)
CORS(app)

@app.route('/', methods=['POST'])
def process_file_handler():
    """
    This function handles POST requests to /api/process-file.
    Flask's request object correctly handles multipart/form-data.
    """
    try:
        if 'file' not in request.files:
            return jsonify({"success": False, "error": "No file provided"}), 400

        file = request.files['file']
        
        if file.filename == '':
            return jsonify({"success": False, "error": "No file selected"}), 400

        allowed_extensions = {'xlsx', 'xls', 'csv'}
        if not ('.' in file.filename and file.filename.rsplit('.', 1)[1].lower() in allowed_extensions):
            return jsonify({"success": False, "error": "File type not allowed. Please upload Excel files (.xlsx, .xls)"}), 400

        filename = secure_filename(file.filename)
        
        # Serverless functions have a writable /tmp directory
        temp_dir = '/tmp'
        temp_path = os.path.join(temp_dir, filename)
        file.save(temp_path)

        result = {}
        try:
            result = process_financial_data(temp_path)
        finally:
            # Ensure the temporary file is always removed
            if os.path.exists(temp_path):
                os.remove(temp_path)
        
        return jsonify(result)

    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"An unexpected error occurred: {str(e)}",
            "traceback": traceback.format_exc()
        }), 500
