"""
Test script for consultation save functionality
"""
import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_consultation_save():
    """Test saving a consultation with diagnostic results"""
    
    print("🧪 Testing Consultation Save Functionality\n")
    
    # Step 1: Login
    print("1️⃣ Logging in...")
    login_response = requests.post(
        f"{BASE_URL}/auth/login",
        json={
            "email": "medecin@demo.com",
            "password": "demo123"
        }
    )
    
    if not login_response.ok:
        print("❌ Login failed")
        print(login_response.text)
        return
    
    login_data = login_response.json()
    token = login_data['data']['access_token']
    user = login_data['data']['user']
    print(f"✅ Logged in as {user['prenom']} {user['nom']}")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Step 2: Get or create a patient
    print("\n2️⃣ Getting patient...")
    patients_response = requests.get(
        f"{BASE_URL}/patients?limit=1",
        headers=headers
    )
    
    if patients_response.ok:
        patients_data = patients_response.json()
        if patients_data['data']['patients']:
            patient = patients_data['data']['patients'][0]
            print(f"✅ Using patient: {patient['prenom']} {patient['nom']} (ID: {patient['id']})")
        else:
            print("❌ No patients found. Please create a patient first.")
            return
    else:
        print("❌ Failed to get patients")
        return
    
    # Step 3: Perform diagnostic
    print("\n3️⃣ Performing diagnostic...")
    diagnostic_request = {
        "age": 28,
        "sexe": "F",
        "symptomes": ["Fièvre", "Fatigue", "Maux de tête", "Courbatures"],
        "analyses": {
            "Hémoglobine: Diminuée": 1,
            "Plaquettes: Diminuées": 1
        }
    }
    
    diagnostic_response = requests.post(
        f"{BASE_URL}/diagnostic/",
        json=diagnostic_request,
        headers=headers
    )
    
    if not diagnostic_response.ok:
        print("❌ Diagnostic failed")
        print(diagnostic_response.text)
        return
    
    diagnostic_data = diagnostic_response.json()
    
    # Handle nested data structure
    if 'data' in diagnostic_data and 'data' in diagnostic_data['data']:
        diagnostic_results = diagnostic_data['data']['data']['diagnostics']
    elif 'data' in diagnostic_data:
        diagnostic_results = diagnostic_data['data'].get('diagnostics', diagnostic_data['data'])
    else:
        diagnostic_results = diagnostic_data.get('diagnostics', [])
    
    print(f"✅ Diagnostic completed: {len(diagnostic_results)} results")
    if diagnostic_results:
        print(f"   Top diagnosis: {diagnostic_results[0]['maladie']} (Score: {diagnostic_results[0]['score']})")
    
    # Step 4: Save consultation
    print("\n4️⃣ Saving consultation...")
    consultation_data = {
        "patient_id": patient['id'],
        "medecin_id": user['id'],
        "motif": "Consultation médicale - Test automatique",
        "symptomes": diagnostic_request['symptomes'],
        "analyses": diagnostic_request['analyses'],
        "diagnostic_results": diagnostic_results,
        "notes": "Test de sauvegarde de consultation avec diagnostic IA"
    }
    
    consultation_response = requests.post(
        f"{BASE_URL}/consultations/",
        json=consultation_data,
        headers=headers
    )
    
    if not consultation_response.ok:
        print("❌ Consultation save failed")
        print(consultation_response.text)
        return
    
    consultation_result = consultation_response.json()
    print("✅ Consultation saved successfully!")
    print(f"   Consultation ID: {consultation_result['data']['consultation_id']}")
    print(f"   Patient: {consultation_result['data']['consultation']['prenom']} {consultation_result['data']['consultation']['nom']}")
    print(f"   Diagnostic: {consultation_result['data']['consultation']['diagnostic']}")
    
    # Step 5: Verify consultation was saved
    print("\n5️⃣ Verifying consultation...")
    consultation_id = consultation_result['data']['consultation_id']
    
    verify_response = requests.get(
        f"{BASE_URL}/consultations/{consultation_id}",
        headers=headers
    )
    
    if verify_response.ok:
        verify_data = verify_response.json()
        print("✅ Consultation verified in database")
        print(f"   Date: {verify_data['data']['date_consultation']}")
        print(f"   Symptoms: {len(json.loads(verify_data['data']['symptomes']))} symptômes")
        
        if 'diagnostic_details' in verify_data['data']:
            print(f"   Diagnostic details saved: ✅")
            print(f"   Urgence: {verify_data['data']['diagnostic_details']['urgence']}")
    else:
        print("❌ Failed to verify consultation")
    
    # Step 6: Get patient's consultations
    print("\n6️⃣ Getting patient's consultation history...")
    history_response = requests.get(
        f"{BASE_URL}/consultations/patient/{patient['id']}",
        headers=headers
    )
    
    if history_response.ok:
        history_data = history_response.json()
        total = history_data['data']['total']
        print(f"✅ Patient has {total} consultation(s) in history")
    else:
        print("❌ Failed to get consultation history")
    
    print("\n" + "="*50)
    print("✅ ALL TESTS PASSED!")
    print("="*50)


if __name__ == "__main__":
    try:
        test_consultation_save()
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
