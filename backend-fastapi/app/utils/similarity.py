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
    Calculate overall symptom match score between patient and disease.

    Coverage factor = (n_matched / n_disease_symptoms) ** 0.4
    """
    if not patient_symptoms or not disease_symptoms:
        return 0.0

    if weights is None:
        weights = [1.0 / (i + 1) for i in range(len(disease_symptoms))]

    total_score = 0.0
    total_weight = sum(weights[:len(disease_symptoms)])
    matched_disease_symptoms: set = set()
    MATCH_THRESHOLD = 65

    for patient_symptom in patient_symptoms:
        # process.extractOne uses optimised C path — replaces the inner Python loop
        result = process.extractOne(
            patient_symptom,
            disease_symptoms,
            scorer=fuzz.token_sort_ratio,
            score_cutoff=MATCH_THRESHOLD,
        )
        if result:
            _, best_score, best_idx = result
            if best_idx not in matched_disease_symptoms:
                weight = weights[best_idx] if best_idx < len(weights) else weights[-1]
                total_score += (best_score / 100.0) * weight
                matched_disease_symptoms.add(best_idx)

    if total_weight == 0 or not matched_disease_symptoms:
        return 0.0

    base = (total_score / total_weight) * 100
    n_matched = len(matched_disease_symptoms)
    n_disease = len(disease_symptoms)
    coverage_factor = (n_matched / n_disease) ** 0.4
    return min(100.0, base * coverage_factor)


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
    threshold: float = 65.0
) -> List[Dict[str, any]]:
    """
    Find which patient symptoms match which disease symptoms.
    Uses process.extract (C-optimised) instead of a nested Python loop.
    """
    if not patient_symptoms or not disease_symptoms:
        return []

    matches = []
    for patient_symptom in patient_symptoms:
        results = process.extract(
            patient_symptom,
            disease_symptoms,
            scorer=fuzz.token_sort_ratio,
            score_cutoff=threshold,
            limit=None,
        )
        for match, score, _ in results:
            matches.append({
                "patient_symptom": patient_symptom,
                "disease_symptom": match,
                "score": score,
            })

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
