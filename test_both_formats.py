#!/usr/bin/env python3
"""
Test script to verify both data4.xlsx and data5.xlsx formats work
"""
import requests
import json
import os

def test_file_format(filename, format_name):
    """Test a specific file format"""
    print(f"\n🧪 Testing {format_name} ({filename})")
    print("-" * 50)
    
    if not os.path.exists(filename):
        print(f"❌ File {filename} not found")
        return False
    
    try:
        with open(filename, 'rb') as f:
            files = {'file': (filename, f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
            response = requests.post('http://localhost:5000/process-file', files=files, timeout=120)
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print(f"✅ {format_name} processing successful!")
                print(f"   Outlets processed: {result.get('outlets_count', 0)}")
                print(f"   Message: {result.get('message', 'No message')}")
                
                # Show sample data
                data = result.get('data', [])
                if data:
                    print(f"\n📊 Sample data (first record):")
                    sample_record = data[0]
                    for key, value in sample_record.items():
                        if value is not None:
                            print(f"   {key}: {value}")
                
                return True
            else:
                print(f"❌ {format_name} processing failed: {result.get('error', 'Unknown error')}")
                return False
        else:
            print(f"❌ HTTP Error {response.status_code}: {response.text[:200]}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing {format_name}: {e}")
        return False

def main():
    """Test both formats"""
    print("🧪 Testing Both File Formats")
    print("=" * 60)
    
    # Check if backend is running
    try:
        response = requests.get('http://localhost:5000/health', timeout=5)
        if response.status_code != 200:
            print("❌ Backend is not running. Please start it first:")
            print("   python start_all.py")
            return False
    except:
        print("❌ Backend is not running. Please start it first:")
        print("   python start_all.py")
        return False
    
    print("✅ Backend is running")
    
    # Test both formats
    results = []
    
    # Test data5.xlsx (clean format)
    results.append(test_file_format('data5.xlsx', 'Clean Format (data5.xlsx)'))
    
    # Test data4.xlsx (raw format)
    results.append(test_file_format('data4.xlsx', 'Raw Format (data4.xlsx)'))
    
    # Summary
    print("\n" + "=" * 60)
    print("📋 Test Results Summary")
    print("=" * 60)
    
    success_count = sum(results)
    total_count = len(results)
    
    if success_count == total_count:
        print("🎉 All formats working correctly!")
        print("\n✅ You can now upload both types of files through the web interface")
        print("🌐 Open http://localhost:5173 to start using the system")
    else:
        print(f"⚠️  {success_count}/{total_count} formats working")
        print("\n❌ Some formats need fixing. Check the errors above.")
    
    return success_count == total_count

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
