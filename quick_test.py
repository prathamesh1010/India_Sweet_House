#!/usr/bin/env python3
"""
Quick test for backend file processing
"""
import requests
import json

def test_file_upload():
    """Test file upload to backend"""
    try:
        # Test with data5.xlsx
        with open('data5.xlsx', 'rb') as f:
            files = {'file': ('data5.xlsx', f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
            response = requests.post('http://localhost:5000/process-file', files=files, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            try:
                result = response.json()
                print("✅ File processing successful!")
                print(f"Outlets processed: {result.get('outlets_count', 0)}")
                print(f"Message: {result.get('message', 'No message')}")
                
                # Show first few records
                data = result.get('data', [])
                if data:
                    print(f"\n📊 Sample data (first 2 records):")
                    for i, record in enumerate(data[:2]):
                        print(f"\nRecord {i+1}:")
                        for key, value in record.items():
                            print(f"  {key}: {value}")
                
                return True
            except json.JSONDecodeError as e:
                print(f"❌ JSON parsing error: {e}")
                print(f"Raw response: {response.text[:500]}...")
                return False
        else:
            print(f"❌ HTTP Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Quick Backend Test")
    print("=" * 40)
    success = test_file_upload()
    if success:
        print("\n🎉 Backend is working correctly!")
        print("You can now use the frontend at http://localhost:5173")
    else:
        print("\n❌ Backend test failed")
