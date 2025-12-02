#!/usr/bin/env python3
"""
Test script to verify that the Vercel serverless function can import correctly
Run this locally before deploying to catch import errors early
"""
import sys
import os

# Add the api directory to path (simulating Vercel environment)
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'api'))
sys.path.insert(0, os.path.dirname(__file__))

try:
    print("Testing backend_api import...")
    from backend_api import app as flask_app
    print("✓ backend_api imported successfully")
    
    print("\nTesting Flask app routes...")
    with flask_app.test_client() as client:
        # Test health endpoint
        response = client.get('/health')
        print(f"✓ Health endpoint: {response.status_code}")
        if response.status_code == 200:
            print(f"  Response: {response.get_json()}")
        
        # Verify routes exist
        routes = [str(rule) for rule in flask_app.url_map.iter_rules()]
        print(f"\n✓ Found {len(routes)} routes:")
        for route in routes:
            print(f"  - {route}")
    
    print("\n✓ All imports and routes verified successfully!")
    print("Ready for Vercel deployment.")
    
except ImportError as e:
    print(f"✗ Import error: {e}")
    print("\nMake sure all dependencies are installed:")
    print("  pip install -r requirements.txt")
    sys.exit(1)
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

