"""
Admin routes — dataset management (upload, info, reload, add-disease)
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pathlib import Path
from typing import Optional, List
from pydantic import BaseModel, Field
import shutil
import logging
import os
from datetime import datetime

from app.models.response_models import SuccessResponse
from app.utils.auth_helper import require_role
from app.config import settings

security = HTTPBearer(auto_error=False)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["Admin"])

DATASET_PATH = Path(settings.DATASET_PATH)

REQUIRED_COLUMNS = {
    "Maladie", "Symptôme_1", "Age_Min", "Age_Max",
    "Sexe_Predominant", "Analyses_biologiques_et_examens",
}


def _dataset_info() -> dict:
    if not DATASET_PATH.exists():
        return {"exists": False}
    stat = DATASET_PATH.stat()
    # Count rows without full pandas load
    with open(DATASET_PATH, encoding="utf-8", errors="replace") as f:
        rows = sum(1 for _ in f) - 1  # minus header
    return {
        "exists": True,
        "path": str(DATASET_PATH),
        "filename": DATASET_PATH.name,
        "size_kb": round(stat.st_size / 1024, 1),
        "rows": rows,
        "last_modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
    }


@router.get("/dataset/info")
def get_dataset_info(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """Informations sur le dataset actuellement chargé."""
    require_role(credentials, ["administrateur"])
    from app.services.preprocessing_service import get_dataset_loader
    loader = get_dataset_loader()
    disk = _dataset_info()
    in_memory = {
        "loaded": loader.df is not None,
        "diseases_count": len(loader.df) if loader.df is not None else 0,
        "symptoms_count": len(loader.symptom_idf) if hasattr(loader, "symptom_idf") else 0,
    }
    return SuccessResponse(
        success=True,
        message="Informations dataset",
        data={"disk": disk, "in_memory": in_memory},
    )


@router.post("/dataset/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """
    Upload un nouveau fichier CSV pour remplacer le dataset.
    Valide les colonnes requises, sauvegarde l'ancien en backup, puis recharge le moteur IA.
    """
    require_role(credentials, ["administrateur"])

    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Le fichier doit être un CSV (.csv)")

    # Read content
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Le fichier est vide")

    # Validate CSV structure
    try:
        import io
        import pandas as pd
        df_new = pd.read_csv(io.BytesIO(content), encoding="utf-8", nrows=5)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Fichier CSV invalide : {e}")

    missing = REQUIRED_COLUMNS - set(df_new.columns)
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Colonnes manquantes : {', '.join(sorted(missing))}",
        )

    # Count total rows
    try:
        df_full = pd.read_csv(io.BytesIO(content), encoding="utf-8")
        total_rows = len(df_full)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erreur lecture complète : {e}")

    if total_rows < 10:
        raise HTTPException(
            status_code=400,
            detail=f"Dataset trop petit ({total_rows} lignes). Minimum requis : 10.",
        )

    # Backup old dataset
    backup_path = DATASET_PATH.with_suffix(
        f".backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    )
    if DATASET_PATH.exists():
        shutil.copy2(DATASET_PATH, backup_path)
        logger.info(f"Dataset backed up to {backup_path}")

    # Save new dataset
    DATASET_PATH.write_bytes(content)
    logger.info(f"New dataset saved: {total_rows} rows")

    # Hot-reload the AI engine
    try:
        from app.services.preprocessing_service import reload_dataset_loader, get_dataset_loader
        from app.services.exam_classifier_service import get_exam_classifier
        from app.services.symptom_normalizer_service import get_symptom_normalizer
        from app.services.matching_service import get_matching_engine

        new_loader = reload_dataset_loader()

        # Re-enrich dependent services
        classifier = get_exam_classifier()
        classifier.enrich_from_dataset(new_loader.df)

        normalizer = get_symptom_normalizer()
        normalizer.build_vocabulary(new_loader.df)

        # Reset matching engine cache
        engine = get_matching_engine()
        if hasattr(engine, "_cache"):
            engine._cache.clear()

        logger.info("AI engine hot-reloaded successfully")
        reload_ok = True
        reload_msg = "Moteur IA rechargé avec succès"
    except Exception as e:
        logger.error(f"Hot-reload failed: {e}", exc_info=True)
        reload_ok = False
        reload_msg = f"Avertissement : rechargement partiel ({e})"

    return SuccessResponse(
        success=True,
        message=f"Dataset mis à jour ({total_rows} maladies). {reload_msg}",
        data={
            "rows": total_rows,
            "filename": file.filename,
            "backup": str(backup_path) if DATASET_PATH.exists() else None,
            "reload_ok": reload_ok,
        },
    )


@router.post("/dataset/reload")
def reload_dataset(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """Recharge le dataset depuis le disque sans upload (utile après modification manuelle)."""
    require_role(credentials, ["administrateur"])

    if not DATASET_PATH.exists():
        raise HTTPException(status_code=404, detail="Fichier dataset introuvable")

    try:
        from app.services.preprocessing_service import reload_dataset_loader, get_dataset_loader
        new_loader = reload_dataset_loader()
        return SuccessResponse(
            success=True,
            message=f"Dataset rechargé : {len(new_loader.df)} maladies",
            data={"diseases_count": len(new_loader.df)},
        )
    except Exception as e:
        logger.error(f"Reload failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Échec rechargement : {e}")


class DiseaseEntry(BaseModel):
    maladie: str = Field(..., min_length=2)
    symptomes: List[str] = Field(..., min_items=1)
    age_min: int = Field(0, ge=0, le=120)
    age_max: int = Field(100, ge=0, le=120)
    sexe_predominant: str = Field("Both")
    analyses: Optional[str] = ""
    resultats: Optional[str] = ""
    niveau_urgence: Optional[str] = ""


@router.post("/dataset/add-disease")
def add_disease(
    entry: DiseaseEntry,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """Ajoute une nouvelle maladie au dataset CSV et recharge le moteur IA."""
    require_role(credentials, ["administrateur"])

    if not DATASET_PATH.exists():
        raise HTTPException(status_code=404, detail="Fichier dataset introuvable")

    try:
        import pandas as pd

        df = pd.read_csv(DATASET_PATH, encoding="utf-8")

        # Determine next N° (index)
        next_num = int(df["N°"].max() + 1) if "N°" in df.columns and len(df) > 0 else len(df) + 1

        # Build new row dict
        new_row = {"N°": next_num, "Maladie": entry.maladie}

        symptomes_padded = (entry.symptomes + [""] * 9)[:9]
        for i, sym in enumerate(symptomes_padded, 1):
            new_row[f"Symptôme_{i}"] = sym

        new_row["Age_Min"] = entry.age_min
        new_row["Age_Max"] = entry.age_max
        new_row["Sexe_Predominant"] = entry.sexe_predominant
        new_row["Analyses_biologiques_et_examens"] = entry.analyses or ""
        new_row["Résultats_attendus"] = entry.resultats or ""
        new_row["Niveau_Urgence"] = entry.niveau_urgence or ""

        new_df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)
        new_df.to_csv(DATASET_PATH, index=False, encoding="utf-8")
        logger.info(f"New disease added: {entry.maladie} (row {next_num})")

        # Hot-reload
        from app.services.preprocessing_service import reload_dataset_loader
        from app.services.exam_classifier_service import get_exam_classifier
        from app.services.symptom_normalizer_service import get_symptom_normalizer
        from app.services.matching_service import get_matching_engine

        new_loader = reload_dataset_loader()
        get_exam_classifier().enrich_from_dataset(new_loader.df)
        get_symptom_normalizer().build_vocabulary(new_loader.df)
        engine = get_matching_engine()
        if hasattr(engine, "_cache"):
            engine._cache.clear()

        return SuccessResponse(
            success=True,
            message=f"Maladie '{entry.maladie}' ajoutée avec succès. Dataset : {len(new_df)} maladies.",
            data={"maladie": entry.maladie, "total": len(new_df), "num": next_num},
        )
    except Exception as e:
        logger.error(f"add-disease failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erreur : {e}")


@router.get("/dataset/backups")
def list_backups(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """Liste les backups du dataset disponibles."""
    require_role(credentials, ["administrateur"])
    parent = DATASET_PATH.parent
    backups = sorted(
        [
            {
                "filename": p.name,
                "size_kb": round(p.stat().st_size / 1024, 1),
                "date": datetime.fromtimestamp(p.stat().st_mtime).isoformat(),
            }
            for p in parent.glob("*.backup_*.csv")
        ],
        key=lambda x: x["date"],
        reverse=True,
    )
    return SuccessResponse(
        success=True,
        message=f"{len(backups)} backup(s)",
        data=backups,
    )
