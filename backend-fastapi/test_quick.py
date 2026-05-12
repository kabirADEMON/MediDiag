import requests
import json

url = 'http://localhost:8000/api/v1/diagnostic/'
data = {
    'age': 28,
    'sexe': 'F',
    'symptomes': ['fièvre', 'fatigue', 'maux de tête', 'frissons','céphalé','Douleurs abdominales droites']
}

print("🧪 Test du diagnostic avec ML...")
r = requests.post(url, json=data)
result = r.json()

print(f"\n✅ Status: {r.status_code}")
print(f"📊 Message: {result['message']}")
print(f"🤖 ML Enabled: {result['patient_info'].get('ml_enabled', 'N/A')}")
print(f"\n🏥 Top 3 Diagnostics:")
for i, d in enumerate(result['diagnostics'][:3], 1):
    print(f"  {i}. {d['maladie']} - Score: {d['score']:.1f}/100 - Urgence: {d['urgence']}")
