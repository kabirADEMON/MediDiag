"""
Test complet avec tous les paramètres: âge, sexe, symptômes, analyses, résultats
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

import requests
import json

API_URL = 'http://localhost:8000/api/v1/diagnostic/'

def test_complete_case(case_name: str, data: dict):
    """Test un cas complet avec tous les paramètres"""
    print("\n" + "="*70)
    print(f"🔬 TEST: {case_name}")
    print("="*70)
    
    print(f"\n📋 DONNÉES DU PATIENT:")
    print(f"   • Âge: {data['age']} ans")
    print(f"   • Sexe: {data['sexe']}")
    print(f"\n   • Symptômes ({len(data['symptomes'])}):")
    for i, symptom in enumerate(data['symptomes'], 1):
        print(f"     {i}. {symptom}")
    
    try:
        response = requests.post(API_URL, json=data, timeout=60)
        
        if response.status_code == 200:
            result = response.json()
            
            print(f"\n✅ DIAGNOSTIC RÉUSSI")
            print(f"   Message: {result['message']}")
            
            diagnostics = result['diagnostics']
            
            print(f"\n📊 TOP 5 DIAGNOSTICS:")
            for i, diag in enumerate(diagnostics[:5], 1):
                print(f"\n   {i}. {diag['maladie']}")
                print(f"      • Score: {diag['score']:.1f}/100")
                print(f"      • Urgence: {diag['urgence']}")
                print(f"      • Compatible âge: {'✅' if diag['compatibilite_age'] else '❌'}")
                print(f"      • Compatible sexe: {'✅' if diag['compatibilite_sexe'] else '❌'}")
                
                if diag.get('examens_recommandes'):
                    print(f"      • Examens recommandés:")
                    for exam in diag['examens_recommandes'][:3]:
                        print(f"        - {exam}")
                
                if diag.get('arguments'):
                    print(f"      • Arguments:")
                    for arg in diag['arguments'][:3]:
                        print(f"        - {arg}")
            
            # Afficher les infos patient
            patient_info = result.get('patient_info', {})
            if patient_info.get('ml_enabled'):
                print(f"\n🤖 IA Machine Learning: ACTIVÉE")
            else:
                print(f"\n⚠️  IA Machine Learning: DÉSACTIVÉE (fuzzy matching uniquement)")
            
            return True
        else:
            print(f"\n❌ ERREUR: {response.status_code}")
            print(f"   {response.text}")
            return False
            
    except Exception as e:
        print(f"\n❌ ERREUR: {e}")
        return False


def main():
    """Exécuter les tests complets"""
    print("\n" + "="*70)
    print("🧪 TEST COMPLET DU SYSTÈME DE DIAGNOSTIC")
    print("="*70)
    print("\nTest avec: Âge + Sexe + Symptômes + Analyses + Résultats")
    
    # Test 1: Paludisme avec analyses
    test1 = {
        "age": 35,
        "sexe": "M",
        "symptomes": [
            "Fièvre",
            "Frissons",
            "Sueurs",
            "Maux de tête",
            "Fatigue",
            "Nausées",
            "Hémogramme",
            "Frottis sanguin",
            "Parasites Plasmodium visibles"
        ]
    }
    test_complete_case("Paludisme (Homme, 35 ans) avec analyses", test1)
    
    # Test 2: Typhoïde avec analyses complètes
    test2 = {
        "age": 28,
        "sexe": "F",
        "symptomes": [
            "Fièvre prolongée",
            "Douleur abdominale",
            "Diarrhée",
            "Céphalées",
            "Fatigue",
            "Hémoculture",
            "Coproculture",
            "Salmonella typhi isolée",
            "Leucopénie"
        ]
    }
    test_complete_case("Typhoïde (Femme, 28 ans) avec analyses", test2)
    
    # Test 3: Pneumonie avec résultats d'examens
    test3 = {
        "age": 65,
        "sexe": "M",
        "symptomes": [
            "Toux productive",
            "Fièvre élevée",
            "Douleur thoracique",
            "Dyspnée",
            "Radiographie thoracique",
            "Opacité alvéolaire",
            "Leucocytes élevés",
            "CRP élevée"
        ]
    }
    test_complete_case("Pneumonie (Homme, 65 ans) avec radiographie", test3)
    
    # Test 4: Méningite avec ponction lombaire
    test4 = {
        "age": 22,
        "sexe": "F",
        "symptomes": [
            "Céphalées sévères",
            "Fièvre élevée",
            "Raideur de la nuque",
            "Photophobie",
            "Vomissements",
            "Ponction lombaire",
            "Liquide trouble",
            "Leucocytes élevés dans LCR",
            "Protéines élevées"
        ]
    }
    test_complete_case("Méningite (Femme, 22 ans) avec ponction lombaire", test4)
    
    # Test 5: Diabète avec analyses biologiques
    test5 = {
        "age": 45,
        "sexe": "M",
        "symptomes": [
            "Polyurie",
            "Polydipsie",
            "Fatigue",
            "Perte de poids",
            "Vision floue",
            "Glycémie à jeun",
            "HbA1c",
            "Glucose > 126 mg/dL",
            "HbA1c > 6.5%"
        ]
    }
    test_complete_case("Diabète (Homme, 45 ans) avec analyses", test5)
    
    # Test 6: Anémie avec hémogramme complet
    test6 = {
        "age": 32,
        "sexe": "F",
        "symptomes": [
            "Fatigue chronique",
            "Pâleur",
            "Essoufflement",
            "Tachycardie",
            "Hémogramme",
            "Hémoglobine basse",
            "Ferritine basse",
            "VGM diminué"
        ]
    }
    test_complete_case("Anémie ferriprive (Femme, 32 ans)", test6)
    
    print("\n" + "="*70)
    print("✅ TESTS TERMINÉS")
    print("="*70)
    print("\n💡 Le système utilise:")
    print("   • L'âge pour filtrer les maladies compatibles")
    print("   • Le sexe pour prioriser les maladies prédominantes")
    print("   • Les symptômes pour le matching fuzzy")
    print("   • Les analyses et résultats pour améliorer la précision ML")
    print("   • Système hybride: 30% Fuzzy + 70% Machine Learning")
    print("\n")
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
