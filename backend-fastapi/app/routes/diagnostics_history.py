"""
Diagnostics history routes - List saved diagnostics from consultations
"""
from fastapi import APIRouter, HTTPException, status, Query
from typing import Optional
import logging
import json

from app.models.response_models import SuccessResponse
from app.database.sqlite_connection import execute_query, get_connection

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/diagnostics", tags=["Diagnostics History"])


@router.get("/")
async def get_all_diagnostics(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    patient_id: Optional[int] = None
):
    """
    Get all saved diagnostics with patient information

    **Query Parameters:**
    - skip: Number of records to skip (default: 0)
    - limit: Maximum number of records to return (default: 10)
    - patient_id: Filter by patient ID (optional)

    **Returns:**
    - List of diagnostics with patient info and main diagnosis
    """
    try:
        conn = get_connection()
        cursor = conn.cursor()

        if patient_id:
            query = """
                SELECT d.*, p.nom || ' ' || p.prenom as patient_nom,
                       p.code_patient, p.sexe
                FROM diagnostics d
                JOIN patients p ON d.patient_id = p.id
                WHERE d.patient_id = ?
                ORDER BY d.created_at DESC
                LIMIT ? OFFSET ?
            """
            cursor.execute(query, (patient_id, limit, skip))
            diagnostics = [dict(row) for row in cursor.fetchall()]

            cursor.execute("SELECT COUNT(*) FROM diagnostics WHERE patient_id = ?", (patient_id,))
            total = cursor.fetchone()[0]
        else:
            query = """
                SELECT d.*, p.nom || ' ' || p.prenom as patient_nom,
                       p.code_patient, p.sexe
                FROM diagnostics d
                JOIN patients p ON d.patient_id = p.id
                ORDER BY d.created_at DESC
                LIMIT ? OFFSET ?
            """
            cursor.execute(query, (limit, skip))
            diagnostics = [dict(row) for row in cursor.fetchall()]

            cursor.execute("SELECT COUNT(*) FROM diagnostics")
            total = cursor.fetchone()[0]

        conn.close()

        # Parse resultats JSON and extract main diagnosis
        for diag in diagnostics:
            try:
                resultats = json.loads(diag.get('resultats', '[]'))
                if resultats and isinstance(resultats, list) and len(resultats) > 0:
                    diag['maladie_principale'] = resultats[0].get('maladie', 'Inconnu')
                    diag['score'] = diag.get('score') or resultats[0].get('score', 0)
                else:
                    diag['maladie_principale'] = 'Inconnu'
            except Exception:
                diag['maladie_principale'] = 'Inconnu'

            diag['date'] = diag.get('created_at', '')

        return SuccessResponse(
            success=True,
            message=f"{len(diagnostics)} diagnostic(s) trouvé(s)",
            data={
                "diagnostics": diagnostics,
                "total": total,
                "skip": skip,
                "limit": limit
            }
        )
    except Exception as e:
        logger.error(f"Error getting diagnostics: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération des diagnostics: {str(e)}"
        )


@router.get("/stats")
async def get_diagnostics_global_stats():
    """
    Get global application statistics (patients, consultations, diagnostics counts)

    **Returns:**
    - Total patients count
    - Total consultations count
    - Total diagnostics count
    - Today's consultations count
    """
    try:
        from datetime import datetime, date
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) FROM patients")
        total_patients = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM consultations")
        total_consultations = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM diagnostics")
        total_diagnostics = cursor.fetchone()[0]

        today_str = date.today().isoformat()
        cursor.execute(
            "SELECT COUNT(*) FROM consultations WHERE date_consultation LIKE ?",
            (f"{today_str}%",)
        )
        today_consultations = cursor.fetchone()[0]

        conn.close()

        return SuccessResponse(
            success=True,
            message="Statistiques globales",
            data={
                "totalPatients": total_patients,
                "totalConsultations": total_consultations,
                "totalDiagnostics": total_diagnostics,
                "todayConsultations": today_consultations,
                "activePatients": total_patients,
            }
        )
    except Exception as e:
        logger.error(f"Error getting global stats: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors des statistiques: {str(e)}"
        )
