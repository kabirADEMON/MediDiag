"""
Consultations routes - Consultation management endpoints
"""
from fastapi import APIRouter, HTTPException, status
from typing import Optional
import logging
from datetime import datetime
import json

from app.models.response_models import SuccessResponse
from app.database.sqlite_connection import execute_query, get_connection

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/consultations", tags=["Consultations"])


@router.post("/")
async def create_consultation(consultation_data: dict):
    """
    Create new consultation with diagnostic results
    
    **Request Body:**
    - patient_id: Patient ID (required)
    - medecin_id: Doctor ID (required)
    - motif: Consultation reason (optional)
    - symptomes: List of symptoms (required)
    - analyses: Lab results dict (optional)
    - diagnostic_results: Diagnostic results from AI (required)
    - notes: Additional notes (optional)
    
    **Returns:**
    - Created consultation with ID
    """
    try:
        logger.info(f"📝 Creating consultation for patient {consultation_data.get('patient_id')}")
        
        # Validate required fields
        required_fields = ['patient_id', 'medecin_id', 'symptomes', 'diagnostic_results']
        for field in required_fields:
            if field not in consultation_data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Champ requis manquant: {field}"
                )
        
        patient_id = consultation_data['patient_id']
        medecin_id = consultation_data['medecin_id']
        motif = consultation_data.get('motif', 'Consultation médicale')
        symptomes = consultation_data['symptomes']
        analyses = consultation_data.get('analyses', {})
        diagnostic_results = consultation_data['diagnostic_results']
        notes = consultation_data.get('notes', '')
        
        # Extract top diagnosis
        top_diagnostic = ""
        if diagnostic_results and len(diagnostic_results) > 0:
            top_diagnostic = diagnostic_results[0].get('maladie', '')
        
        # Create consultation
        conn = get_connection()
        cursor = conn.cursor()
        
        now = datetime.now().isoformat()
        
        # Insert consultation
        cursor.execute("""
            INSERT INTO consultations (
                patient_id, medecin_id, date_consultation,
                motif, symptomes, diagnostic, notes, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            patient_id,
            medecin_id,
            now,
            motif,
            json.dumps(symptomes, ensure_ascii=False),
            top_diagnostic,
            notes,
            now
        ))
        
        consultation_id = cursor.lastrowid
        
        # Insert diagnostic details
        cursor.execute("""
            INSERT INTO diagnostics (
                consultation_id, patient_id, symptomes,
                analyses, resultats, score, urgence, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            consultation_id,
            patient_id,
            json.dumps(symptomes, ensure_ascii=False),
            json.dumps(analyses, ensure_ascii=False),
            json.dumps(diagnostic_results, ensure_ascii=False),
            diagnostic_results[0].get('score', 0) if diagnostic_results else 0,
            diagnostic_results[0].get('urgence', 'faible') if diagnostic_results else 'faible',
            now
        ))
        
        # Update patient's last visit
        cursor.execute("""
            UPDATE patients 
            SET derniere_visite = ?
            WHERE id = ?
        """, (now, patient_id))
        
        conn.commit()
        
        # Fetch created consultation
        cursor.execute("""
            SELECT c.*, p.nom, p.prenom, p.code_patient
            FROM consultations c
            JOIN patients p ON c.patient_id = p.id
            WHERE c.id = ?
        """, (consultation_id,))
        
        consultation = dict(cursor.fetchone())
        conn.close()
        
        logger.info(f"✅ Consultation created with ID {consultation_id}")
        
        return SuccessResponse(
            success=True,
            message="Consultation enregistrée avec succès",
            data={
                "consultation": consultation,
                "consultation_id": consultation_id
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating consultation: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la création de la consultation: {str(e)}"
        )


@router.get("/")
async def get_consultations(
    skip: int = 0,
    limit: int = 10,
    patient_id: Optional[int] = None
):
    """
    Get all consultations with pagination
    
    **Query Parameters:**
    - skip: Number of records to skip
    - limit: Maximum number of records
    - patient_id: Filter by patient ID (optional)
    
    **Returns:**
    - List of consultations
    """
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        if patient_id:
            # Get consultations for specific patient
            query = """
                SELECT c.*, p.nom, p.prenom, p.code_patient,
                       u.nom as medecin_nom, u.prenom as medecin_prenom
                FROM consultations c
                JOIN patients p ON c.patient_id = p.id
                JOIN users u ON c.medecin_id = u.id
                WHERE c.patient_id = ?
                ORDER BY c.date_consultation DESC
                LIMIT ? OFFSET ?
            """
            cursor.execute(query, (patient_id, limit, skip))
            consultations = [dict(row) for row in cursor.fetchall()]
            
            # Count total
            cursor.execute("SELECT COUNT(*) FROM consultations WHERE patient_id = ?", (patient_id,))
            total = cursor.fetchone()[0]
        else:
            # Get all consultations
            query = """
                SELECT c.*, p.nom, p.prenom, p.code_patient,
                       u.nom as medecin_nom, u.prenom as medecin_prenom
                FROM consultations c
                JOIN patients p ON c.patient_id = p.id
                JOIN users u ON c.medecin_id = u.id
                ORDER BY c.date_consultation DESC
                LIMIT ? OFFSET ?
            """
            cursor.execute(query, (limit, skip))
            consultations = [dict(row) for row in cursor.fetchall()]
            
            # Count total
            cursor.execute("SELECT COUNT(*) FROM consultations")
            total = cursor.fetchone()[0]
        
        conn.close()
        
        return SuccessResponse(
            success=True,
            message=f"{len(consultations)} consultation(s) trouvée(s)",
            data={
                "consultations": consultations,
                "total": total,
                "skip": skip,
                "limit": limit
            }
        )
    except Exception as e:
        logger.error(f"Error getting consultations: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération des consultations: {str(e)}"
        )


@router.get("/{consultation_id}")
async def get_consultation_by_id(consultation_id: int):
    """
    Get consultation by ID with full details
    
    **Path Parameters:**
    - consultation_id: Consultation ID
    
    **Returns:**
    - Consultation details with diagnostic
    """
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Get consultation
        cursor.execute("""
            SELECT c.*, p.nom, p.prenom, p.code_patient, p.date_naissance, p.sexe,
                   u.nom as medecin_nom, u.prenom as medecin_prenom
            FROM consultations c
            JOIN patients p ON c.patient_id = p.id
            JOIN users u ON c.medecin_id = u.id
            WHERE c.id = ?
        """, (consultation_id,))
        
        consultation = cursor.fetchone()
        
        if not consultation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Consultation {consultation_id} non trouvée"
            )
        
        consultation = dict(consultation)
        
        # Get diagnostic details
        cursor.execute("""
            SELECT * FROM diagnostics
            WHERE consultation_id = ?
        """, (consultation_id,))
        
        diagnostic = cursor.fetchone()
        if diagnostic:
            consultation['diagnostic_details'] = dict(diagnostic)
        
        conn.close()
        
        return SuccessResponse(
            success=True,
            message="Consultation trouvée",
            data=consultation
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting consultation {consultation_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération de la consultation: {str(e)}"
        )


@router.get("/patient/{patient_id}")
async def get_consultations_by_patient(patient_id: int):
    """
    Get all consultations for a specific patient
    
    **Path Parameters:**
    - patient_id: Patient ID
    
    **Returns:**
    - List of patient's consultations
    """
    return await get_consultations(patient_id=patient_id, limit=100)


@router.delete("/{consultation_id}")
async def delete_consultation(consultation_id: int):
    """
    Delete consultation
    
    **Path Parameters:**
    - consultation_id: Consultation ID
    
    **Returns:**
    - Success message
    """
    try:
        # Check if consultation exists
        consultation = execute_query(
            "SELECT * FROM consultations WHERE id = ?",
            (consultation_id,),
            fetch_one=True
        )
        
        if not consultation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Consultation {consultation_id} non trouvée"
            )
        
        # Delete diagnostic first (foreign key)
        execute_query("DELETE FROM diagnostics WHERE consultation_id = ?", (consultation_id,))
        
        # Delete consultation
        execute_query("DELETE FROM consultations WHERE id = ?", (consultation_id,))
        
        return SuccessResponse(
            success=True,
            message="Consultation supprimée avec succès",
            data={"id": consultation_id}
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting consultation {consultation_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la suppression de la consultation: {str(e)}"
        )