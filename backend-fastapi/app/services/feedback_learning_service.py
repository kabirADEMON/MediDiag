"""
Feedback Learning Service — per-disease score adjustments driven by doctor validations.

Algorithm:
  confirmation (valide=1) → +CONFIRM_DELTA on the IA disease
  rejection    (valide=0) → -REJECT_DELTA  on the IA disease
                          + +CONFIRM_DELTA  on diagnostic_final (if different)
  Adjustment capped at [-MAX_ADJ, +MAX_ADJ] to prevent runaway corrections.
"""
import logging
import threading
from datetime import datetime
from typing import Dict, List

from app.database.mysql_connection import get_connection

logger = logging.getLogger(__name__)

_CONFIRM_DELTA = 2.0
_REJECT_DELTA  = 3.0
_MAX_ADJ       = 15.0

_TABLE_DDL = """
CREATE TABLE IF NOT EXISTS disease_score_adjustments (
    disease_name  VARCHAR(191) NOT NULL,
    confirmations INT          NOT NULL DEFAULT 0,
    rejections    INT          NOT NULL DEFAULT 0,
    adjustment    FLOAT        NOT NULL DEFAULT 0.0,
    updated_at    DATETIME,
    PRIMARY KEY (disease_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
"""


class FeedbackLearningService:
    def __init__(self):
        self._cache: Dict[str, float] = {}
        self._lock = threading.Lock()
        self._ensure_table()
        self._load_cache()

    def _ensure_table(self):
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute(_TABLE_DDL)
            conn.commit()
            conn.close()
        except Exception as e:
            logger.warning(f"Could not create disease_score_adjustments table: {e}")

    def _load_cache(self):
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute(
                "SELECT disease_name, adjustment FROM disease_score_adjustments"
            )
            rows = cursor.fetchall()
            conn.close()
            with self._lock:
                self._cache = {r['disease_name']: float(r['adjustment']) for r in rows}
            logger.info(f"Feedback cache loaded: {len(self._cache)} disease(s) with learned adjustments")
        except Exception as e:
            logger.warning(f"Could not load feedback cache: {e}")

    def get_adjustment(self, disease_name: str) -> float:
        """Fast in-memory lookup — zero DB hit on the diagnostic hot path."""
        with self._lock:
            return self._cache.get(disease_name, 0.0)

    def record_feedback(
        self,
        diagnostic_ia: str,
        valide: bool,
        diagnostic_final: str | None = None,
    ):
        """
        Update per-disease adjustments after a doctor validation.
        Safe to call in the HTTP request path — any exception is caught and logged.
        """
        updates: List[tuple] = []  # (disease_name, confirm_inc, reject_inc)

        if valide:
            updates.append((diagnostic_ia, 1, 0))
        else:
            updates.append((diagnostic_ia, 0, 1))
            if diagnostic_final and diagnostic_final.strip() and diagnostic_final != diagnostic_ia:
                updates.append((diagnostic_final, 1, 0))

        if not updates:
            return

        try:
            conn = get_connection()
            cursor = conn.cursor()
            now = datetime.now().isoformat()

            for disease, c_inc, r_inc in updates:
                if not disease:
                    continue

                cursor.execute(
                    "SELECT confirmations, rejections FROM disease_score_adjustments "
                    "WHERE disease_name = ?",
                    (disease,),
                )
                row = cursor.fetchone()
                if row:
                    new_confirms = row['confirmations'] + c_inc
                    new_rejects  = row['rejections']    + r_inc
                else:
                    new_confirms = c_inc
                    new_rejects  = r_inc

                new_adj = max(
                    -_MAX_ADJ,
                    min(_MAX_ADJ, round(new_confirms * _CONFIRM_DELTA - new_rejects * _REJECT_DELTA, 2)),
                )

                cursor.execute(
                    """
                    INSERT INTO disease_score_adjustments
                        (disease_name, confirmations, rejections, adjustment, updated_at)
                    VALUES (?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                        confirmations = VALUES(confirmations),
                        rejections    = VALUES(rejections),
                        adjustment    = VALUES(adjustment),
                        updated_at    = VALUES(updated_at)
                    """,
                    (disease, new_confirms, new_rejects, new_adj, now),
                )

                with self._lock:
                    self._cache[disease] = new_adj

                logger.info(
                    f"Feedback adjustment updated: '{disease}' "
                    f"confirms={new_confirms} rejects={new_rejects} → adj={new_adj:+.1f}"
                )

            conn.commit()
            conn.close()

        except Exception as e:
            logger.error(f"Error recording feedback adjustment: {e}", exc_info=True)

    def rebuild_from_history(self) -> dict:
        """
        Re-read all rows in diagnostic_feedback and recompute adjustments from scratch.
        Useful after importing historical data or resetting the table.
        """
        try:
            conn = get_connection()
            cursor = conn.cursor()

            # Wipe existing adjustments
            cursor.execute("DELETE FROM disease_score_adjustments")
            conn.commit()

            # Aggregate counts from all historical feedback
            cursor.execute(
                """
                SELECT diagnostic_ia, diagnostic_final, valide
                FROM diagnostic_feedback
                WHERE diagnostic_ia IS NOT NULL AND diagnostic_ia != ''
                """
            )
            rows = cursor.fetchall()
            conn.close()

            counts: dict[str, list[int]] = {}  # disease → [confirms, rejects]

            for r in rows:
                dia_ia    = r['diagnostic_ia']
                dia_final = r['diagnostic_final']
                is_valid  = bool(r['valide'])

                if dia_ia not in counts:
                    counts[dia_ia] = [0, 0]
                if is_valid:
                    counts[dia_ia][0] += 1
                else:
                    counts[dia_ia][1] += 1
                    if dia_final and dia_final.strip() and dia_final != dia_ia:
                        if dia_final not in counts:
                            counts[dia_final] = [0, 0]
                        counts[dia_final][0] += 1

            conn = get_connection()
            cursor = conn.cursor()
            now = datetime.now().isoformat()
            new_cache: Dict[str, float] = {}

            for disease, (c, r) in counts.items():
                adj = max(-_MAX_ADJ, min(_MAX_ADJ, round(c * _CONFIRM_DELTA - r * _REJECT_DELTA, 2)))
                cursor.execute(
                    """
                    INSERT INTO disease_score_adjustments
                        (disease_name, confirmations, rejections, adjustment, updated_at)
                    VALUES (?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                        confirmations = VALUES(confirmations),
                        rejections    = VALUES(rejections),
                        adjustment    = VALUES(adjustment),
                        updated_at    = VALUES(updated_at)
                    """,
                    (disease, c, r, adj, now),
                )
                new_cache[disease] = adj

            conn.commit()
            conn.close()

            with self._lock:
                self._cache = new_cache

            logger.info(f"Rebuild from history: {len(new_cache)} disease(s) adjusted from {len(rows)} feedback records")
            return {"diseases_updated": len(new_cache), "feedback_records_processed": len(rows)}

        except Exception as e:
            logger.error(f"Error rebuilding adjustments: {e}", exc_info=True)
            return {"error": str(e)}

    def get_all_adjustments(self) -> List[dict]:
        """Return top-50 adjustments ordered by absolute magnitude (for monitoring)."""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT disease_name, confirmations, rejections, adjustment, updated_at
                FROM disease_score_adjustments
                ORDER BY ABS(adjustment) DESC
                LIMIT 50
                """
            )
            rows = [dict(r) for r in cursor.fetchall()]
            conn.close()
            return rows
        except Exception as e:
            logger.error(f"Error fetching adjustments: {e}")
            return []


_service = FeedbackLearningService()


def get_feedback_learning_service() -> FeedbackLearningService:
    return _service
