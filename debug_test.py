#!/usr/bin/env python3
"""
Debug test to see what the backend is returning
"""
import requests

def debug_response():
    """Debug the backend response"""
    try:
        with open('data5.xlsx', 'rb') as f:
            files = {'file': ('data5.xlsx', f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
            response = requests.post('http://localhost:5000/process-file', files=files, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        print(f"Content-Type: {response.headers.get('content-type', 'Unknown')}")
        print(f"Response Length: {len(response.text)}")
        print(f"First 500 characters:")
        print(response.text[:500])
        print(f"\nLast 500 characters:")
        print(response.text[-500:])
        
        # Try to find where the JSON might be malformed
        try:
            import json
            result = response.json()
            print("\n✅ JSON parsing successful!")
            print(f"Keys: {list(result.keys())}")
        except Exception as e:
            print(f"\n❌ JSON parsing failed: {e}")
            print("Looking for potential issues...")
            
            # Check for common JSON issues
            text = response.text
            if '\\' in text:
                print("Found backslashes in response")
            if '\n' in text:
                print("Found newlines in response")
            if '\r' in text:
                print("Found carriage returns in response")
                
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    debug_response()
