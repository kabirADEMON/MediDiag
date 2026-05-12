"""
Text processing utilities for symptom normalization and cleaning
"""
import re
import unicodedata
from typing import List


def normalize_text(text: str) -> str:
    """
    Normalize text: lowercase, remove accents, clean special characters
    
    Args:
        text: Input text to normalize
        
    Returns:
        Normalized text
    """
    if not text:
        return ""
    
    # Lowercase
    text = text.lower()
    
    # Remove accents
    text = unicodedata.normalize('NFD', text)
    text = ''.join(char for char in text if unicodedata.category(char) != 'Mn')
    
    # Remove special characters but keep spaces and hyphens
    text = re.sub(r'[^\w\s-]', ' ', text)
    
    # Remove extra spaces
    text = ' '.join(text.split())
    
    return text


def clean_symptom(symptom: str) -> str:
    """
    Clean and normalize a single symptom
    
    Args:
        symptom: Raw symptom text
        
    Returns:
        Cleaned symptom
    """
    # Remove parentheses content
    symptom = re.sub(r'\([^)]*\)', '', symptom)
    
    # Normalize
    symptom = normalize_text(symptom)
    
    # Remove common medical prefixes/suffixes for better matching
    # Example: "douleurs abdominales" -> "douleur abdominale"
    
    return symptom.strip()


def clean_symptom_list(symptoms: List[str]) -> List[str]:
    """
    Clean a list of symptoms
    
    Args:
        symptoms: List of raw symptoms
        
    Returns:
        List of cleaned symptoms
    """
    cleaned = []
    for symptom in symptoms:
        if symptom and symptom.strip():
            cleaned_symptom = clean_symptom(symptom)
            if cleaned_symptom:
                cleaned.append(cleaned_symptom)
    
    return cleaned


def extract_keywords(text: str) -> List[str]:
    """
    Extract important keywords from medical text
    
    Args:
        text: Medical text
        
    Returns:
        List of keywords
    """
    # Normalize text
    text = normalize_text(text)
    
    # Split into words
    words = text.split()
    
    # Remove common stop words (French medical context)
    stop_words = {
        'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'et', 'ou',
        'a', 'au', 'aux', 'avec', 'sans', 'pour', 'par', 'dans', 'sur',
        'en', 'vers', 'chez', 'depuis', 'pendant', 'avant', 'apres'
    }
    
    keywords = [word for word in words if word not in stop_words and len(word) > 2]
    
    return keywords


def calculate_text_similarity_score(text1: str, text2: str) -> float:
    """
    Calculate simple word overlap similarity between two texts
    
    Args:
        text1: First text
        text2: Second text
        
    Returns:
        Similarity score (0-1)
    """
    words1 = set(normalize_text(text1).split())
    words2 = set(normalize_text(text2).split())
    
    if not words1 or not words2:
        return 0.0
    
    intersection = words1.intersection(words2)
    union = words1.union(words2)
    
    return len(intersection) / len(union) if union else 0.0


def parse_analyses_text(analyses_text: str) -> List[str]:
    """
    Parse analyses text separated by semicolons
    
    Args:
        analyses_text: Text with analyses separated by ;
        
    Returns:
        List of individual analyses
    """
    if not analyses_text:
        return []
    
    # Split by semicolon
    analyses = [a.strip() for a in analyses_text.split(';') if a.strip()]
    
    return analyses


def format_symptom_for_display(symptom: str) -> str:
    """
    Format symptom for user-friendly display
    
    Args:
        symptom: Raw symptom
        
    Returns:
        Formatted symptom
    """
    # Capitalize first letter
    if symptom:
        return symptom[0].upper() + symptom[1:]
    return symptom
