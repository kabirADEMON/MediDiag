"""
Test metadata endpoints
"""
import requests
import json

base_url = "http://127.0.0.1:8000/api/v1"

print("=" * 60)
print("Testing Metadata Endpoints")
print("=" * 60)

# Test 1: Get all symptoms
print("\n1. Testing GET /metadata/symptoms")
response = requests.get(f"{base_url}/metadata/symptoms")
print(f"Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(f"✅ Success: {data['success']}")
    print(f"✅ Total symptoms: {data['data']['total']}")
    print(f"✅ First 5 symptoms:")
    for symptom in data['data']['symptoms'][:5]:
        print(f"   - {symptom}")
else:
    print(f"❌ Error: {response.text}")

# Test 2: Search symptoms
print("\n2. Testing GET /metadata/symptoms?search=fièvre")
response = requests.get(f"{base_url}/metadata/symptoms", params={"search": "fièvre"})
print(f"Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(f"✅ Found {data['data']['total']} symptoms with 'fièvre'")
    for symptom in data['data']['symptoms'][:5]:
        print(f"   - {symptom}")
else:
    print(f"❌ Error: {response.text}")

# Test 3: Get popular symptoms
print("\n3. Testing GET /metadata/symptoms/popular")
response = requests.get(f"{base_url}/metadata/symptoms/popular", params={"limit": 10})
print(f"Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(f"✅ Top 10 popular symptoms:")
    for item in data['data']['symptoms']:
        print(f"   - {item['name']} (count: {item['count']})")
else:
    print(f"❌ Error: {response.text}")

# Test 4: Get all analyses
print("\n4. Testing GET /metadata/analyses")
response = requests.get(f"{base_url}/metadata/analyses")
print(f"Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(f"✅ Total analyses: {data['data']['total']}")
    print(f"✅ First 5 analyses:")
    for analysis in data['data']['analyses'][:5]:
        print(f"   - {analysis['name']} ({analysis['unit']}) - Normal: {analysis['normal_range']}")
else:
    print(f"❌ Error: {response.text}")

# Test 5: Get popular analyses
print("\n5. Testing GET /metadata/analyses/popular")
response = requests.get(f"{base_url}/metadata/analyses/popular", params={"limit": 10})
print(f"Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(f"✅ Top 10 popular analyses:")
    for item in data['data']['analyses']:
        print(f"   - {item['name']} (count: {item['count']})")
else:
    print(f"❌ Error: {response.text}")

print("\n" + "=" * 60)
print("All tests completed!")
print("=" * 60)
