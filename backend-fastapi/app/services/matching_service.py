"""
Matching service - Core diagnostic matching engine
"""
import pandas as pd
from typing import List, Dict, Tuple
import logging

from app.utils.similarity import (
    calculate_symptom_match_score,
    find_matching_symptoms
)
from app.utils.text_processing import clean_symptom_list
from app.services.preprocessing_service import get_dataset_loader

logger = logging.getLogger(__name__)


class MatchingEngine:
    """Engine for matching patient symptoms to diseases"""
    
    def __init__(self):
        self.dataset_loader = get_dataset_loader()
    
    def match_diseases(
        self,
        age: int,
        sex: str,
        symptoms: List[str],
        top_n: int = 10
    ) -> List[Dict]:
        """
        Match patient symptoms to diseases
        
        Args:
            age: Patient age
            sex: Patient sex (M or F)
            symptoms: List of patient symptoms
            top_n: Number of top results to return
            
        Returns:
            List of matched diseases with scores
        """
        # Step 1: Filter by age and sex
        filtered_df = self.dataset_loader.filter_by_age_and_sex(age, sex)
        
        if filtered_df.empty:
            logger.warning(f"No diseases found for age={age}, sex={sex}")
            return []
        
        logger.info(f"Filtered to {len(filtered_df)} diseases by age/sex")
        
        # Step 2: Clean patient symptoms
        cleaned_patient_symptoms = clean_symptom_list(symptoms)
        
        if not cleaned_patient_symptoms:
            logger.warning("No valid symptoms provided")
            return []
        
        # Step 3: Calculate match scores for each disease
        results = []
        
        for idx, row in filtered_df.iterrows():
            disease_symptoms = row['cleaned_symptoms']
            
            if not disease_symptoms:
                continue
            
            # Calculate symptom match score
            score = calculate_symptom_match_score(
                cleaned_patient_symptoms,
                disease_symptoms
            )
            
            if score > 0:
                # Find which symptoms matched
                matched_symptoms = find_matching_symptoms(
                    cleaned_patient_symptoms,
                    disease_symptoms,
                    threshold=60.0
                )
                
                results.append({
                    'disease_id': int(row['N°']),
                    'disease_name': row['Maladie'],
                    'score': round(score, 2),
                    'age_min': int(row['Age_Min']),
                    'age_max': int(row['Age_Max']),
                    'age_typical': int(row['Age_Typique']),
                    'sex_predominant': row['Sexe_Predominant'],
                    'matched_symptoms': matched_symptoms,
                    'all_disease_symptoms': row['all_symptoms'],
                    'analyses': row['analyses_list'],
                    'expected_results': row['resultats_list']
                })
        
        # Step 4: Sort by score and return top N
        results.sort(key=lambda x: x['score'], reverse=True)
        
        logger.info(f"Found {len(results)} matching diseases, returning top {top_n}")
        
        return results[:top_n]
    
    def calculate_age_compatibility(
        self,
        patient_age: int,
        age_min: int,
        age_max: int,
        age_typical: int
    ) -> Tuple[bool, float]:
        """
        Calculate age compatibility score
        
        Args:
            patient_age: Patient's age
            age_min: Disease minimum age
            age_max: Disease maximum age
            age_typical: Disease typical age
            
        Returns:
            Tuple of (is_compatible, compatibility_score)
        """
        # Check if age is in range
        is_compatible = age_min <= patient_age <= age_max
        
        if not is_compatible:
            return (False, 0.0)
        
        # Calculate proximity to typical age
        age_range = age_max - age_min
        if age_range == 0:
            return (True, 100.0)
        
        distance_from_typical = abs(patient_age - age_typical)
        max_distance = max(age_typical - age_min, age_max - age_typical)
        
        if max_distance == 0:
            compatibility_score = 100.0
        else:
            compatibility_score = max(0, 100 - (distance_from_typical / max_distance * 50))
        
        return (True, compatibility_score)
    
    def calculate_sex_compatibility(
        self,
        patient_sex: str,
        disease_sex: str
    ) -> Tuple[bool, float]:
        """
        Calculate sex compatibility
        
        Args:
            patient_sex: Patient's sex (M or F)
            disease_sex: Disease predominant sex (M, F, or Both)
            
        Returns:
            Tuple of (is_compatible, compatibility_score)
        """
        if disease_sex == 'Both':
            return (True, 100.0)
        
        if patient_sex == disease_sex:
            return (True, 100.0)
        
        # Still compatible but lower score
        return (True, 70.0)
    
    def get_disease_details(self, disease_id: int) -> Dict:
        """Get detailed information about a disease"""
        return self.dataset_loader.get_disease_by_id(disease_id)


# Global matching engine instance
matching_engine = MatchingEngine()


def get_matching_engine() -> MatchingEngine:
    """Get the global matching engine instance"""
    return matching_engine
