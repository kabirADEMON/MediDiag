"""
Diagnostic feedback routes - Doctor validation of AI diagnosis
"""
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import logging
from datetime import datetime

from app.models.response_models import SuccessResponse
from app.database.mysql_connection import get_connection
from app.utils.auth_helper import require_role

security = HTTPBearer(auto_error=False)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/feedback", tags=["Feedback"])


@router.post("/diagnostic")
def submit_diagnostic_feedback(
    feedback_data: dict,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Doctor validates or rejects the AI diagnostic suggestion.

    valide=true  → doctor confirms AI diagnosis (within ±15%)
    valide=false → doctor proposes alternative (stored for model retraining)
    """
    try:
        require_role(credentials, ['medecin', 'administrateur'])

        import jwt
        from app.config import settings
        payload = jwt.decode(credentials.credentials, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        medecin_id = payload.get('user_id')

        consultation_id = feedback_data.get('consultation_id')
        patient_id = feedback_data.get('patient_id')
        if not consultation_id or not patient_id:
            raise HTTPException(status_code=400, detail="consultation_id et patient_id requis")

        conn = get_connection()
        cursor = conn.cursor()
        now = datetime.now().isoformat()

        cursor.execute("""
            INSERT INTO diagnostic_feedback (
                consultation_id, patient_id, medecin_id,
                diagnostic_ia, score_ia, valide,
                diagnostic_final, score_final, commentaire, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            consultation_id,
            patient_id,
            medecin_id,
            feedback_data.get('diagnostic_ia', ''),
            feedback_data.get('score_ia', 0),
            1 if feedback_data.get('valide', False) else 0,
            feedback_data.get('diagnostic_final', ''),
            feedback_data.get('score_final', 0),
            feedback_data.get('commentaire', ''),
            now,
        ))

        feedback_id = cursor.lastrowid

        # Update the consultation's diagnostic field with the final diagnosis
        diagnostic_final = feedback_data.get('diagnostic_final') or feedback_data.get('diagnostic_ia', '')
        cursor.execute(
            "UPDATE consultations SET diagnostic = ? WHERE id = ?",
            (diagnostic_final, consultation_id)
        )

        conn.commit()
        conn.close()

        valide = feedback_data.get('valide', False)
        logger.info(f"✅ Feedback saved: consultation={consultation_id}, valide={valide}")

        return SuccessResponse(
            success=True,
            message="Diagnostic final enregistré" if valide else "Feedback enregistré pour réentraînement",
            data={
                "id": feedback_id,
                "valide": valide,
                "diagnostic_final": diagnostic_final,
                "created_at": now
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving feedback: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")


@router.get("/stats")
def get_feedback_stats(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Stats on doctor validation rates (for admin/monitoring)
    """
    try:
        require_role(credentials, ['medecin', 'administrateur'])

        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) FROM diagnostic_feedback")
        total = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM diagnostic_feedback WHERE valide = 1")
        validated = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM diagnostic_feedback WHERE valide = 0")
        rejected = cursor.fetchone()[0]

        conn.close()

        return SuccessResponse(
            success=True,
            message="Statistiques feedback",
            data={
                "total": total,
                "validated": validated,
                "rejected": rejected,
                "validation_rate": round(validated / total * 100, 1) if total > 0 else 0
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
