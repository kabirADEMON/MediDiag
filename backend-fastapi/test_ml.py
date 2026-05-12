"""
Test script to verify ML model is working
"""
import sys
from pathlib import Path

# Add app to path
sys.path.insert(0, str(Path(__file__).parent))

from app.ml.predictor import get_ml_predictor
from app.services.hybrid_diagnostic_service import get_hybrid_diagnostic_service
from app.models.request_models import DiagnosticRequest


def test_ml_predictor():
    """Test ML predictor directly"""
    print("\n" + "="*60)
    print("🧪 TEST 1 : ML Predictor")
    print("="*60)
    
    predictor = get_ml_predictor()
    
    if not predictor.is_loaded:
        print("❌ ML model not loaded!")
        print("   Run: python train_ml_model.py")
        return False
    
    print("✅ ML model loaded successfully")
    
    # Get model info
    info = predictor.get_model_info()
    if info:
        print(f"\n📊 Model Info:")
        print(f"   • Diseases: {info.get('n_diseases', 'N/A')}")
        print(f"   • Features: {info.get('n_features', 'N/A')}")
        if 'accuracy' in info:
            print(f"   • Accuracy: {info['accuracy']:.2%}")
            print(f"   • Top-3 Accuracy: {info['top3_accuracy']:.2%}")
            print(f"   • Top-5 Accuracy: {info['top5_accuracy']:.2%}")
    
    # Test prediction
    print(f"\n🔍 Testing prediction...")
    symptoms = ["fièvre", "fatigue", "maux de tête", "frissons"]
    print(f"   Symptoms: {symptoms}")
    
    results = predictor.predict(symptoms, top_n=5)
    
    if results:
        print(f"\n✅ ML Prediction successful! Top 5 results:")
        for i, result in enumerate(results, 1):
            print(f"   {i}. {result['disease_name']}")
            print(f"      Probability: {result['probability']:.2%}")
            print(f"      ML Score: {result['ml_score']:.1f}/100")
        return True
    else:
        print("❌ No predictions returned")
        return False


def test_hybrid_service():
    """Test hybrid diagnostic service"""
    print("\n" + "="*60)
    print("🧪 TEST 2 : Hybrid Diagnostic Service")
    print("="*60)
    
    service = get_hybrid_diagnostic_service()
    
    # Check ML status
    status = service.get_model_status()
    print(f"\n📊 ML Status:")
    print(f"   • ML Available: {status['ml_available']}")
    
    if status['ml_available']:
        weights = status.get('weights', {})
        print(f"   • ML Weight: {weights.get('ml', 0):.0%}")
        print(f"   • Fuzzy Weight: {weights.get('fuzzy', 0):.0%}")
    else:
        print(f"   • Message: {status.get('message', 'N/A')}")
    
    # Test diagnostic
    print(f"\n🔍 Testing hybrid diagnostic...")
    
    request = DiagnosticRequest(
        age=28,
        sexe="F",
        symptomes=["fièvre", "fatigue", "maux de tête", "frissons", "courbatures"]
    )
    
    print(f"   Patient: {request.age} ans, {request.sexe}")
    print(f"   Symptoms: {request.symptomes}")
    
    response = service.perform_diagnostic(request, top_n=5, use_ml=True)
    
    if response.success:
        print(f"\n✅ Diagnostic successful!")
        print(f"   Message: {response.message}")
        print(f"   ML Enabled: {response.patient_info.get('ml_enabled', False)}")
        print(f"\n   Top 5 Diagnoses:")
        
        for i, diag in enumerate(response.diagnostics, 1):
            print(f"\n   {i}. {diag.maladie}")
            print(f"      Score: {diag.score:.1f}/100")
            print(f"      Urgency: {diag.urgence}")
            print(f"      Age Compatible: {diag.compatibilite_age}")
            print(f"      Sex Compatible: {diag.compatibilite_sexe}")
            if diag.arguments:
                print(f"      Arguments: {', '.join(diag.arguments[:3])}")
        
        return True
    else:
        print(f"❌ Diagnostic failed: {response.message}")
        return False


def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("🤖 TEST DU SYSTÈME ML")
    print("="*60)
    
    # Test 1: ML Predictor
    test1_passed = test_ml_predictor()
    
    # Test 2: Hybrid Service
    test2_passed = test_hybrid_service()
    
    # Summary
    print("\n" + "="*60)
    print("📊 RÉSUMÉ DES TESTS")
    print("="*60)
    print(f"   Test 1 (ML Predictor):      {'✅ PASSED' if test1_passed else '❌ FAILED'}")
    print(f"   Test 2 (Hybrid Service):    {'✅ PASSED' if test2_passed else '❌ FAILED'}")
    print("="*60)
    
    if test1_passed and test2_passed:
        print("\n🎉 TOUS LES TESTS SONT PASSÉS!")
        print("   Le système ML est opérationnel.")
        return 0
    else:
        print("\n⚠️  CERTAINS TESTS ONT ÉCHOUÉ")
        if not test1_passed:
            print("   → Entraîner le modèle: python train_ml_model.py")
        return 1


if __name__ == '__main__':
    sys.exit(main())
