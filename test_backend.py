#!/usr/bin/env python3
"""
Test script for the backend API integration
"""
import requests
import json
import os
import time

def test_backend_health():
    """Test if the backend API is running"""
    try:
        response = requests.get('http://localhost:5000/health', timeout=5)
        if response.status_code == 200:
            print("✅ Backend API is running")
            print(f"   Response: {response.json()}")
            return True
        else:
            print(f"❌ Backend API returned status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Backend API is not running or not accessible")
        return False
    except Exception as e:
        print(f"❌ Error testing backend: {e}")
        return False

def test_file_processing():
    """Test file processing with a sample file"""
    # Check if we have a sample file
    sample_files = ['data5.xlsx', 'data4.xlsx']
    sample_file = None
    
    for file in sample_files:
        if os.path.exists(file):
            sample_file = file
            break
    
    if not sample_file:
        print("⚠️  No sample Excel file found for testing")
        print("   Please ensure data5.xlsx or data4.xlsx is in the current directory")
        return False
    
    print(f"📁 Testing with sample file: {sample_file}")
    
    try:
        with open(sample_file, 'rb') as f:
            files = {'file': (sample_file, f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
            response = requests.post('http://localhost:5000/process-file', files=files, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print("✅ File processing successful")
                print(f"   Processed {result.get('outlets_count', 0)} outlet records")
                print(f"   Message: {result.get('message', 'No message')}")
                
                # Show sample data
                data = result.get('data', [])
                if data:
                    print(f"\n📊 Sample data (first record):")
                    sample_record = data[0]
                    for key, value in sample_record.items():
                        print(f"   {key}: {value}")
                
                return True
            else:
                print(f"❌ File processing failed: {result.get('error', 'Unknown error')}")
                return False
        else:
            print(f"❌ API returned status {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing file processing: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Testing Backend Integration")
    print("=" * 50)
    
    # Test 1: Health check
    print("\n1. Testing backend health...")
    health_ok = test_backend_health()
    
    if not health_ok:
        print("\n❌ Backend is not running. Please start it first:")
        print("   python start_backend.py")
        return False
    
    # Test 2: File processing
    print("\n2. Testing file processing...")
    processing_ok = test_file_processing()
    
    # Summary
    print("\n" + "=" * 50)
    if health_ok and processing_ok:
        print("🎉 All tests passed! Backend integration is working correctly.")
        print("\nNext steps:")
        print("1. Start the frontend: npm run dev")
        print("2. Open http://localhost:5173")
        print("3. Upload your Excel files")
    else:
        print("❌ Some tests failed. Please check the issues above.")
    
    return health_ok and processing_ok

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
