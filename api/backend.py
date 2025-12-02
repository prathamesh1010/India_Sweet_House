"""
Vercel serverless function entry point for Flask app
"""
import sys
import os

# Add parent directory to path so we can import backend_api
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from backend_api import app

# Export the Flask app for Vercel
# Vercel will automatically handle routing to this app
__all__ = ['app']
