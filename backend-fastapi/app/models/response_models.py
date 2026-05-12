"""
Response models (Pydantic) for API endpoints
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


class DiagnosticResult(BaseModel):
    """Single diagnostic result"""
    maladie: str
    score: float = Field(..., ge=0, le=100, description="Confidence score (0-100)")
    urgence: str = Field(..., description="faible, modérée, élevée, critique")
    compatibilite_age: bool
    compatibilite_sexe: bool
    examens_recommandes: List[str]
    arguments: List[str] = Field(..., description="Matching symptoms/reasons")
    
    class Config:
        json_schema_extra = {
            "example": {
                "maladie": "Paludisme à P. falciparum",
                "score": 95.5,
                "urgence": "modérée",
                "compatibilite_age": True,
                "compatibilite_sexe": True,
                "examens_recommandes": ["TDR Paludisme", "NFS", "CRP"],
                "arguments": ["Fièvre élevée", "Thrombopénie", "Fatigue sévère"]
            }
        }


class DiagnosticResponse(BaseModel):
    """Response model for diagnostic endpoint"""
    success: bool
    message: str
    diagnostics: List[DiagnosticResult]
    patient_info: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.now)
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Diagnostic completed successfully",
                "diagnostics": [
                    {
                        "maladie": "Paludisme à P. falciparum",
                        "score": 95.5,
                        "urgence": "modérée",
                        "compatibilite_age": True,
                        "compatibilite_sexe": True,
                        "examens_recommandes": ["TDR Paludisme", "NFS"],
                        "arguments": ["Fièvre élevée", "Fatigue"]
                    }
                ],
                "patient_info": {
                    "age": 28,
                    "sexe": "F"
                },
                "timestamp": "2026-05-08T10:30:00"
            }
        }


class PatientResponse(BaseModel):
    """Response model for patient data"""
    id: int
    nom: str
    prenom: str
    date_naissance: str
    age: int
    sexe: str
    telephone: Optional[str]
    email: Optional[str]
    adresse: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class ConsultationResponse(BaseModel):
    """Response model for consultation data"""
    id: int
    patient_id: int
    medecin_id: int
    date_consultation: datetime
    motif: str
    diagnostic: Optional[str]
    traitement: Optional[str]
    notes: Optional[str]
    
    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Response model for authentication token"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: Dict[str, Any]
    
    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "expires_in": 1800,
                "user": {
                    "id": 1,
                    "username": "doctor@hospital.com",
                    "role": "medecin"
                }
            }
        }


class ErrorResponse(BaseModel):
    """Response model for errors"""
    success: bool = False
    error: str
    detail: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.now)


class SuccessResponse(BaseModel):
    """Generic success response"""
    success: bool = True
    message: str
    data: Optional[Any] = None
    timestamp: datetime = Field(default_factory=datetime.now)


class MaladieInfo(BaseModel):
    """Response model for disease information"""
    id: int
    nom: str
    age_min: int
    age_max: int
    age_typique: int
    sexe_predominant: str
    symptomes: List[str]
    analyses_recommandees: List[str]
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": 1,
                "nom": "Paludisme (Malaria)",
                "age_min": 0,
                "age_max": 100,
                "age_typique": 50,
                "sexe_predominant": "Both",
                "symptomes": ["Fièvre élevée", "Frissons", "Sueurs"],
                "analyses_recommandees": ["TDR Paludisme", "NFS", "CRP"]
            }
        }
