"""
Test ML directement sans serveur - Test rapide
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from app.ml.predictor import MLPredictor
import pandas as pd

def test_ml_direct():
    """Test le modèle ML directement"""
    print("\n" + "="*70)
    print("🧪 TEST ML DIRECT (sans serveur)")
    print("="*70)
    
    # Charger le modèle
    print("\n📦 Chargement du modèle ML...")
    predictor = MLPredictor()
    
    if not predictor.load_model():
        print("❌ Erreur: Modèle ML non trouvé")
        return 1
    
    print("✅ Modèle chargé avec succès")
    
    # Infos du modèle
    info = predictor.get_model_info()
    if info:
        print(f"\n📊 Informations du modèle:")
        print(f"   • Maladies: {info.get('n_diseases', 'N/A')}")
        print(f"   • Accuracy: {info.get('accuracy', 'N/A')}")
        print(f"   • Top-5: {info.get('top5_accuracy', 'N/A')}")
    
    # Test 1: Paludisme
    print("\n" + "-"*70)
    print("🔬 Test 1: Paludisme (Homme, 35 ans)")
    print("-"*70)
    
    symptoms = ["Fièvre", "Frissons", "Maux de tête", "Sueurs", "Fatigue"]
    results = predictor.predict(symptoms, age=35, sex='M', top_n=5, min_probability=0.001)
    
    print(f"\n   Symptômes: {', '.join(symptoms)}")
    print(f"\n   Top 5 prédictions:")
    if results:
        for i, r in enumerate(results[:5], 1):
            print(f"   {i}. {r['disease_name']}")
            print(f"      Score ML: {r['ml_score']:.1f}%")
            print(f"      Probabilité: {r['probability']:.3f}")
    else:
        print("   ⚠️ Aucune prédiction (probabilités trop faibles)")
    
    # Test 2: Grippe
    print("\n" + "-"*70)
    print("🔬 Test 2: Grippe (Femme, 28 ans)")
    print("-"*70)
    
    symptoms = ["Fièvre", "Toux", "Fatigue", "Courbatures", "Maux de tête"]
    results = predictor.predict(symptoms, age=28, sex='F', top_n=5, min_probability=0.001)
    
    print(f"\n   Symptômes: {', '.join(symptoms)}")
    print(f"\n   Top 5 prédictions:")
    if results:
        for i, r in enumerate(results[:5], 1):
            print(f"   {i}. {r['disease_name']}")
            print(f"      Score ML: {r['ml_score']:.1f}%")
            print(f"      Probabilité: {r['probability']:.3f}")
    else:
        print("   ⚠️ Aucune prédiction (probabilités trop faibles)")
    
    # Test 3: Avec analyses biologiques
    print("\n" + "-"*70)
    print("🔬 Test 3: Avec analyses (Homme, 45 ans)")
    print("-"*70)
    
    symptoms = ["Fièvre", "Douleur abdominale", "Diarrhée", "Vomissements", 
                "Hémogramme", "Hémoculture", "Leucocytes élevés"]
    results = predictor.predict(symptoms, age=45, sex='M', top_n=5)
    
    print(f"\n   Symptômes + Analyses: {', '.join(symptoms[:4])}...")
    print(f"\n   Top 5 prédictions:")
    for i, r in enumerate(results[:5], 1):
        print(f"   {i}. {r['disease_name']}")
        print(f"      Score ML: {r['ml_score']:.1f}%")
        print(f"      Probabilité: {r['probability']:.3f}")
    
    print("\n" + "="*70)
    print("✅ TEST TERMINÉ")
    print("="*70)
    
    return 0

if __name__ == '__main__':
    sys.exit(test_ml_direct())
