from flask import Flask, request, jsonify
from flask_cors import CORS
import tempfile
import os
import traceback
from werkzeug.utils import secure_filename
import sys
sys.path.append('/var/task')
from api.data_processor import process_financial_data

app = Flask(__name__)
CORS(app)

@app.route('/api/process-file', methods=['POST'])
def process_file():
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
        temp_path = os.path.join('/tmp', filename)
        file.save(temp_path)

        try:
            result = process_financial_data(temp_path)
            return jsonify(result)
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"An unexpected error occurred: {str(e)}",
            "traceback": traceback.format_exc()
        }), 500

# This is required for Vercel
if __name__ == '__main__':
    app.run()