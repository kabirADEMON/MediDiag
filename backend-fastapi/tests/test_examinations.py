"""
Test script for examinations endpoint
"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000/api/v1"

def test_examinations():
    """Test the examinations endpoint"""
    
    # Test data
    data = {
        "age": 25,
        "sexe": "M",
        "symptomes": ["Fièvre", "Toux", "Fatigue"],
        "analyses": {}
    }
    
    print("=" * 60)
    print("TEST: Recommended Examinations Endpoint")
    print("=" * 60)
    
    print("\n📤 Sending request to /diagnostic/examinations")
    print(f"Data: {json.dumps(data, indent=2, ensure_ascii=False)}")
    
    try:
        response = requests.post(
            f"{BASE_URL}/diagnostic/examinations",
            json=data,
            timeout=30
        )
        
        print(f"\n📥 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"\n✅ Success!")
            print(f"Response: {json.dumps(result, indent=2, ensure_ascii=False)}")
            
            if result.get('success') and result.get('data'):
                analyses = result['data'].get('analyses', [])
                print(f"\n📋 Found {len(analyses)} recommended analyses:")
                for i, analysis in enumerate(analyses[:5], 1):
                    print(f"  {i}. {analysis['name']} - Priority: {analysis['priority']} - Recommended by: {analysis['recommended_by']} diseases")
        else:
            print(f"\n❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("\n❌ Connection Error: Backend not running?")
        print("Start backend with: python start_server.py")
    except Exception as e:
        print(f"\n❌ Error: {e}")

if __name__ == "__main__":
    test_examinations()
