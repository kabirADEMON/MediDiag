"""
Diagnostics history routes - List saved diagnostics from consultations
"""
from fastapi import APIRouter, HTTPException, status, Query
from typing import Optional
import logging
import json

from app.models.response_models import SuccessResponse
from app.database.mysql_connection import execute_query, get_connection

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/diagnostics", tags=["Diagnostics History"])



@router.get("/")
def get_all_diagnostics(
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
                SELECT d.*, CONCAT(p.nom, ' ', p.prenom) as patient_nom,
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
                SELECT d.*, CONCAT(p.nom, ' ', p.prenom) as patient_nom,
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


@router.get("/top-maladies")
def get_top_maladies(limit: int = Query(7, ge=1, le=20)):
    """Top N most frequently diagnosed diseases from saved diagnostics."""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT resultats FROM diagnostics WHERE resultats IS NOT NULL AND resultats != '[]'")
        rows = cursor.fetchall()
        conn.close()

        from collections import Counter
        counter = Counter()
        for row in rows:
            try:
                resultats = json.loads(row["resultats"] or "[]")
                if resultats and isinstance(resultats, list):
                    maladie = resultats[0].get("maladie", "")
                    if maladie and maladie != "Inconnu":
                        counter[maladie] += 1
            except Exception:
                pass

        top = [{"maladie": m, "total": c} for m, c in counter.most_common(limit)]
        return SuccessResponse(success=True, message=f"{len(top)} maladies", data=top)
    except Exception as e:
        logger.error(f"Error getting top maladies: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/weekly")
def get_weekly_stats():
    """
    Get consultations and diagnostics counts for the last 7 days
    """
    try:
        from datetime import date, timedelta
        conn = get_connection()
        cursor = conn.cursor()

        today = date.today()
        days_fr = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
        result = []

        for i in range(6, -1, -1):
            d = today - timedelta(days=i)
            d_str = d.isoformat()
            day_label = days_fr[d.weekday()]

            cursor.execute(
                "SELECT COUNT(*) FROM consultations WHERE date_consultation LIKE ?",
                (f"{d_str}%",)
            )
            consult_count = cursor.fetchone()[0]

            cursor.execute(
                "SELECT COUNT(*) FROM diagnostics WHERE created_at LIKE ?",
                (f"{d_str}%",)
            )
            diag_count = cursor.fetchone()[0]

            result.append({
                "day": day_label,
                "date": d_str,
                "consultations": consult_count,
                "diagnostics": diag_count,
            })

        conn.close()

        return SuccessResponse(
            success=True,
            message="Statistiques hebdomadaires",
            data=result
        )
    except Exception as e:
        logger.error(f"Error getting weekly stats: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors des statistiques hebdomadaires: {str(e)}"
        )


@router.get("/monthly")
def get_monthly_stats():
    """Activité des 30 derniers jours, regroupée par semaine."""
    try:
        from datetime import date, timedelta
        conn = get_connection()
        cursor = conn.cursor()

        today = date.today()
        weeks = []
        for week_back in range(3, -1, -1):
            start = today - timedelta(days=(week_back + 1) * 7 - 1)
            end   = today - timedelta(days=week_back * 7)
            label = f"S-{week_back}" if week_back > 0 else "Cette sem."

            cursor.execute(
                "SELECT COUNT(*) FROM consultations WHERE DATE(date_consultation) BETWEEN %s AND %s",
                (start.isoformat(), end.isoformat()),
            )
            consult_count = cursor.fetchone()[0]

            cursor.execute(
                "SELECT COUNT(*) FROM diagnostics WHERE DATE(created_at) BETWEEN %s AND %s",
                (start.isoformat(), end.isoformat()),
            )
            diag_count = cursor.fetchone()[0]

            weeks.append({
                "label": label,
                "start": start.isoformat(),
                "end": end.isoformat(),
                "consultations": consult_count,
                "diagnostics": diag_count,
            })

        conn.close()
        return SuccessResponse(success=True, message="Activité mensuelle", data=weeks)
    except Exception as e:
        logger.error(f"Error getting monthly stats: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/top-symptoms")
def get_top_symptoms(limit: int = Query(10, ge=1, le=30)):
    """Symptômes les plus fréquemment saisis dans les consultations."""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT symptomes FROM consultations WHERE symptomes IS NOT NULL AND symptomes != '[]'")
        rows = cursor.fetchall()
        conn.close()

        from collections import Counter
        counter = Counter()
        for row in rows:
            try:
                symptoms = json.loads(row["symptomes"] or "[]")
                for s in symptoms:
                    if s and isinstance(s, str):
                        counter[s.strip()] += 1
            except Exception:
                pass

        top = [{"symptome": s, "total": c} for s, c in counter.most_common(limit)]
        return SuccessResponse(success=True, message=f"{len(top)} symptômes", data=top)
    except Exception as e:
        logger.error(f"Error getting top symptoms: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/urgency-distribution")
def get_urgency_distribution():
    """Distribution des niveaux d'urgence parmi les diagnostics enregistrés."""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT resultats FROM diagnostics WHERE resultats IS NOT NULL AND resultats != '[]'")
        rows = cursor.fetchall()
        conn.close()

        from collections import Counter
        counter = Counter()
        for row in rows:
            try:
                resultats = json.loads(row["resultats"] or "[]")
                if resultats and isinstance(resultats, list):
                    urgence = resultats[0].get("urgence", "inconnue") or "inconnue"
                    counter[urgence] += 1
            except Exception:
                pass

        order = ["critique", "élevée", "modérée", "faible", "inconnue"]
        data = [{"urgence": u, "total": counter[u]} for u in order if counter[u] > 0]
        return SuccessResponse(success=True, message="Distribution urgences", data=data)
    except Exception as e:
        logger.error(f"Error getting urgency distribution: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/score-distribution")
def get_score_distribution():
    """Distribution des scores de confiance (par tranches de 20%)."""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT resultats FROM diagnostics WHERE resultats IS NOT NULL AND resultats != '[]'")
        rows = cursor.fetchall()
        conn.close()

        buckets = {"0-20": 0, "20-40": 0, "40-60": 0, "60-80": 0, "80-100": 0}
        for row in rows:
            try:
                resultats = json.loads(row["resultats"] or "[]")
                if resultats and isinstance(resultats, list):
                    score = resultats[0].get("score", 0) or 0
                    if score < 20:      buckets["0-20"] += 1
                    elif score < 40:    buckets["20-40"] += 1
                    elif score < 60:    buckets["40-60"] += 1
                    elif score < 80:    buckets["60-80"] += 1
                    else:               buckets["80-100"] += 1
            except Exception:
                pass

        data = [{"range": k, "total": v} for k, v in buckets.items() if v > 0]
        return SuccessResponse(success=True, message="Distribution scores", data=data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
def get_diagnostics_global_stats():
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

        cursor.execute(
            "SELECT COUNT(*) FROM patients p WHERE NOT EXISTS "
            "(SELECT 1 FROM consultations c WHERE c.patient_id = p.id)"
        )
        patients_en_attente = cursor.fetchone()[0]

        conn.close()

        return SuccessResponse(
            success=True,
            message="Statistiques globales",
            data={
                "totalPatients": total_patients,
                "totalConsultations": total_consultations,
                "totalDiagnostics": total_diagnostics,
                "todayConsultations": today_consultations,
                "patientsEnAttente": patients_en_attente,
            }
        )
    except Exception as e:
        logger.error(f"Error getting global stats: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors des statistiques: {str(e)}"
        )
