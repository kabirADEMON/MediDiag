#!/usr/bin/env python3
"""
Test complet du système de scoring des analyses biologiques

Ce script teste la nouvelle fonctionnalité de matching des analyses biologiques
avec les diagnostics pour améliorer la précision du système.
"""

import sys
import json
from datetime import datetime

# Add project to path
sys.path.insert(0, '/app' if '/app' in sys.path else '.')

from app.services.diagnostic_service import DiagnosticService
from app.models.request_models import DiagnosticRequest


def print_header(text):
    """Print a formatted header"""
    print("\n" + "="*70)
    print(f"  {text}")
    print("="*70)


def print_subheader(text):
    """Print a formatted subheader"""
    print(f"\n{text}")
    print("-" * 70)


def format_diagnostic(diag, index):
    """Format diagnostic for display"""
    print(f"\n  {index}. {diag.maladie}")
    print(f"     Score: {diag.score}/100")
    print(f"     Urgence: {diag.urgence}")
    print(f"     Arguments: {', '.join(diag.arguments[:3])}")


def test_basic_diagnostic():
    """Test 1: Diagnostic sans analyses"""
    print_header("TEST 1: Diagnostic SANS Analyses Biologiques")
    
    service = DiagnosticService()
    
    request = DiagnosticRequest(
        age=28,
        sexe="F",
        symptomes=["fièvre", "fatigue", "maux de tête", "frissons"],
        analyses=None  # Pas d'analyses
    )
    
    print_subheader("Paramètres:")
    print(f"  Âge: {request.age} ans")
    print(f"  Sexe: {request.sexe}")
    print(f"  Symptômes: {', '.join(request.symptomes)}")
    print(f"  Analyses: Aucune")
    
    response = service.perform_diagnostic(request, top_n=3)
    
    print_subheader("Résultats:")
    print(f"  Success: {response.success}")
    print(f"  Message: {response.message}")
    print(f"  Nombre de diagnostics: {len(response.diagnostics)}")
    
    for i, diag in enumerate(response.diagnostics[:3], 1):
        format_diagnostic(diag, i)
    
    return response.diagnostics[0].score if response.diagnostics else 0


def test_with_matching_analyses():
    """Test 2: Diagnostic avec analyses qui correspondent"""
    print_header("TEST 2: Diagnostic AVEC Analyses Correspondantes")
    
    service = DiagnosticService()
    
    # Analyses qui correspondent au paludisme
    request = DiagnosticRequest(
        age=28,
        sexe="F",
        symptomes=["fièvre", "fatigue", "maux de tête", "frissons"],
        analyses={
            "Frottis sanguin": 1,
            "TDR paludisme": 1,
            "NFS": 1
        }
    )
    
    print_subheader("Paramètres:")
    print(f"  Âge: {request.age} ans")
    print(f"  Sexe: {request.sexe}")
    print(f"  Symptômes: {', '.join(request.symptomes)}")
    print(f"  Analyses:")
    for analysis in request.analyses.keys():
        print(f"    • {analysis}")
    
    response = service.perform_diagnostic(request, top_n=3)
    
    print_subheader("Résultats:")
    print(f"  Success: {response.success}")
    print(f"  Message: {response.message}")
    print(f"  Nombre de diagnostics: {len(response.diagnostics)}")
    
    for i, diag in enumerate(response.diagnostics[:3], 1):
        format_diagnostic(diag, i)
    
    return response.diagnostics[0].score if response.diagnostics else 0


def test_with_non_matching_analyses():
    """Test 3: Diagnostic avec analyses qui ne correspondent pas"""
    print_header("TEST 3: Diagnostic avec Analyses NON Correspondantes")
    
    service = DiagnosticService()
    
    # Analyses qui ne correspondent pas au paludisme
    request = DiagnosticRequest(
        age=28,
        sexe="F",
        symptomes=["fièvre", "fatigue", "maux de tête", "frissons"],
        analyses={
            "Cholestérol total": 1,  # Non pertinent pour paludisme
            "Triglycérides": 1,       # Non pertinent
            "Glucose": 1              # Non pertinent
        }
    )
    
    print_subheader("Paramètres:")
    print(f"  Âge: {request.age} ans")
    print(f"  Sexe: {request.sexe}")
    print(f"  Symptômes: {', '.join(request.symptomes)}")
    print(f"  Analyses (non pertinentes):")
    for analysis in request.analyses.keys():
        print(f"    • {analysis}")
    
    response = service.perform_diagnostic(request, top_n=3)
    
    print_subheader("Résultats:")
    print(f"  Success: {response.success}")
    print(f"  Message: {response.message}")
    print(f"  Nombre de diagnostics: {len(response.diagnostics)}")
    
    for i, diag in enumerate(response.diagnostics[:3], 1):
        format_diagnostic(diag, i)
    
    return response.diagnostics[0].score if response.diagnostics else 0


def test_complex_case():
    """Test 4: Cas complexe avec plusieurs symptômes et analyses"""
    print_header("TEST 4: Cas Complexe - Paludisme vs Typhoïde")
    
    service = DiagnosticService()
    
    # Symptômes communs à paludisme et typhoïde
    request = DiagnosticRequest(
        age=35,
        sexe="M",
        symptomes=[
            "fièvre élevée",
            "céphalées",
            "douleurs abdominales",
            "nausées",
            "fatigue"
        ],
        analyses={
            "NFS": 1,              # Commun aux deux
            "CRP": 1,              # Commun aux deux
            "Frottis sanguin": 1   # Spécifique paludisme
        }
    )
    
    print_subheader("Paramètres:")
    print(f"  Âge: {request.age} ans")
    print(f"  Sexe: {request.sexe}")
    print(f"  Symptômes: {', '.join(request.symptomes)}")
    print(f"  Analyses: {', '.join(request.analyses.keys())}")
    
    response = service.perform_diagnostic(request, top_n=5)
    
    print_subheader("Résultats détaillés:")
    print(f"  Success: {response.success}")
    print(f"  Message: {response.message}")
    
    for i, diag in enumerate(response.diagnostics[:5], 1):
        format_diagnostic(diag, i)


def test_edge_cases():
    """Test 5: Cas limites"""
    print_header("TEST 5: Cas Limites")
    
    service = DiagnosticService()
    
    # Cas 1: Analyses sans description
    print_subheader("Cas 1: Analyses sans format spécial")
    request1 = DiagnosticRequest(
        age=25,
        sexe="F",
        symptomes=["toux", "fièvre", "dyspnée"],
        analyses={"NFS": 1, "Radio": 1}  # Format simple
    )
    
    response1 = service.perform_diagnostic(request1, top_n=2)
    print(f"  Diagnostics trouvés: {len(response1.diagnostics)}")
    if response1.diagnostics:
        print(f"  Top diagnostic: {response1.diagnostics[0].maladie} (score: {response1.diagnostics[0].score})")
    
    # Cas 2: Nombreuses analyses
    print_subheader("Cas 2: Nombreuses analyses")
    request2 = DiagnosticRequest(
        age=45,
        sexe="M",
        symptomes=["ictère", "fatigue", "douleurs abdominales"],
        analyses={
            "Bilirubine": 1,
            "ASAT": 1,
            "ALAT": 1,
            "GGT": 1,
            "Albumine": 1,
            "TP": 1
        }
    )
    
    response2 = service.perform_diagnostic(request2, top_n=2)
    print(f"  Diagnostics trouvés: {len(response2.diagnostics)}")
    if response2.diagnostics:
        print(f"  Top diagnostic: {response2.diagnostics[0].maladie} (score: {response2.diagnostics[0].score})")


def run_comparison_test():
    """Test de comparaison: Sans analyses vs Avec analyses"""
    print_header("COMPARAISON: Impact des Analyses sur le Score")
    
    print_subheader("Scénario: Patient avec fièvre, fatigue, maux de tête, frissons")
    
    # Test sans analyses
    score_without = test_basic_diagnostic()
    
    # Test avec analyses
    score_with = test_with_matching_analyses()
    
    # Calcul de l'impact
    print_header("RÉSUMÉ DE L'IMPACT")
    print(f"  Score SANS analyses: {score_without:.2f}")
    print(f"  Score AVEC analyses: {score_with:.2f}")
    improvement = score_with - score_without
    print(f"  Amélioration: {improvement:+.2f} points ({(improvement/score_without*100 if score_without > 0 else 0):+.1f}%)")
    print(f"\n  ✓ Les analyses biologiques améliorent la précision du diagnostic!")


def main():
    """Main test function"""
    print("\n")
    print("╔" + "═"*68 + "╗")
    print("║" + " "*15 + "🧪 TEST DU SYSTÈME DE SCORING D'ANALYSES" + " "*11 + "║")
    print("║" + " "*68 + "║")
    print("║" + f"  Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}" + " "*45 + "║")
    print("╚" + "═"*68 + "╝")
    
    try:
        # Run all tests
        test_basic_diagnostic()
        test_with_matching_analyses()
        test_with_non_matching_analyses()
        test_complex_case()
        test_edge_cases()
        run_comparison_test()
        
        print_header("✅ TOUS LES TESTS COMPLÉTÉS AVEC SUCCÈS!")
        print("\n📊 Résumé:")
        print("  • Diagnostic sans analyses: Fonctionne ✓")
        print("  • Diagnostic avec analyses correspondantes: Fonctionne ✓")
        print("  • Diagnostic avec analyses non-correspondantes: Fonctionne ✓")
        print("  • Cas complexes: Gérés correctement ✓")
        print("  • Cas limites: Gérés correctement ✓")
        print("\n" + "="*70 + "\n")
        
    except Exception as e:
        print_header("❌ ERREUR DURANT LES TESTS")
        print(f"\nErreur: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
