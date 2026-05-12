"""
Patient Code Generator
Generates unique patient codes
"""
import random
import string
from datetime import datetime


def generate_patient_code(patient_id: int = None) -> str:
    """
    Generate a unique patient code
    
    Format: PAT-YYYYMMDD-XXXX
    Example: PAT-20240510-0001
    
    Args:
        patient_id: Optional patient ID to use in the code
        
    Returns:
        Unique patient code
    """
    # Get current date
    date_str = datetime.now().strftime('%Y%m%d')
    
    # Generate sequential number (4 digits)
    if patient_id:
        seq_number = str(patient_id).zfill(4)
    else:
        # Generate random 4-digit number if no ID provided
        seq_number = str(random.randint(1, 9999)).zfill(4)
    
    # Format: PAT-YYYYMMDD-XXXX
    patient_code = f"PAT-{date_str}-{seq_number}"
    
    return patient_code


def generate_patient_code_with_initials(nom: str, prenom: str, patient_id: int = None) -> str:
    """
    Generate a unique patient code with initials
    
    Format: PAT-XX-YYYYMMDD-XXXX
    Example: PAT-JD-20240510-0001 (Jean Dupont)
    
    Args:
        nom: Patient last name
        prenom: Patient first name
        patient_id: Optional patient ID to use in the code
        
    Returns:
        Unique patient code with initials
    """
    # Get initials
    initials = f"{prenom[0]}{nom[0]}".upper() if nom and prenom else "XX"
    
    # Get current date
    date_str = datetime.now().strftime('%Y%m%d')
    
    # Generate sequential number (4 digits)
    if patient_id:
        seq_number = str(patient_id).zfill(4)
    else:
        seq_number = str(random.randint(1, 9999)).zfill(4)
    
    # Format: PAT-XX-YYYYMMDD-XXXX
    patient_code = f"PAT-{initials}-{date_str}-{seq_number}"
    
    return patient_code


def generate_simple_patient_code(patient_id: int) -> str:
    """
    Generate a simple patient code
    
    Format: PAT-XXXXXX
    Example: PAT-000001
    
    Args:
        patient_id: Patient ID
        
    Returns:
        Simple patient code
    """
    # Format: PAT-XXXXXX (6 digits)
    patient_code = f"PAT-{str(patient_id).zfill(6)}"
    
    return patient_code


def generate_random_patient_code(length: int = 8) -> str:
    """
    Generate a random alphanumeric patient code
    
    Format: PAT-XXXXXXXX
    Example: PAT-A3B7C9D2
    
    Args:
        length: Length of the random part (default: 8)
        
    Returns:
        Random patient code
    """
    # Generate random alphanumeric string
    random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))
    
    # Format: PAT-XXXXXXXX
    patient_code = f"PAT-{random_part}"
    
    return patient_code


def validate_patient_code(code: str) -> bool:
    """
    Validate patient code format
    
    Args:
        code: Patient code to validate
        
    Returns:
        True if valid, False otherwise
    """
    if not code or not isinstance(code, str):
        return False
    
    # Check if starts with PAT-
    if not code.startswith('PAT-'):
        return False
    
    # Check minimum length
    if len(code) < 8:  # PAT-XXXX minimum
        return False
    
    return True


def extract_patient_id_from_code(code: str) -> int:
    """
    Extract patient ID from code (if format is PAT-YYYYMMDD-XXXX)
    
    Args:
        code: Patient code
        
    Returns:
        Patient ID or None
    """
    try:
        if not validate_patient_code(code):
            return None
        
        parts = code.split('-')
        if len(parts) >= 3:
            # Last part should be the ID
            return int(parts[-1])
        
        return None
    except (ValueError, IndexError):
        return None
