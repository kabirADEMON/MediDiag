"""
Vitals routes - Nurse vital signs management
"""
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
import logging
from datetime import datetime

from app.models.response_models import SuccessResponse
from app.database.mysql_connection import get_connection
from app.utils.auth_helper import require_role

security = HTTPBearer(auto_error=False)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/vitals", tags=["Vitals"])


@router.post("/")
def create_vitals(
    vitals_data: dict,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Record vital signs for a patient (nurse only)
    """
    try:
        require_role(credentials, ['infirmier', 'medecin', 'administrateur'])

        patient_id = vitals_data.get('patient_id')
        if not patient_id:
            raise HTTPException(status_code=400, detail="patient_id requis")

        import jwt
        from app.config import settings
        payload = jwt.decode(credentials.credentials, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        infirmier_id = payload.get('user_id')

        conn = get_connection()
        cursor = conn.cursor()
        now = datetime.now().isoformat()

        cursor.execute("""
            INSERT INTO vitals (
                patient_id, infirmier_id, temperature, pression, pouls,
                spo2, poids, taille, observations, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            patient_id,
            infirmier_id,
            vitals_data.get('temperature', ''),
            vitals_data.get('pression', ''),
            vitals_data.get('pouls', ''),
            vitals_data.get('spo2', ''),
            vitals_data.get('poids', ''),
            vitals_data.get('taille', ''),
            vitals_data.get('observations', ''),
            now,
        ))

        vital_id = cursor.lastrowid

        # Update patient last visit
        cursor.execute("UPDATE patients SET derniere_visite = ? WHERE id = ?", (now, patient_id))

        conn.commit()
        conn.close()

        logger.info(f"✅ Vitals saved for patient {patient_id} by user {infirmier_id}")

        return SuccessResponse(
            success=True,
            message="Constantes vitales enregistrées",
            data={"id": vital_id, "patient_id": patient_id, "created_at": now}
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving vitals: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")


@router.get("/patient/{patient_id}")
def get_patient_vitals(
    patient_id: int,
    limit: int = 10,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Get vital signs history for a patient
    """
    try:
        require_role(credentials, ['infirmier', 'medecin', 'administrateur'])

        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT v.*, u.nom as infirmier_nom, u.prenom as infirmier_prenom
            FROM vitals v
            LEFT JOIN users u ON v.infirmier_id = u.id
            WHERE v.patient_id = ?
            ORDER BY v.created_at DESC
            LIMIT ?
        """, (patient_id, limit))

        vitals = [dict(row) for row in cursor.fetchall()]

        cursor.execute("SELECT COUNT(*) FROM vitals WHERE patient_id = ?", (patient_id,))
        total = cursor.fetchone()[0]

        conn.close()

        return SuccessResponse(
            success=True,
            message=f"{len(vitals)} constante(s) trouvée(s)",
            data={"vitals": vitals, "total": total}
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting vitals for patient {patient_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")
