#!/usr/bin/env python3
"""
Phase B - Tests Complets du Projet MediDiag

Exécute les 4 tests principaux comme définis dans ETAT_ACTUEL_ET_TESTS.md:
1. Autocomplétion des symptômes (822 symptômes)
2. Résultats de diagnostic
3. Analyses recommandées (workflow complet 2 étapes)
4. Sélection patient par code
"""

import requests
import json
from datetime import datetime
import time

# Configuration
BASE_URL = "http://127.0.0.1:8000/api/v1"
TIMEOUT = 10

# Couleurs pour l'affichage
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
END = "\033[0m"
BOLD = "\033[1m"


def print_header(title):
    """Print formatted header"""
    print(f"\n{BOLD}{BLUE}{'='*80}{END}")
    print(f"{BOLD}{BLUE}  {title}{END}")
    print(f"{BOLD}{BLUE}{'='*80}{END}\n")


def print_test(test_num, title):
    """Print test header"""
    print(f"\n{BOLD}TEST {test_num}: {title}{END}")
    print("-" * 80)


def print_success(msg):
    """Print success message"""
    print(f"{GREEN}✓ {msg}{END}")


def print_error(msg):
    """Print error message"""
    print(f"{RED}✗ {msg}{END}")


def print_info(msg):
    """Print info message"""
    print(f"{BLUE}ℹ {msg}{END}")


def print_result(label, value):
    """Print a result"""
    print(f"  {YELLOW}{label}:{END} {value}")


def check_server():
    """Check if backend server is running"""
    print_info("Vérification du serveur backend...")
    try:
        response = requests.get(f"{BASE_URL}/metadata/symptoms", timeout=5)
        if response.status_code == 200:
            print_success(f"Serveur disponible sur {BASE_URL}")
            return True
    except Exception as e:
        print_error(f"Serveur indisponible: {e}")
        return False


def test_1_symptoms_autocompletion():
    """Test 1: Vérifier l'autocomplétion des symptômes"""
    print_test(1, "Autocomplétion des Symptômes (822 symptômes)")
    
    try:
        response = requests.get(
            f"{BASE_URL}/metadata/symptoms",
            timeout=TIMEOUT
        )
        
        if response.status_code != 200:
            print_error(f"Erreur HTTP {response.status_code}")
            return False
        
        data = response.json()
        
        # Vérifications
        if not data.get('success'):
            print_error("La réponse n'a pas le flag success=true")
            return False
        
        symptoms = data.get('data', {}).get('symptoms', [])
        total = data.get('data', {}).get('total', 0)
        
        print_info(f"Réponse reçue: success={data['success']}")
        print_result("Nombre de symptômes", total)
        print_result("Symptômes reçus", len(symptoms))
        
        # Vérification du nombre
        if total != 822:
            print_error(f"Nombre attendu: 822, reçu: {total}")
            return False
        
        if len(symptoms) != 822:
            print_error(f"Liste: attendu 822, reçu {len(symptoms)}")
            return False
        
        # Vérification de quelques symptômes
        sample_symptoms = symptoms[:5]
        print_result("Premiers symptômes", ", ".join(sample_symptoms))
        
        # Vérifier si 'fièvre' est présent
        fievre_found = any('fièvre' in s.lower() for s in symptoms)
        if fievre_found:
            print_success("Symptômes contient 'fièvre'")
        
        print_success("Test 1 réussi - 822 symptômes chargés correctement")
        return True
        
    except Exception as e:
        print_error(f"Exception: {str(e)}")
        return False


def test_2_diagnostic_results():
    """Test 2: Affichage des résultats de diagnostic"""
    print_test(2, "Affichage des Résultats de Diagnostic")
    
    try:
        payload = {
            "age": 15,
            "sexe": "F",
            "symptomes": ["Fièvre", "Toux"],
            "analyses": {}
        }
        
        print_info(f"Envoi de la demande: âge={payload['age']}, sexe={payload['sexe']}, symptômes={payload['symptomes']}")
        
        response = requests.post(
            f"{BASE_URL}/diagnostic",
            json=payload,
            timeout=TIMEOUT
        )
        
        if response.status_code != 200:
            print_error(f"Erreur HTTP {response.status_code}")
            print_info(f"Réponse: {response.text}")
            return False
        
        data = response.json()
        
        # Vérifications
        if not data.get('success'):
            print_error("La réponse n'a pas le flag success=true")
            return False
        
        diagnostics = data.get('data', {}).get('diagnostics', [])
        patient_info = data.get('data', {}).get('patient_info', {})
        
        if not diagnostics:
            print_error("Aucun diagnostic reçu")
            return False
        
        # Affichage des résultats
        print_result("Nombre de diagnostics", len(diagnostics))
        print_result("Âge patient", patient_info.get('age'))
        print_result("Sexe patient", patient_info.get('sexe'))
        print_result("Symptômes", ", ".join(patient_info.get('symptomes', [])))
        
        # Affichage des top 3 diagnostics
        print("\n  Top 3 Diagnostics:")
        for i, diag in enumerate(diagnostics[:3], 1):
            print(f"    {i}. {diag['maladie']} (score: {diag['score']}/100)")
            print(f"       Urgence: {diag.get('urgence', 'N/A')}")
            if diag.get('examens_recommandes'):
                print(f"       Analyses: {', '.join(diag['examens_recommandes'][:3])}")
        
        # Vérifications de structure
        first_diag = diagnostics[0]
        required_fields = ['maladie', 'score', 'urgence', 'examens_recommandes']
        missing = [f for f in required_fields if f not in first_diag]
        
        if missing:
            print_error(f"Champs manquants dans le diagnostic: {missing}")
            return False
        
        print_success("Test 2 réussi - Diagnostics affichés correctement")
        return True
        
    except Exception as e:
        print_error(f"Exception: {str(e)}")
        return False


def test_3_recommended_analyses():
    """Test 3: Analyses recommandées (workflow 2 étapes)"""
    print_test(3, "Analyses Recommandées (Workflow Complet)")
    
    try:
        # Étape 1: Diagnostic initial
        print("\n  Étape 3.1: Diagnostic Initial")
        print("  " + "-" * 76)
        
        payload = {
            "age": 25,
            "sexe": "M",
            "symptomes": ["Fièvre", "Fatigue", "Douleur abdominale"],
            "analyses": {}
        }
        
        print_info(f"Envoi: symptômes={payload['symptomes']}")
        
        response = requests.post(
            f"{BASE_URL}/diagnostic",
            json=payload,
            timeout=TIMEOUT
        )
        
        if response.status_code != 200:
            print_error(f"Erreur HTTP {response.status_code}")
            return False
        
        initial_diag = response.json()
        diagnostics = initial_diag.get('data', {}).get('diagnostics', [])
        
        if not diagnostics:
            print_error("Aucun diagnostic reçu à l'étape 1")
            return False
        
        print_success(f"{len(diagnostics)} diagnostics trouvés")
        print_result("Top diagnostic", diagnostics[0]['maladie'])
        
        # Étape 2: Récupérer les analyses recommandées
        print("\n  Étape 3.2: Génération des Analyses Recommandées")
        print("  " + "-" * 76)
        
        analyses_payload = {
            "age": 25,
            "sexe": "M",
            "symptomes": ["Fièvre", "Fatigue", "Douleur abdominale"]
        }
        
        print_info("Demande d'analyses recommandées...")
        
        response = requests.post(
            f"{BASE_URL}/diagnostic/examinations",
            json=analyses_payload,
            timeout=TIMEOUT
        )
        
        if response.status_code != 200:
            print_error(f"Erreur HTTP {response.status_code}")
            print_info(f"Réponse: {response.text}")
            return False
        
        analyses_data = response.json()
        
        if not analyses_data.get('success'):
            print_error("Réponse avec success=false")
            return False
        
        analyses = analyses_data.get('data', {}).get('analyses', [])
        total_diseases = analyses_data.get('data', {}).get('total_diseases', 0)
        
        if not analyses:
            print_error("Aucune analyse recommandée")
            return False
        
        print_success(f"{len(analyses)} analyses recommandées")
        print_result("Maladies considérées", total_diseases)
        
        # Affichage des top 5 analyses
        print("\n  Top 5 Analyses Recommandées:")
        for i, analysis in enumerate(analyses[:5], 1):
            print(f"    {i}. {analysis['name']}")
            print(f"       Fréquence: {analysis.get('frequency', 'N/A')}")
            print(f"       Priorité: {analysis.get('priority', 'N/A')}")
        
        # Étape 3: Diagnostic affiné avec analyses
        print("\n  Étape 3.3: Diagnostic Affiné avec Analyses")
        print("  " + "-" * 76)
        
        # Récupérer les 2 premières analyses
        analyses_to_add = {}
        if len(analyses) >= 2:
            # Ajouter les analyses avec des valeurs
            analyses_to_add = {
                analyses[0]['name']: 0.8,
                analyses[1]['name']: 0.75
            }
        
        print_info(f"Ajout de {len(analyses_to_add)} analyses avec valeurs")
        
        refined_payload = {
            "age": 25,
            "sexe": "M",
            "symptomes": ["Fièvre", "Fatigue", "Douleur abdominale"],
            "analyses": analyses_to_add
        }
        
        response = requests.post(
            f"{BASE_URL}/diagnostic",
            json=refined_payload,
            timeout=TIMEOUT
        )
        
        if response.status_code != 200:
            print_error(f"Erreur HTTP {response.status_code}")
            return False
        
        refined_diag = response.json()
        refined_diagnostics = refined_diag.get('data', {}).get('diagnostics', [])
        
        if not refined_diagnostics:
            print_error("Aucun diagnostic raffiné reçu")
            return False
        
        print_success(f"Diagnostic affiné: {len(refined_diagnostics)} résultats")
        print_result("Score avant analyses", f"{diagnostics[0]['score']}/100")
        print_result("Score après analyses", f"{refined_diagnostics[0]['score']}/100")
        
        # Vérifier si le score a changé
        score_diff = refined_diagnostics[0]['score'] - diagnostics[0]['score']
        if score_diff != 0:
            direction = "augmenté" if score_diff > 0 else "diminué"
            print_success(f"Score {direction} de {abs(score_diff):.2f} points")
        
        print_success("Test 3 réussi - Workflow analyses complet")
        return True
        
    except Exception as e:
        print_error(f"Exception: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_4_patient_selection():
    """Test 4: Sélection patient par code"""
    print_test(4, "Sélection Patient par Code")
    
    try:
        # D'abord, créer un patient
        print("\n  Étape 4.1: Création d'un patient de test")
        print("  " + "-" * 76)
        
        patient_payload = {
            "nom": "Test",
            "prenom": "Patient",
            "date_naissance": "2000-01-01",
            "sexe": "M"
        }
        
        print_info("Création du patient Test Patient...")
        
        response = requests.post(
            f"{BASE_URL}/patients",
            json=patient_payload,
            timeout=TIMEOUT
        )
        
        if response.status_code != 201 and response.status_code != 200:
            print_error(f"Erreur création patient: HTTP {response.status_code}")
            print_info(f"Réponse: {response.text[:200]}")
            return False
        
        patient_data = response.json()
        patient_code = None
        
        # Rechercher le code patient
        if patient_data.get('data'):
            if isinstance(patient_data['data'], dict):
                patient_code = patient_data['data'].get('code_patient') or patient_data['data'].get('code')
            elif isinstance(patient_data['data'], list) and patient_data['data']:
                patient_code = patient_data['data'][0].get('code_patient') or patient_data['data'][0].get('code')
        
        if not patient_code:
            print_error("Impossible de récupérer le code patient")
            print_info(f"Données reçues: {json.dumps(patient_data, indent=2)[:300]}")
            return False
        
        print_success(f"Patient créé avec code: {patient_code}")
        
        # Étape 2: Récupérer le patient par code
        print("\n  Étape 4.2: Récupération par Code")
        print("  " + "-" * 76)
        
        print_info(f"Recherche du patient avec code: {patient_code}")
        
        response = requests.get(
            f"{BASE_URL}/patients/{patient_code}",
            timeout=TIMEOUT
        )
        
        if response.status_code != 200:
            print_error(f"Erreur récupération: HTTP {response.status_code}")
            return False
        
        patient_info = response.json()
        
        if not patient_info.get('success'):
            print_error("Réponse avec success=false")
            return False
        
        patient = patient_info.get('data', {})
        
        # Vérifications
        print_success("Patient trouvé et récupéré")
        print_result("Nom", f"{patient.get('prenom')} {patient.get('nom')}")
        print_result("Date naissance", patient.get('date_naissance'))
        print_result("Sexe", patient.get('sexe'))
        print_result("Code", patient.get('code_patient') or patient.get('code'))
        
        # Vérifier que les infos correspondent
        if patient.get('nom') != "Test" or patient.get('prenom') != "Patient":
            print_error("Infos patient ne correspondent pas")
            return False
        
        print_success("Test 4 réussi - Patient récupéré correctement")
        return True
        
    except Exception as e:
        print_error(f"Exception: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all tests"""
    print_header("🧪 PHASE B - TESTS COMPLETS DU PROJET")
    print_info(f"Horodatage: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print_info(f"Serveur backend: {BASE_URL}")
    
    # Vérifier le serveur
    if not check_server():
        print("\n" + "="*80)
        print(f"{RED}ERREUR: Impossible de se connecter au serveur backend{END}")
        print(f"{YELLOW}Démarrez le backend avec: python start_server.py{END}")
        print("="*80 + "\n")
        return False
    
    print("\n" + BOLD + YELLOW + "Exécution des 4 tests..." + END)
    
    # Exécuter les tests
    results = {
        "Test 1: Autocomplétion": test_1_symptoms_autocompletion(),
        "Test 2: Diagnostics": test_2_diagnostic_results(),
        "Test 3: Analyses Recommandées": test_3_recommended_analyses(),
        "Test 4: Sélection Patient": test_4_patient_selection(),
    }
    
    # Résumé final
    print_header("📊 RÉSUMÉ DES TESTS")
    
    total = len(results)
    passed = sum(1 for v in results.values() if v)
    failed = total - passed
    
    for test_name, result in results.items():
        status = f"{GREEN}✓ RÉUSSI{END}" if result else f"{RED}✗ ÉCHOUÉ{END}"
        print(f"  {test_name}: {status}")
    
    print(f"\n  Total: {BOLD}{passed}/{total}{END} tests réussis")
    
    if failed > 0:
        print(f"\n  {RED}⚠ {failed} test(s) échoué(s){END}")
        return False
    else:
        print(f"\n  {GREEN}✓ TOUS LES TESTS RÉUSSIS!{END}")
        return True


if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
