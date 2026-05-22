"""
Test what the frontend receives
"""
import requests
import json

# Simulate frontend request
url = "http://127.0.0.1:8000/api/v1/patients"
params = {
    "skip": 0,
    "limit": 10,
    "search": ""
}

print(f"Testing GET {url}")
print(f"Params: {params}")
print("-" * 60)

try:
    response = requests.get(url, params=params, timeout=5)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    
    # Check data structure
    data = response.json()
    if data.get('success'):
        patients = data.get('data', {}).get('patients', [])
        print(f"\n✅ Found {len(patients)} patient(s)")
        for patient in patients:
            print(f"  - {patient.get('prenom')} {patient.get('nom')} ({patient.get('code_patient')})")
    else:
        print(f"\n❌ Request failed: {data.get('message')}")
        
except Exception as e:
    print(f"❌ Error: {e}")
