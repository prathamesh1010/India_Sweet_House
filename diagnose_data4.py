import requests
import os
import json

def diagnose_data4():
    print("🔍 Diagnosing data4.xlsx processing...")
    print("=" * 50)
    
    if not os.path.exists('data4.xlsx'):
        print("❌ data4.xlsx not found in current directory")
        return
    
    try:
        with open('data4.xlsx', 'rb') as f:
            files = {'file': ('data4.xlsx', f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
            response = requests.post('http://localhost:5000/process-file', files=files, timeout=30)
        
        print(f"📊 Backend Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Success: {result.get('success')}")
            print(f"📈 Records processed: {result.get('outlets_count', 0)}")
            print(f"💬 Message: {result.get('message', 'No message')}")
            
            data = result.get('data', [])
            if data:
                print(f"\n📋 Data Structure Analysis:")
                print(f"   Total records: {len(data)}")
                
                # Analyze first record
                first_record = data[0]
                print(f"\n🔍 First Record Analysis:")
                for key, value in first_record.items():
                    print(f"   {key}: {value} ({type(value).__name__})")
                
                # Check for required fields
                required_fields = ['Outlet', 'Outlet Manager', 'TOTAL REVENUE']
                print(f"\n✅ Required Fields Check:")
                for field in required_fields:
                    if field in first_record:
                        print(f"   ✓ {field}: {first_record[field]}")
                    else:
                        print(f"   ✗ {field}: MISSING")
                
                # Check data quality
                print(f"\n📊 Data Quality Analysis:")
                outlets = [row.get('Outlet', '') for row in data if row.get('Outlet')]
                managers = [row.get('Outlet Manager', '') for row in data if row.get('Outlet Manager')]
                revenues = [row.get('TOTAL REVENUE', 0) for row in data if row.get('TOTAL REVENUE')]
                
                print(f"   Unique outlets: {len(set(outlets))}")
                print(f"   Unique managers: {len(set(managers))}")
                print(f"   Records with revenue: {len([r for r in revenues if r and r > 0])}")
                print(f"   Total revenue: {sum([r for r in revenues if r and r > 0]):,.2f}")
                
                # Check for any null/empty values
                null_counts = {}
                for key in first_record.keys():
                    null_count = sum(1 for row in data if not row.get(key) or row.get(key) == '')
                    if null_count > 0:
                        null_counts[key] = null_count
                
                if null_counts:
                    print(f"\n⚠️  Fields with null/empty values:")
                    for field, count in null_counts.items():
                        print(f"   {field}: {count} records")
                else:
                    print(f"\n✅ No null/empty values found")
                    
            else:
                print("❌ No data returned from backend")
                
        else:
            print(f"❌ Backend error: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Exception during processing: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    diagnose_data4()
