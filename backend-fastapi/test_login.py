"""
Test login endpoint
"""
import requests
import json

url = "http://127.0.0.1:8000/api/v1/auth/login"
data = {
    "email": "medecin@demo.com",
    "password": "demo123"
}

print(f"Testing POST {url}")
print(f"Data: {json.dumps(data, indent=2)}")
print("-" * 60)

try:
    response = requests.post(url, json=data, timeout=5)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e}")
