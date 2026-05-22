"""
Test the API with ML enabled
"""
import requests
import json

# API endpoint
url = "http://localhost:8000/api/v1/diagnostic/"

# Test request
data = {
    "age": 28,
    "sexe": "F",
    "symptomes": [
        "fièvre",
        "fatigue",
        "maux de tête",
        "frissons",
        "courbatures"
    ]
}

print("\n" + "="*60)
print("🧪 TEST DE L'API AVEC ML")
print("="*60)
print(f"\n📤 Requête:")
print(f"   URL: {url}")
print(f"   Patient: {data['age']} ans, {data['sexe']}")
print(f"   Symptômes: {', '.join(data['symptomes'])}")

try:
    response = requests.post(url, json=data, timeout=10)
    
    if response.status_code == 200:
        result = response.json()
        
        print(f"\n✅ Réponse reçue (Status: {response.status_code})")
        print(f"\n📊 Résultat:")
        print(f"   Success: {result['success']}")
        print(f"   Message: {result['message']}")
        print(f"   ML Enabled: {result['patient_info'].get('ml_enabled', 'N/A')}")
        
        print(f"\n🏥 Top 5 Diagnostics:")
        for i, diag in enumerate(result['diagnostics'][:5], 1):
            print(f"\n   {i}. {diag['maladie']}")
            print(f"      Score: {diag['score']:.1f}/100")
            print(f"      Urgence: {diag['urgence']}")
            print(f"      Arguments: {', '.join(diag['arguments'][:3])}")
        
        print("\n" + "="*60)
        print("✅ TEST RÉUSSI - L'API ML FONCTIONNE!")
        print("="*60)
        
    else:
        print(f"\n❌ Erreur HTTP {response.status_code}")
        print(response.text)
        
except requests.exceptions.ConnectionError:
    print("\n❌ ERREUR: Impossible de se connecter à l'API")
    print("   → Lancez le serveur: python run.py")
    
except Exception as e:
    print(f"\n❌ ERREUR: {e}")
