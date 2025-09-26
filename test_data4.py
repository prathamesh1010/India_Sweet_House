import requests
import os

def test_data4():
    if os.path.exists('data4.xlsx'):
        print('Testing data4.xlsx...')
        try:
            with open('data4.xlsx', 'rb') as f:
                files = {'file': ('data4.xlsx', f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
                response = requests.post('http://localhost:5000/process-file', files=files, timeout=30)
            
            print(f'Status Code: {response.status_code}')
            if response.status_code == 200:
                result = response.json()
                print(f'Success: {result.get("success")}')
                if result.get('success'):
                    print(f'Records processed: {result.get("outlets_count", 0)}')
                    print(f'Message: {result.get("message", "No message")}')
                    
                    # Show sample data
                    data = result.get('data', [])
                    if data:
                        print(f'\nSample data (first record):')
                        sample_record = data[0]
                        for key, value in sample_record.items():
                            print(f'   {key}: {value}')
                else:
                    print(f'Error: {result.get("error", "Unknown error")}')
                    if 'traceback' in result:
                        print(f'Traceback: {result["traceback"]}')
            else:
                print(f'Error response: {response.text}')
        except Exception as e:
            print(f'Exception: {e}')
    else:
        print('data4.xlsx not found in current directory')

if __name__ == "__main__":
    test_data4()
