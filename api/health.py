from flask import Flask, jsonify
from flask_cors import CORS

# Vercel expects an 'app' instance to be exposed
app = Flask(__name__)
CORS(app)

@app.route('/', methods=['GET'])
def health():
    """
    This function handles requests to /api/health, as determined by the file path.
    The Flask router then directs the request at the root of the app to this function.
    """
    return jsonify({
        "status": "healthy",
        "message": "Backend API is running on Vercel"
    })
