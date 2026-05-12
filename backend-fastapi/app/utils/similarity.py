"""
Similarity calculation utilities using RapidFuzz and other methods
"""
from rapidfuzz import fuzz, process
from typing import List, Tuple, Dict
import numpy as np


def fuzzy_match_symptom(
    query_symptom: str,
    reference_symptoms: List[str],
    threshold: float = 60.0
) -> Tuple[str, float]:
    """
    Find best matching symptom using fuzzy string matching
    
    Args:
        query_symptom: Symptom to match
        reference_symptoms: List of reference symptoms
        threshold: Minimum score threshold (0-100)
        
    Returns:
        Tuple of (best_match, score)
    """
    if not reference_symptoms:
        return ("", 0.0)
    
    # Use RapidFuzz to find best match
    result = process.extractOne(
        query_symptom,
        reference_symptoms,
        scorer=fuzz.token_sort_ratio
    )
    
    if result and result[1] >= threshold:
        return (result[0], result[1])
    
    return ("", 0.0)


def calculate_symptom_match_score(
    patient_symptoms: List[str],
    disease_symptoms: List[str],
    weights: List[float] = None
) -> float:
    """
    Calculate overall symptom match score between patient and disease
    
    Args:
        patient_symptoms: List of patient symptoms
        disease_symptoms: List of disease symptoms
        weights: Optional weights for disease symptoms (symptom_1 > symptom_2 > ...)
        
    Returns:
        Match score (0-100)
    """
    if not patient_symptoms or not disease_symptoms:
        return 0.0
    
    # Default weights: decreasing importance
    if weights is None:
        weights = [1.0 / (i + 1) for i in range(len(disease_symptoms))]
    
    total_score = 0.0
    total_weight = sum(weights[:len(disease_symptoms)])
    
    matched_disease_symptoms = set()
    
    for patient_symptom in patient_symptoms:
        best_match_score = 0.0
        best_match_idx = -1
        
        for idx, disease_symptom in enumerate(disease_symptoms):
            if idx in matched_disease_symptoms:
                continue
            
            # Calculate fuzzy match score
            score = fuzz.token_sort_ratio(patient_symptom, disease_symptom)
            
            if score > best_match_score:
                best_match_score = score
                best_match_idx = idx
        
        # If good match found, add weighted score
        if best_match_score >= 60 and best_match_idx >= 0:
            weight = weights[best_match_idx] if best_match_idx < len(weights) else weights[-1]
            total_score += (best_match_score / 100.0) * weight
            matched_disease_symptoms.add(best_match_idx)
    
    # Normalize score to 0-100
    if total_weight > 0:
        normalized_score = (total_score / total_weight) * 100
        return min(100.0, normalized_score)
    
    return 0.0


def calculate_partial_ratio_score(text1: str, text2: str) -> float:
    """
    Calculate partial ratio score (good for substring matching)
    
    Args:
        text1: First text
        text2: Second text
        
    Returns:
        Score (0-100)
    """
    return fuzz.partial_ratio(text1, text2)


def calculate_token_set_ratio(text1: str, text2: str) -> float:
    """
    Calculate token set ratio (good for unordered word matching)
    
    Args:
        text1: First text
        text2: Second text
        
    Returns:
        Score (0-100)
    """
    return fuzz.token_set_ratio(text1, text2)


def find_matching_symptoms(
    patient_symptoms: List[str],
    disease_symptoms: List[str],
    threshold: float = 70.0
) -> List[Dict[str, any]]:
    """
    Find which patient symptoms match which disease symptoms
    
    Args:
        patient_symptoms: List of patient symptoms
        disease_symptoms: List of disease symptoms
        threshold: Minimum match score
        
    Returns:
        List of matches with scores
    """
    matches = []
    
    for patient_symptom in patient_symptoms:
        for disease_symptom in disease_symptoms:
            score = fuzz.token_sort_ratio(patient_symptom, disease_symptom)
            
            if score >= threshold:
                matches.append({
                    "patient_symptom": patient_symptom,
                    "disease_symptom": disease_symptom,
                    "score": score
                })
    
    # Sort by score descending
    matches.sort(key=lambda x: x["score"], reverse=True)
    
    return matches


def calculate_cosine_similarity(vec1: np.ndarray, vec2: np.ndarray) -> float:
    """
    Calculate cosine similarity between two vectors
    
    Args:
        vec1: First vector
        vec2: Second vector
        
    Returns:
        Cosine similarity (0-1)
    """
    if len(vec1) == 0 or len(vec2) == 0:
        return 0.0
    
    dot_product = np.dot(vec1, vec2)
    norm1 = np.linalg.norm(vec1)
    norm2 = np.linalg.norm(vec2)
    
    if norm1 == 0 or norm2 == 0:
        return 0.0
    
    return dot_product / (norm1 * norm2)
