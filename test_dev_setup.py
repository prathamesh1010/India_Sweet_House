#!/usr/bin/env python3
"""
Test script to verify that npm run dev starts both frontend and backend
"""
import subprocess
import time
import requests
import sys
import os
from pathlib import Path

def test_backend():
    """Test if backend is running"""
    try:
        response = requests.get("http://localhost:5000/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend API is running at http://localhost:5000")
            return True
        else:
            print(f"❌ Backend API returned status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend API test failed: {e}")
        return False

def test_frontend():
    """Test if frontend is running"""
    try:
        response = requests.get("http://localhost:5173", timeout=5)
        if response.status_code == 200:
            print("✅ Frontend is running at http://localhost:5173")
            return True
        else:
            print(f"❌ Frontend returned status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Frontend test failed: {e}")
        return False

def main():
    print("🧪 Testing npm run dev setup...")
    print("=" * 50)
    
    # Wait a bit for services to start
    print("⏳ Waiting for services to start (10 seconds)...")
    time.sleep(10)
    
    backend_ok = test_backend()
    frontend_ok = test_frontend()
    
    print("\n" + "=" * 50)
    if backend_ok and frontend_ok:
        print("🎉 SUCCESS: Both frontend and backend are running!")
        print("✅ npm run dev is working correctly")
    else:
        print("❌ FAILED: Some services are not running")
        if not backend_ok:
            print("   - Backend API is not accessible")
        if not frontend_ok:
            print("   - Frontend is not accessible")
    
    return backend_ok and frontend_ok

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
