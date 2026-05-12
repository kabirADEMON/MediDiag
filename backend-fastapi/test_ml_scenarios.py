"""
Test ML with different clinical scenarios
"""
import requests
import json

API_URL = 'http://localhost:8000/api/v1/diagnostic/'

# Different clinical scenarios
scenarios = [
    {
        "name": "🦟 Cas 1: Paludisme typique",
        "data": {
            "age": 28,
            "sexe": "F",
            "symptomes": [
                "fièvre élevée",
                "frissons",
                "sueurs",
                "maux de tête",
                "fatigue intense",
                "courbatures"
            ]
        }
    },
    {
        "name": "🤒 Cas 2: Grippe",
        "data": {
            "age": 35,
            "sexe": "M",
            "symptomes": [
                "fièvre",
                "toux sèche",
                "maux de gorge",
                "fatigue",
                "courbatures",
                "maux de tête"
            ]
        }
    },
    {
        "name": "🤢 Cas 3: Gastro-entérite",
        "data": {
            "age": 22,
            "sexe": "F",
            "symptomes": [
                "diarrhée",
                "vomissements",
                "douleurs abdominales",
                "nausées",
                "fièvre légère"
            ]
        }
    },
    {
        "name": "💉 Cas 4: Typhoïde",
        "data": {
            "age": 30,
            "sexe": "M",
            "symptomes": [
                "fièvre prolongée",
                "maux de tête",
                "douleurs abdominales",
                "constipation",
                "fatigue",
                "perte d'appétit"
            ]
        }
    },
    {
        "name": "🫁 Cas 5: Pneumonie",
        "data": {
            "age": 45,
            "sexe": "F",
            "symptomes": [
                "toux grasse",
                "fièvre élevée",
                "douleur thoracique",
                "essoufflement",
                "fatigue",
                "expectorations"
            ]
        }
    },
    {
        "name": "🦠 Cas 6: Dengue",
        "data": {
            "age": 25,
            "sexe": "M",
            "symptomes": [
                "fièvre élevée",
                "maux de tête sévères",
                "douleurs articulaires",
                "douleurs musculaires",
                "éruption cutanée",
                "fatigue"
            ]
        }
    },
    {
        "name": "🩺 Cas 7: Méningite",
        "data": {
            "age": 20,
            "sexe": "F",
            "symptomes": [
                "fièvre élevée",
                "maux de tête intenses",
                "raideur de la nuque",
                "photophobie",
                "vomissements",
                "confusion"
            ]
        }
    },
    {
        "name": "🫀 Cas 8: Anémie sévère",
        "data": {
            "age": 32,
            "sexe": "F",
            "symptomes": [
                "fatigue extrême",
                "pâleur",
                "essoufflement",
                "vertiges",
                "palpitations",
                "faiblesse"
            ]
        }
    }
]

def test_scenario(scenario):
    """Test a single scenario"""
    print("\n" + "="*70)
    print(scenario["name"])
    print("="*70)
    
    data = scenario["data"]
    print(f"👤 Patient: {data['age']} ans, {data['sexe']}")
    print(f"🩺 Symptômes: {', '.join(data['symptomes'])}")
    
    try:
        response = requests.post(API_URL, json=data, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            
            ml_enabled = result['patient_info'].get('ml_enabled', False)
            print(f"\n🤖 ML: {'✅ Activé' if ml_enabled else '❌ Désactivé'}")
            print(f"📊 {result['message']}")
            
            print(f"\n🏥 Top 5 Diagnostics:")
            for i, diag in enumerate(result['diagnostics'][:5], 1):
                urgence_emoji = {
                    'critique': '🚨',
                    'élevée': '⚠️',
                    'modérée': '🟡',
                    'faible': '🟢'
                }.get(diag['urgence'], '⚪')
                
                print(f"\n   {i}. {diag['maladie']}")
                print(f"      Score: {diag['score']:.1f}/100")
                print(f"      Urgence: {urgence_emoji} {diag['urgence']}")
                
                if diag.get('arguments'):
                    args = ', '.join(diag['arguments'][:3])
                    print(f"      Arguments: {args}")
                
                if diag.get('examens_recommandes'):
                    exams = ', '.join(diag['examens_recommandes'][:3])
                    print(f"      Examens: {exams}")
            
            return True
        else:
            print(f"\n❌ Erreur HTTP {response.status_code}")
            print(response.text)
            return False
            
    except requests.exceptions.ConnectionError:
        print("\n❌ ERREUR: Impossible de se connecter à l'API")
        print("   → Lancez le serveur: python run.py")
        return False
        
    except Exception as e:
        print(f"\n❌ ERREUR: {e}")
        return False


def main():
    """Run all scenarios"""
    print("\n" + "="*70)
    print("🧪 TEST DU MODÈLE ML AVEC DIFFÉRENTS SCÉNARIOS CLINIQUES")
    print("="*70)
    
    results = []
    
    for scenario in scenarios:
        success = test_scenario(scenario)
        results.append((scenario["name"], success))
    
    # Summary
    print("\n" + "="*70)
    print("📊 RÉSUMÉ DES TESTS")
    print("="*70)
    
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    for name, success in results:
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"   {status} - {name}")
    
    print("\n" + "="*70)
    print(f"   Total: {passed}/{total} tests réussis ({passed/total*100:.0f}%)")
    print("="*70)
    
    return 0 if passed == total else 1


if __name__ == '__main__':
    import sys
    sys.exit(main())
