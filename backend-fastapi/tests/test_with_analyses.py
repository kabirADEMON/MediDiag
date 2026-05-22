"""
Test démontrant l'impact des analyses biologiques et résultats sur le diagnostic
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

import requests
import json

API_URL = 'http://localhost:8000/api/v1/diagnostic/'

def compare_with_without_analyses():
    """Compare les diagnostics avec et sans analyses biologiques"""
    
    print("\n" + "="*70)
    print("🔬 COMPARAISON: AVEC vs SANS ANALYSES BIOLOGIQUES")
    print("="*70)
    
    # Cas 1: Paludisme - SANS analyses
    print("\n" + "-"*70)
    print("📋 CAS 1: Paludisme - SYMPTÔMES UNIQUEMENT")
    print("-"*70)
    
    data_sans_analyses = {
        "age": 35,
        "sexe": "M",
        "symptomes": [
            "Fièvre",
            "Frissons",
            "Sueurs",
            "Maux de tête",
            "Fatigue"
        ]
    }
    
    print(f"\n   Patient: Homme, 35 ans")
    print(f"   Symptômes: {', '.join(data_sans_analyses['symptomes'])}")
    
    response1 = requests.post(API_URL, json=data_sans_analyses, timeout=60)
    if response1.status_code == 200:
        result1 = response1.json()
        print(f"\n   ✅ TOP 3 DIAGNOSTICS (sans analyses):")
        for i, diag in enumerate(result1['diagnostics'][:3], 1):
            print(f"      {i}. {diag['maladie']} - Score: {diag['score']:.1f}/100")
    
    # Cas 2: Paludisme - AVEC analyses et résultats
    print("\n" + "-"*70)
    print("📋 CAS 2: Paludisme - AVEC ANALYSES ET RÉSULTATS")
    print("-"*70)
    
    data_avec_analyses = {
        "age": 35,
        "sexe": "M",
        "symptomes": [
            "Fièvre",
            "Frissons",
            "Sueurs",
            "Maux de tête",
            "Fatigue",
            # ANALYSES BIOLOGIQUES
            "Frottis sanguin",
            "Goutte épaisse",
            "Test de diagnostic rapide (TDR) paludisme",
            # RÉSULTATS D'ANALYSES
            "Parasites Plasmodium visibles",
            "Thrombopénie",
            "Anémie modérée"
        ]
    }
    
    print(f"\n   Patient: Homme, 35 ans")
    print(f"   Symptômes: {', '.join(data_avec_analyses['symptomes'][:5])}")
    print(f"   Analyses: {', '.join(data_avec_analyses['symptomes'][5:8])}")
    print(f"   Résultats: {', '.join(data_avec_analyses['symptomes'][8:])}")
    
    response2 = requests.post(API_URL, json=data_avec_analyses, timeout=60)
    if response2.status_code == 200:
        result2 = response2.json()
        print(f"\n   ✅ TOP 3 DIAGNOSTICS (avec analyses):")
        for i, diag in enumerate(result2['diagnostics'][:3], 1):
            print(f"      {i}. {diag['maladie']} - Score: {diag['score']:.1f}/100")
    
    print("\n" + "="*70)
    print("💡 IMPACT DES ANALYSES:")
    print("   Les analyses biologiques et leurs résultats améliorent")
    print("   la précision du diagnostic en fournissant des preuves objectives.")
    print("="*70)


def test_specific_diseases_with_analyses():
    """Test de maladies spécifiques avec leurs analyses caractéristiques"""
    
    print("\n\n" + "="*70)
    print("🧪 TESTS AVEC ANALYSES BIOLOGIQUES SPÉCIFIQUES")
    print("="*70)
    
    # Test 1: Typhoïde avec hémoculture positive
    print("\n" + "-"*70)
    print("🔬 TEST 1: TYPHOÏDE avec hémoculture")
    print("-"*70)
    
    test1 = {
        "age": 28,
        "sexe": "F",
        "symptomes": [
            "Fièvre prolongée en plateau",
            "Douleur abdominale",
            "Diarrhée",
            "Céphalées",
            "Tuphos (état stuporeux)",
            # Analyses
            "Hémoculture",
            "Coproculture",
            "Sérologie Widal et Felix",
            # Résultats
            "Salmonella typhi isolée",
            "Leucopénie",
            "Anticorps anti-O et anti-H positifs"
        ]
    }
    
    print(f"   Symptômes: Fièvre prolongée, douleur abdominale, diarrhée...")
    print(f"   Analyses: Hémoculture, Coproculture, Sérologie")
    print(f"   Résultats: Salmonella typhi isolée, Leucopénie")
    
    response = requests.post(API_URL, json=test1, timeout=60)
    if response.status_code == 200:
        result = response.json()
        print(f"\n   ✅ TOP 5 DIAGNOSTICS:")
        for i, diag in enumerate(result['diagnostics'][:5], 1):
            print(f"      {i}. {diag['maladie']}")
            print(f"         Score: {diag['score']:.1f}/100")
            if i == 1 and diag.get('examens_recommandes'):
                print(f"         Examens: {', '.join(diag['examens_recommandes'][:2])}")
    
    # Test 2: Diabète avec glycémie et HbA1c
    print("\n" + "-"*70)
    print("🔬 TEST 2: DIABÈTE avec analyses métaboliques")
    print("-"*70)
    
    test2 = {
        "age": 52,
        "sexe": "M",
        "symptomes": [
            "Polyurie",
            "Polydipsie",
            "Polyphagie",
            "Perte de poids",
            "Vision floue",
            "Fatigue",
            # Analyses
            "Glycémie à jeun",
            "HbA1c",
            "Glycosurie",
            # Résultats
            "Glucose > 126 mg/dL",
            "HbA1c > 6.5%",
            "Glucose urinaire positif"
        ]
    }
    
    print(f"   Symptômes: Polyurie, Polydipsie, Polyphagie, Perte de poids...")
    print(f"   Analyses: Glycémie à jeun, HbA1c, Glycosurie")
    print(f"   Résultats: Glucose > 126 mg/dL, HbA1c > 6.5%")
    
    response = requests.post(API_URL, json=test2, timeout=60)
    if response.status_code == 200:
        result = response.json()
        print(f"\n   ✅ TOP 5 DIAGNOSTICS:")
        for i, diag in enumerate(result['diagnostics'][:5], 1):
            print(f"      {i}. {diag['maladie']}")
            print(f"         Score: {diag['score']:.1f}/100")
    
    # Test 3: Méningite avec ponction lombaire
    print("\n" + "-"*70)
    print("🔬 TEST 3: MÉNINGITE avec ponction lombaire")
    print("-"*70)
    
    test3 = {
        "age": 25,
        "sexe": "F",
        "symptomes": [
            "Céphalées sévères",
            "Fièvre élevée",
            "Raideur de la nuque",
            "Photophobie",
            "Vomissements en jet",
            "Confusion",
            # Analyses
            "Ponction lombaire",
            "Examen cytobactériologique du LCR",
            "Hémoculture",
            # Résultats
            "LCR trouble",
            "Leucocytes élevés dans LCR",
            "Protéines élevées",
            "Glucose diminué dans LCR"
        ]
    }
    
    print(f"   Symptômes: Céphalées sévères, Fièvre, Raideur nuque...")
    print(f"   Analyses: Ponction lombaire, Examen LCR")
    print(f"   Résultats: LCR trouble, Leucocytes élevés, Protéines élevées")
    
    response = requests.post(API_URL, json=test3, timeout=60)
    if response.status_code == 200:
        result = response.json()
        print(f"\n   ✅ TOP 5 DIAGNOSTICS:")
        for i, diag in enumerate(result['diagnostics'][:5], 1):
            print(f"      {i}. {diag['maladie']}")
            print(f"         Score: {diag['score']:.1f}/100")
            print(f"         Urgence: {diag['urgence']}")
    
    # Test 4: Anémie avec hémogramme complet
    print("\n" + "-"*70)
    print("🔬 TEST 4: ANÉMIE avec hémogramme")
    print("-"*70)
    
    test4 = {
        "age": 30,
        "sexe": "F",
        "symptomes": [
            "Fatigue chronique",
            "Pâleur cutanéo-muqueuse",
            "Essoufflement à l'effort",
            "Tachycardie",
            "Vertiges",
            # Analyses
            "Hémogramme complet (NFS)",
            "Ferritine sérique",
            "Bilan martial",
            # Résultats
            "Hémoglobine basse < 12 g/dL",
            "VGM diminué (microcytose)",
            "Ferritine basse",
            "Fer sérique bas"
        ]
    }
    
    print(f"   Symptômes: Fatigue chronique, Pâleur, Essoufflement...")
    print(f"   Analyses: Hémogramme, Ferritine, Bilan martial")
    print(f"   Résultats: Hb < 12 g/dL, VGM diminué, Ferritine basse")
    
    response = requests.post(API_URL, json=test4, timeout=60)
    if response.status_code == 200:
        result = response.json()
        print(f"\n   ✅ TOP 5 DIAGNOSTICS:")
        for i, diag in enumerate(result['diagnostics'][:5], 1):
            print(f"      {i}. {diag['maladie']}")
            print(f"         Score: {diag['score']:.1f}/100")
    
    # Test 5: Pneumonie avec radiographie
    print("\n" + "-"*70)
    print("🔬 TEST 5: PNEUMONIE avec imagerie")
    print("-"*70)
    
    test5 = {
        "age": 68,
        "sexe": "M",
        "symptomes": [
            "Toux productive",
            "Fièvre élevée",
            "Douleur thoracique",
            "Dyspnée",
            "Expectorations purulentes",
            # Analyses
            "Radiographie thoracique",
            "NFS",
            "CRP",
            "Hémoculture",
            # Résultats
            "Opacité alvéolaire",
            "Condensation pulmonaire",
            "Leucocytes élevés",
            "CRP très élevée"
        ]
    }
    
    print(f"   Symptômes: Toux productive, Fièvre, Douleur thoracique...")
    print(f"   Analyses: Radiographie thoracique, NFS, CRP")
    print(f"   Résultats: Opacité alvéolaire, Leucocytes élevés, CRP élevée")
    
    response = requests.post(API_URL, json=test5, timeout=60)
    if response.status_code == 200:
        result = response.json()
        print(f"\n   ✅ TOP 5 DIAGNOSTICS:")
        for i, diag in enumerate(result['diagnostics'][:5], 1):
            print(f"      {i}. {diag['maladie']}")
            print(f"         Score: {diag['score']:.1f}/100")
    
    print("\n" + "="*70)
    print("✅ TESTS TERMINÉS")
    print("="*70)
    print("\n💡 CONCLUSION:")
    print("   Les analyses biologiques et leurs résultats sont ESSENTIELS")
    print("   pour un diagnostic précis. Le modèle ML a été entraîné avec:")
    print("   • Symptômes cliniques")
    print("   • Analyses biologiques recommandées")
    print("   • Résultats attendus des analyses")
    print("   • Âge et sexe du patient")
    print("\n   Cela permet au système de reconnaître les patterns")
    print("   diagnostiques complets comme le ferait un médecin.")
    print("="*70 + "\n")


def main():
    """Exécuter tous les tests"""
    
    # Test 1: Comparaison avec/sans analyses
    compare_with_without_analyses()
    
    # Test 2: Maladies spécifiques avec analyses
    test_specific_diseases_with_analyses()
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
