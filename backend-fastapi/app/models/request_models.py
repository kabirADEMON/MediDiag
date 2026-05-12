"""
Request models (Pydantic) for API endpoints
"""
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict
from datetime import date


class DiagnosticRequest(BaseModel):
    """Request model for diagnostic endpoint"""
    age: int = Field(..., ge=0, le=120, description="Patient age in years")
    sexe: str = Field(..., description="Patient sex: M (Male), F (Female)")
    symptomes: List[str] = Field(..., min_items=1, description="List of symptoms")
    analyses: Optional[Dict[str, float]] = Field(default=None, description="Lab results (optional)")
    
    @validator('sexe')
    def validate_sexe(cls, v):
        v = v.upper()
        if v not in ['M', 'F']:
            raise ValueError('Sexe must be M or F')
        return v
    
    @validator('symptomes')
    def validate_symptomes(cls, v):
        if not v:
            raise ValueError('At least one symptom is required')
        # Clean and normalize symptoms
        return [s.strip() for s in v if s.strip()]
    
    class Config:
        json_schema_extra = {
            "example": {
                "age": 28,
                "sexe": "F",
                "symptomes": [
                    "fièvre",
                    "fatigue",
                    "maux de tête",
                    "courbatures"
                ],
                "analyses": {
                    "hemoglobine": 9.2,
                    "plaquettes": 95000
                }
            }
        }


class PatientCreate(BaseModel):
    """Request model for creating a patient"""
    nom: str = Field(..., min_length=2, max_length=100)
    prenom: str = Field(..., min_length=2, max_length=100)
    date_naissance: date
    sexe: str = Field(..., description="M or F")
    telephone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = None
    adresse: Optional[str] = None
    
    @validator('sexe')
    def validate_sexe(cls, v):
        v = v.upper()
        if v not in ['M', 'F']:
            raise ValueError('Sexe must be M or F')
        return v


class PatientUpdate(BaseModel):
    """Request model for updating a patient"""
    nom: Optional[str] = Field(None, min_length=2, max_length=100)
    prenom: Optional[str] = Field(None, min_length=2, max_length=100)
    telephone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = None
    adresse: Optional[str] = None


class ConsultationCreate(BaseModel):
    """Request model for creating a consultation"""
    patient_id: int
    motif: str = Field(..., min_length=5)
    symptomes: List[str]
    analyses: Optional[Dict[str, float]] = None
    notes: Optional[str] = None


class UserLogin(BaseModel):
    """Request model for user login"""
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)
    
    class Config:
        json_schema_extra = {
            "example": {
                "username": "doctor@hospital.com",
                "password": "securepassword123"
            }
        }


class UserRegister(BaseModel):
    """Request model for user registration"""
    username: str = Field(..., min_length=3)
    email: str
    password: str = Field(..., min_length=6)
    nom: str
    prenom: str
    role: str = Field(default="medecin", description="administrateur, medecin, infirmier")
    
    @validator('role')
    def validate_role(cls, v):
        v = v.lower()
        if v not in ['administrateur', 'medecin', 'infirmier']:
            raise ValueError('Role must be administrateur, medecin, or infirmier')
        return v
