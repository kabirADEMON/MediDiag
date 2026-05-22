"""
Matching service - Core diagnostic matching engine
"""
import pandas as pd
from typing import List, Dict, Tuple
import logging
from math import log

from rapidfuzz import fuzz

from app.utils.similarity import (
    calculate_symptom_match_score,
    find_matching_symptoms
)
from app.utils.text_processing import clean_symptom_list
from app.services.preprocessing_service import get_dataset_loader

logger = logging.getLogger(__name__)

# Sex-specific symptom blacklists (cleaned/normalized: lowercase, no accents)
_FEMALE_ONLY = frozenset([
    'ecoulement vaginal', 'pertes vaginales', 'leucorrhees', 'leucorrhee',
    'pertes blanches', 'regles douloureuses', 'dysmenorrhee', 'menstruations',
    'amenorrhee', 'menorragies', 'metrorragies', 'prurit vulvaire',
    'grossesse', 'contractions uterines', 'spotting',
    'saignements vaginaux', 'secheresse vaginale',
    'pertes genitales', 'ecoulements vaginaux',
])
_MALE_ONLY = frozenset([
    'douleur testiculaire', 'gonflement testiculaire', 'ecoulement uretral',
    'torsion testiculaire', 'douleur au niveau du testicule',
    'orchite', 'epididymite',
])

_SEX_MATCH_THRESHOLD = 68.0  # fuzzy score to consider a symptom "in the blacklist"


def _is_sex_incompatible(symptom: str, sex: str) -> bool:
    """Return True if the (cleaned) symptom is biologically impossible for the given sex."""
    blacklist = _FEMALE_ONLY if sex == 'M' else _MALE_ONLY if sex == 'F' else frozenset()
    if not blacklist:
        return False
    for blocked in blacklist:
        if fuzz.token_sort_ratio(symptom, blocked) >= _SEX_MATCH_THRESHOLD:
            return True
    return False


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

        # Step 2b: Filter sex-incompatible symptoms
        compatible_symptoms = [
            s for s in cleaned_patient_symptoms if not _is_sex_incompatible(s, sex)
        ]
        removed = len(cleaned_patient_symptoms) - len(compatible_symptoms)
        if removed:
            logger.info(
                f"Removed {removed} sex-incompatible symptom(s) for sex={sex}: "
                f"{[s for s in cleaned_patient_symptoms if _is_sex_incompatible(s, sex)]}"
            )
        cleaned_patient_symptoms = compatible_symptoms or cleaned_patient_symptoms

        if not cleaned_patient_symptoms:
            logger.warning("No valid symptoms after sex filtering")
            return []

        # Step 3: Calculate match scores for each disease
        results = []

        for idx, row in filtered_df.iterrows():
            disease_symptoms = row['cleaned_symptoms']

            if not disease_symptoms:
                continue

            # Calculate base symptom match score
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

                # Apply IDF-based specificity bonus:
                # Rare symptoms (high IDF) boost the score; common symptoms reduce it.
                if matched_symptoms:
                    idf_values = [
                        self.dataset_loader.get_symptom_idf(m['disease_symptom'])
                        for m in matched_symptoms
                    ]
                    avg_idf = sum(idf_values) / len(idf_values)
                    # avg_idf ≈ 1.0 (very common) to 7.9 (in only 1 disease).
                    # Map to a multiplier: 0.70 (very common) … 1.30 (very rare).
                    specificity = min(1.30, max(0.70, avg_idf / 4.5))
                    score = min(100.0, round(score * specificity, 2))

                # Exclusionary logic: identify key mandatory symptoms (very high IDF)
                # If none of them appear in the patient's match → flag for malus
                KEY_IDF_THRESHOLD = 4.5
                key_candidates = [
                    sym for sym in disease_symptoms[:15]
                    if self.dataset_loader.get_symptom_idf(sym) > KEY_IDF_THRESHOLD
                ]
                matched_texts = {m['disease_symptom'] for m in matched_symptoms}
                key_symptom_absent = bool(key_candidates) and not any(
                    any(fuzz.ratio(k, mt) >= 70 for mt in matched_texts)
                    for k in key_candidates
                )

                results.append({
                    'disease_id': int(row['N°']),
                    'disease_name': row['Maladie'],
                    'score': score,
                    'age_min': int(row['Age_Min']),
                    'age_max': int(row['Age_Max']),
                    'age_typical': int(row['Age_Typique']),
                    'sex_predominant': row['Sexe_Predominant'],
                    'matched_symptoms': matched_symptoms,
                    'all_disease_symptoms': row['all_symptoms'],
                    'analyses': row['analyses_list'],
                    'expected_results': row['resultats_list'],
                    'key_symptom_absent': key_symptom_absent,
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

        # Sex mismatch — still possible but penalize more heavily
        return (True, 0.0)
    
    def get_disease_details(self, disease_id: int) -> Dict:
        """Get detailed information about a disease"""
        return self.dataset_loader.get_disease_by_id(disease_id)


# Global matching engine instance
matching_engine = MatchingEngine()


def get_matching_engine() -> MatchingEngine:
    """Get the global matching engine instance"""
    return matching_engine
