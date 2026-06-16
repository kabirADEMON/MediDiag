"""
Patients routes - Patient management endpoints
"""
from fastapi import APIRouter, HTTPException, status, Query, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Optional
import logging
from datetime import datetime

from app.models.response_models import SuccessResponse
from app.utils.patient_code_generator import generate_patient_code
from app.utils.auth_helper import require_role
from app.database.mysql_connection import execute_query, get_connection

security = HTTPBearer(auto_error=False)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/patients", tags=["Patients"])


@router.get("/")
def get_patients(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=500),
    search: Optional[str] = None
):
    """
    Get all patients with pagination
    
    **Query Parameters:**
    - skip: Number of records to skip (default: 0)
    - limit: Maximum number of records to return (default: 10)
    - search: Search query for patient name
    
    **Returns:**
    - List of patients
    - Total count
    """
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Build query
        if search:
            search_pattern = f"%{search}%"

            # Get patients with consultation status
            query = """
                SELECT p.*,
                  CASE WHEN EXISTS(SELECT 1 FROM consultations c WHERE c.patient_id = p.id) THEN 1 ELSE 0 END as a_ete_consulte
                FROM patients p
                WHERE p.nom LIKE ? OR p.prenom LIKE ? OR p.email LIKE ? OR p.code_patient LIKE ?
                ORDER BY p.id DESC
                LIMIT ? OFFSET ?
            """
            cursor.execute(query, (search_pattern, search_pattern, search_pattern, search_pattern, limit, skip))
            patients = [dict(row) for row in cursor.fetchall()]

            # Count total with search
            count_query = """
                SELECT COUNT(*) as total FROM patients
                WHERE nom LIKE ? OR prenom LIKE ? OR email LIKE ? OR code_patient LIKE ?
            """
            cursor.execute(count_query, (search_pattern, search_pattern, search_pattern, search_pattern))
            total = cursor.fetchone()[0]
        else:
            # Get patients with consultation status
            query = """
                SELECT p.*,
                  CASE WHEN EXISTS(SELECT 1 FROM consultations c WHERE c.patient_id = p.id) THEN 1 ELSE 0 END as a_ete_consulte
                FROM patients p
                ORDER BY p.id DESC
                LIMIT ? OFFSET ?
            """
            cursor.execute(query, (limit, skip))
            patients = [dict(row) for row in cursor.fetchall()]

            # Count total
            cursor.execute("SELECT COUNT(*) as total FROM patients")
            total = cursor.fetchone()[0]
        
        conn.close()
        
        return SuccessResponse(
            success=True,
            message=f"{len(patients)} patient(s) trouvé(s)",
            data={
                "patients": patients,
                "total": total,
                "skip": skip,
                "limit": limit
            }
        )
    except Exception as e:
        logger.error(f"Error getting patients: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération des patients: {str(e)}"
        )


@router.get("/en-attente")
def get_patients_en_attente(limit: int = Query(20, ge=1, le=100)):
    """Patients enregistrés n'ayant jamais eu de consultation."""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT p.id, p.nom, p.prenom, p.code_patient, p.sexe,
                   p.date_naissance, p.telephone, p.created_at
            FROM patients p
            WHERE NOT EXISTS (
                SELECT 1 FROM consultations c WHERE c.patient_id = p.id
            )
            ORDER BY p.created_at DESC
            LIMIT ?
        """, (limit,))
        patients = [dict(row) for row in cursor.fetchall()]
        cursor.execute("""
            SELECT COUNT(*) FROM patients p
            WHERE NOT EXISTS (
                SELECT 1 FROM consultations c WHERE c.patient_id = p.id
            )
        """)
        total = cursor.fetchone()[0]
        conn.close()
        return SuccessResponse(
            success=True,
            message=f"{total} patient(s) en attente",
            data={"patients": patients, "total": total}
        )
    except Exception as e:
        logger.error(f"Error getting patients en attente: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{patient_id}")
def get_patient_by_id(patient_id: int):
    """
    Get patient by ID
    
    **Path Parameters:**
    - patient_id: Patient ID
    
    **Returns:**
    - Patient details
    """
    try:
        patient = execute_query(
            "SELECT * FROM patients WHERE id = ?",
            (patient_id,),
            fetch_one=True
        )
        
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Patient avec l'ID {patient_id} non trouvé"
            )
        
        return SuccessResponse(
            success=True,
            message="Patient trouvé",
            data=patient
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting patient {patient_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération du patient: {str(e)}"
        )


@router.post("/")
def create_patient(patient_data: dict):
    """
    Create new patient
    
    **Request Body:**
    - nom: Last name (required)
    - prenom: First name (required)
    - date_naissance: Birth date (required)
    - sexe: Sex M/F (required)
    - telephone: Phone number (optional)
    - email: Email (optional)
    - adresse: Address (optional)
    - antecedents_medicaux: Medical history (optional)
    - allergies: Allergies (optional)
    - groupe_sanguin: Blood type (optional)
    
    **Returns:**
    - Created patient with ID and unique code
    """
    try:
        # Validate required fields
        required_fields = ['nom', 'prenom', 'date_naissance', 'sexe']
        for field in required_fields:
            if field not in patient_data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Champ requis manquant: {field}"
                )
        
        # Get next ID for code generation
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT MAX(id) as max_id FROM patients")
        result = cursor.fetchone()
        next_id = (result[0] or 0) + 1
        
        # Generate unique code
        code_patient = generate_patient_code(next_id)
        
        # Insert patient
        now = datetime.now().isoformat()
        query = """
            INSERT INTO patients (
                code_patient, nom, prenom, date_naissance, sexe,
                telephone, email, adresse, antecedents_medicaux,
                allergies, groupe_sanguin, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        
        cursor.execute(query, (
            code_patient,
            patient_data['nom'],
            patient_data['prenom'],
            patient_data['date_naissance'],
            patient_data['sexe'],
            patient_data.get('telephone', ''),
            patient_data.get('email', ''),
            patient_data.get('adresse', ''),
            patient_data.get('antecedents_medicaux', ''),
            patient_data.get('allergies', ''),
            patient_data.get('groupe_sanguin', ''),
            now
        ))
        
        patient_id = cursor.lastrowid

        # Create dossier médical (1 per patient)
        numero_dossier = f"DOS-{datetime.now().strftime('%Y%m%d')}-{patient_id:04d}"
        cursor.execute(
            """INSERT INTO dossiers_medicaux (patient_id, numero_dossier)
               VALUES (?, ?)""",
            (patient_id, numero_dossier)
        )

        conn.commit()

        # Fetch created patient
        cursor.execute("SELECT * FROM patients WHERE id = ?", (patient_id,))
        new_patient = dict(cursor.fetchone())
        conn.close()
        
        return SuccessResponse(
            success=True,
            message="Patient créé avec succès",
            data=new_patient
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating patient: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la création du patient: {str(e)}"
        )


@router.put("/{patient_id}")
def update_patient(patient_id: int, patient_data: dict):
    """
    Update patient information
    
    **Path Parameters:**
    - patient_id: Patient ID
    
    **Request Body:**
    - Fields to update
    
    **Returns:**
    - Updated patient
    """
    try:
        # Check if patient exists
        patient = execute_query(
            "SELECT * FROM patients WHERE id = ?",
            (patient_id,),
            fetch_one=True
        )
        
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Patient avec l'ID {patient_id} non trouvé"
            )
        
        # Build update query
        update_fields = []
        values = []
        
        allowed_fields = ['nom', 'prenom', 'date_naissance', 'sexe', 'telephone', 
                         'email', 'adresse', 'antecedents_medicaux', 'allergies', 'groupe_sanguin']
        
        for field in allowed_fields:
            if field in patient_data:
                update_fields.append(f"{field} = ?")
                values.append(patient_data[field])
        
        if not update_fields:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Aucun champ à mettre à jour"
            )
        
        # Add updated_at
        update_fields.append("updated_at = ?")
        values.append(datetime.now().isoformat())
        values.append(patient_id)
        
        query = f"UPDATE patients SET {', '.join(update_fields)} WHERE id = ?"
        execute_query(query, tuple(values))
        
        # Fetch updated patient
        updated_patient = execute_query(
            "SELECT * FROM patients WHERE id = ?",
            (patient_id,),
            fetch_one=True
        )
        
        return SuccessResponse(
            success=True,
            message="Patient mis à jour avec succès",
            data=updated_patient
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating patient {patient_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la mise à jour du patient: {str(e)}"
        )


@router.delete("/{patient_id}")
def delete_patient(patient_id: int, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Delete patient
    
    **Path Parameters:**
    - patient_id: Patient ID
    
    **Returns:**
    - Success message
    """
    try:
        # Only medecin and administrateur can delete patients
        require_role(credentials, ['medecin', 'administrateur'])

        # Check if patient exists
        patient = execute_query(
            "SELECT * FROM patients WHERE id = ?",
            (patient_id,),
            fetch_one=True
        )

        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Patient avec l'ID {patient_id} non trouvé"
            )

        # Delete patient
        execute_query("DELETE FROM patients WHERE id = ?", (patient_id,))
        
        return SuccessResponse(
            success=True,
            message="Patient supprimé avec succès",
            data={"id": patient_id}
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting patient {patient_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la suppression du patient: {str(e)}"
        )


@router.get("/search/{query}")
def search_patients(query: str):
    """
    Search patients by name or email
    
    **Path Parameters:**
    - query: Search query
    
    **Returns:**
    - List of matching patients
    """
    try:
        search_pattern = f"%{query}%"
        results = execute_query(
            """
            SELECT * FROM patients 
            WHERE nom LIKE ? OR prenom LIKE ? OR email LIKE ? OR code_patient LIKE ?
            ORDER BY created_at DESC
            """,
            (search_pattern, search_pattern, search_pattern, search_pattern),
            fetch_all=True
        )
        
        return SuccessResponse(
            success=True,
            message=f"{len(results)} patient(s) trouvé(s)",
            data=results
        )
    except Exception as e:
        logger.error(f"Error searching patients: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la recherche: {str(e)}"
        )


@router.get("/code/{code}")
def get_patient_by_code(code: str):
    """
    Get patient by unique code
    
    **Path Parameters:**
    - code: Patient unique code (e.g., PAT-20240510-0001)
    
    **Returns:**
    - Patient details
    """
    try:
        patient = execute_query(
            "SELECT * FROM patients WHERE code_patient = ?",
            (code,),
            fetch_one=True
        )
        
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Patient avec le code {code} non trouvé"
            )
        
        return SuccessResponse(
            success=True,
            message="Patient trouvé",
            data=patient
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting patient by code {code}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération du patient: {str(e)}"
        )