"""
Test ML accuracy using real symptoms from the dataset
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

import pandas as pd
import requests
import random
from typing import List, Dict

API_URL = 'http://localhost:8000/api/v1/diagnostic/'

def load_dataset():
    """Load the disease dataset"""
    csv_path = 'app/datasets/1000_Maladies_Complet_Age_Sexe.csv'
    df = pd.read_csv(csv_path, encoding='utf-8')
    return df

def get_symptoms_from_disease(row) -> List[str]:
    """Extract symptoms from a disease row"""
    symptoms = []
    for i in range(1, 10):
        symptom = row.get(f'Symptôme_{i}')
        if pd.notna(symptom) and str(symptom).strip():
            symptoms.append(str(symptom).strip())
    return symptoms

def test_disease(disease_row, num_symptoms: int = 5) -> Dict:
    """Test if ML can predict the correct disease from its symptoms"""
    disease_name = disease_row['Maladie']
    age_typical = int(disease_row['Age_Typique'])
    sex = disease_row['Sexe_Predominant']
    
    # Get all symptoms
    all_symptoms = get_symptoms_from_disease(disease_row)
    
    if len(all_symptoms) < 3:
        return None
    
    # Select random subset of symptoms (simulate partial symptoms)
    num_to_select = min(num_symptoms, len(all_symptoms))
    selected_symptoms = random.sample(all_symptoms, num_to_select)
    
    # Prepare request
    sex_value = 'M' if sex == 'M' else 'F' if sex == 'F' else random.choice(['M', 'F'])
    
    data = {
        'age': age_typical,
        'sexe': sex_value,
        'symptomes': selected_symptoms
    }
    
    try:
        response = requests.post(API_URL, json=data, timeout=60)  # Increased timeout to 60s
        
        if response.status_code == 200:
            result = response.json()
            diagnostics = result['diagnostics']
            
            # Check if correct disease is in top N
            top_diseases = [d['maladie'] for d in diagnostics]
            
            # Find position of correct disease
            position = None
            for i, diag_name in enumerate(top_diseases, 1):
                if disease_name.lower() in diag_name.lower() or diag_name.lower() in disease_name.lower():
                    position = i
                    break
            
            return {
                'disease': disease_name,
                'symptoms_used': selected_symptoms,
                'total_symptoms': len(all_symptoms),
                'top_1': top_diseases[0] if top_diseases else None,
                'top_3': top_diseases[:3] if len(top_diseases) >= 3 else top_diseases,
                'top_5': top_diseases[:5] if len(top_diseases) >= 5 else top_diseases,
                'position': position,
                'found_in_top_1': position == 1 if position else False,
                'found_in_top_3': position <= 3 if position else False,
                'found_in_top_5': position <= 5 if position else False,
                'found_in_top_10': position <= 10 if position else False,
                'score': diagnostics[0]['score'] if diagnostics else 0
            }
        else:
            return None
            
    except Exception as e:
        print(f"Error testing {disease_name}: {e}")
        return None

def main():
    """Run accuracy test on random diseases from dataset"""
    print("\n" + "="*70)
    print("🧪 TEST DE PRÉCISION ML AVEC SYMPTÔMES RÉELS DU DATASET")
    print("="*70)
    
    # Load dataset
    print("\n📊 Chargement du dataset...")
    df = load_dataset()
    print(f"   {len(df)} maladies chargées")
    
    # Select random diseases to test
    num_tests = 20
    print(f"\n🎲 Sélection de {num_tests} maladies aléatoires...")
    
    # Filter diseases with enough symptoms
    df_valid = df[df['Symptôme_3'].notna()]
    
    if len(df_valid) < num_tests:
        num_tests = len(df_valid)
    
    test_diseases = df_valid.sample(n=num_tests, random_state=42)
    
    print(f"\n🔬 Test en cours...")
    print("-" * 70)
    
    results = []
    
    for idx, (_, disease_row) in enumerate(test_diseases.iterrows(), 1):
        result = test_disease(disease_row, num_symptoms=5)
        
        if result:
            results.append(result)
            
            # Display result
            status = "✅" if result['found_in_top_3'] else "⚠️" if result['found_in_top_5'] else "❌"
            position_str = f"#{result['position']}" if result['position'] else "Non trouvé"
            
            print(f"\n{idx}. {status} {result['disease']}")
            print(f"   Symptômes testés: {', '.join(result['symptoms_used'][:3])}...")
            print(f"   Position: {position_str}")
            print(f"   Top 1: {result['top_1']}")
            
            if result['position'] and result['position'] <= 5:
                print(f"   Score: {result['score']:.1f}/100")
    
    # Calculate metrics
    print("\n" + "="*70)
    print("📊 MÉTRIQUES DE PRÉCISION")
    print("="*70)
    
    if results:
        top1_accuracy = sum(r['found_in_top_1'] for r in results) / len(results) * 100
        top3_accuracy = sum(r['found_in_top_3'] for r in results) / len(results) * 100
        top5_accuracy = sum(r['found_in_top_5'] for r in results) / len(results) * 100
        top10_accuracy = sum(r['found_in_top_10'] for r in results) / len(results) * 100
        
        avg_score = sum(r['score'] for r in results) / len(results)
        
        print(f"\n   Tests effectués: {len(results)}")
        print(f"\n   📈 Précision:")
        print(f"      • Top-1 Accuracy:  {top1_accuracy:.1f}% ({sum(r['found_in_top_1'] for r in results)}/{len(results)})")
        print(f"      • Top-3 Accuracy:  {top3_accuracy:.1f}% ({sum(r['found_in_top_3'] for r in results)}/{len(results)})")
        print(f"      • Top-5 Accuracy:  {top5_accuracy:.1f}% ({sum(r['found_in_top_5'] for r in results)}/{len(results)})")
        print(f"      • Top-10 Accuracy: {top10_accuracy:.1f}% ({sum(r['found_in_top_10'] for r in results)}/{len(results)})")
        print(f"\n   📊 Score moyen: {avg_score:.1f}/100")
        
        # Distribution of positions
        positions = [r['position'] for r in results if r['position']]
        if positions:
            avg_position = sum(positions) / len(positions)
            print(f"\n   📍 Position moyenne: {avg_position:.1f}")
        
        # Best and worst cases
        print(f"\n   🏆 Meilleurs cas:")
        best_results = sorted([r for r in results if r['found_in_top_1']], key=lambda x: x['score'], reverse=True)[:3]
        for r in best_results:
            print(f"      • {r['disease']} (Score: {r['score']:.1f})")
        
        print(f"\n   ⚠️  Cas difficiles:")
        worst_results = sorted([r for r in results if not r['found_in_top_5']], key=lambda x: x['score'])[:3]
        for r in worst_results:
            print(f"      • {r['disease']} → Prédit: {r['top_1']}")
        
        print("\n" + "="*70)
        
        # Interpretation
        print("\n💡 INTERPRÉTATION:")
        if top3_accuracy >= 70:
            print("   ✅ Excellente performance ! Le modèle est très fiable.")
        elif top3_accuracy >= 50:
            print("   🟡 Bonne performance. Le modèle est utilisable en aide au diagnostic.")
        else:
            print("   🔴 Performance à améliorer. Plus de données d'entraînement nécessaires.")
        
        print("\n   Note: Le modèle a été entraîné sur des données synthétiques.")
        print("   Avec des cas réels de patients, la précision serait meilleure.")
        
    else:
        print("\n   ❌ Aucun résultat obtenu")
    
    print("\n" + "="*70)
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
