#!/usr/bin/env python3
"""
Startup script for the financial data processing backend API
"""
import subprocess
import sys
import os
import time
import webbrowser
from pathlib import Path

def check_dependencies():
    """Check if required Python packages are installed"""
    try:
        import flask
        import pandas
        import numpy
        import openpyxl
        print("✅ All required dependencies are installed")
        return True
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        print("Installing required packages...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
            print("✅ Dependencies installed successfully")
            return True
        except subprocess.CalledProcessError:
            print("❌ Failed to install dependencies")
            return False

def start_backend():
    """Start the Flask backend server"""
    print("🚀 Starting Financial Data Processing Backend API...")
    print("=" * 60)
    
    # Check if we're in the right directory
    if not os.path.exists("backend_api.py"):
        print("❌ backend_api.py not found. Please run this script from the project root directory.")
        return False
    
    # Check dependencies
    if not check_dependencies():
        return False
    
    # Create uploads directory
    os.makedirs("uploads", exist_ok=True)
    print("📁 Created uploads directory")
    
    print("\n🌐 Backend API will be available at:")
    print("   • Health check: http://localhost:5000/health")
    print("   • Process file: POST http://localhost:5000/process-file")
    print("\n📊 Frontend should be running at: http://localhost:5173")
    print("\n" + "=" * 60)
    print("Starting server... (Press Ctrl+C to stop)")
    print("=" * 60)
    
    try:
        # Start the Flask server
        subprocess.run([sys.executable, "backend_api.py"])
    except KeyboardInterrupt:
        print("\n\n🛑 Backend server stopped by user")
        return True
    except Exception as e:
        print(f"\n❌ Error starting backend server: {e}")
        return False

if __name__ == "__main__":
    print("🏦 India Sweet House - Financial Data Processing Backend")
    print("=" * 60)
    
    success = start_backend()
    if not success:
        sys.exit(1)
