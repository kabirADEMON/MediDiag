"""
Simple test script to verify the API works
Run this after installing: fastapi, uvicorn, pandas, rapidfuzz, python-dotenv
"""
import sys
import os

# Add app to path
sys.path.insert(0, os.path.dirname(__file__))

print("=" * 60)
print("🧪 Testing Medical Diagnostic API")
print("=" * 60)

# Test 1: Import modules
print("\n✓ Test 1: Importing modules...")
try:
    from app.config import settings
    print(f"  ✅ Config loaded: {settings.APP_NAME}")
except Exception as e:
    print(f"  ❌ Config error: {e}")
    sys.exit(1)

# Test 2: Load dataset
print("\n✓ Test 2: Loading dataset...")
try:
    from app.services.preprocessing_service import get_dataset_loader
    loader = get_dataset_loader()
    print(f"  ✅ Dataset loaded: {len(loader.df)} diseases")
except Exception as e:
    print(f"  ❌ Dataset error: {e}")
    sys.exit(1)

# Test 3: Test matching
print("\n✓ Test 3: Testing matching engine...")
try:
    from app.services.matching_service import get_matching_engine
    engine = get_matching_engine()
    
    # Test match
    results = engine.match_diseases(
        age=28,
        sex="F",
        symptoms=["fièvre", "fatigue", "maux de tête"],
        top_n=5
    )
    
    print(f"  ✅ Matching works: {len(results)} results found")
    if results:
        print(f"  Top result: {results[0]['disease_name']} (score: {results[0]['score']})")
except Exception as e:
    print(f"  ❌ Matching error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Test 4: Test diagnostic service
print("\n✓ Test 4: Testing diagnostic service...")
try:
    from app.services.diagnostic_service import get_diagnostic_service
    from app.models.request_models import DiagnosticRequest
    
    service = get_diagnostic_service()
    request = DiagnosticRequest(
        age=28,
        sexe="F",
        symptomes=["fièvre", "fatigue", "maux de tête", "courbatures"]
    )
    
    response = service.perform_diagnostic(request, top_n=3)
    
    print(f"  ✅ Diagnostic service works")
    print(f"  Success: {response.success}")
    print(f"  Message: {response.message}")
    print(f"  Results: {len(response.diagnostics)}")
    
    if response.diagnostics:
        for i, diag in enumerate(response.diagnostics[:3], 1):
            print(f"    {i}. {diag.maladie} - Score: {diag.score} - Urgence: {diag.urgence}")
    
except Exception as e:
    print(f"  ❌ Diagnostic error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n" + "=" * 60)
print("✅ ALL TESTS PASSED!")
print("=" * 60)
print("\n🚀 You can now start the API with:")
print("   python run.py")
print("   or")
print("   uvicorn app.main:app --reload")
print("\n📚 Documentation will be available at:")
print("   http://localhost:8000/docs")
print("=" * 60)
