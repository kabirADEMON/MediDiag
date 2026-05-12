"""
Test diagnostic endpoint
"""
import requests
import json

url = "http://127.0.0.1:8000/api/v1/diagnostic/"
data = {
    "age": 15,
    "sexe": "F",
    "symptomes": ["Fièvre", "Toux"],
    "analyses": {}
}

print("Testing POST /diagnostic/")
print(f"Data: {json.dumps(data, indent=2)}")
print("-" * 60)

try:
    response = requests.post(url, json=data, timeout=30)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"\n✅ Success: {result.get('success')}")
        print(f"✅ Message: {result.get('message')}")
        
        if 'data' in result:
            data_obj = result['data']
            print(f"\n📊 Data keys: {list(data_obj.keys())}")
            
            if 'diagnostics' in data_obj:
                diagnostics = data_obj['diagnostics']
                print(f"\n🏥 Found {len(diagnostics)} diagnostic(s):")
                for i, diag in enumerate(diagnostics[:3], 1):
                    print(f"\n{i}. {diag.get('maladie')}")
                    print(f"   Score: {diag.get('score')}%")
                    print(f"   Urgence: {diag.get('urgence')}")
                    if diag.get('examens_recommandes'):
                        print(f"   Examens: {', '.join(diag['examens_recommandes'][:3])}")
            else:
                print(f"\n❌ No 'diagnostics' key in data")
                print(f"Full data: {json.dumps(data_obj, indent=2)}")
        else:
            print(f"\n❌ No 'data' key in response")
            print(f"Full response: {json.dumps(result, indent=2)}")
    else:
        print(f"\n❌ Error: {response.text}")
        
except Exception as e:
    print(f"\n❌ Exception: {e}")
