"""
Diagnostic routes - Main diagnostic endpoints
"""
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List
import logging

from app.models.request_models import DiagnosticRequest
from app.models.response_models import (
    DiagnosticResponse,
    SuccessResponse,
    ErrorResponse
)
from app.services.diagnostic_service import get_diagnostic_service
from app.services.hybrid_diagnostic_service import get_hybrid_diagnostic_service
from app.services.preprocessing_service import get_dataset_loader
from app.utils.auth_helper import require_role

security = HTTPBearer(auto_error=False)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/diagnostic", tags=["Diagnostic"])


@router.post("/", response_model=DiagnosticResponse)
async def perform_diagnostic(request: DiagnosticRequest, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Perform medical diagnostic based on patient symptoms (with ML)
    
    **Request Body:**
    - age: Patient age (0-120)
    - sexe: Patient sex (M or F)
    - symptomes: List of symptoms (at least 1)
    - analyses: Optional lab results
    
    **Returns:**
    - List of possible diagnoses with scores (Hybrid: 70% ML + 30% Fuzzy)
    - Urgency levels
    - Recommended examinations
    """
    try:
        # Only medecin and administrateur can perform diagnostic (clinical act)
        require_role(credentials, ['medecin', 'administrateur'])
        # Use hybrid service with ML
        hybrid_service = get_hybrid_diagnostic_service()
        result = hybrid_service.perform_diagnostic(request, top_n=10, use_ml=True)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in diagnostic endpoint: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors du diagnostic: {str(e)}"
        )


@router.post("/quick", response_model=DiagnosticResponse)
async def quick_diagnostic(request: DiagnosticRequest, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Quick diagnostic - Returns top 5 results only

    Faster response for preliminary assessment
    """
    try:
        require_role(credentials, ['medecin', 'administrateur'])
        diagnostic_service = get_diagnostic_service()
        result = diagnostic_service.perform_diagnostic(request, top_n=5)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in quick diagnostic: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors du diagnostic rapide: {str(e)}"
        )


@router.post("/summary")
async def get_diagnostic_summary(request: DiagnosticRequest, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Get diagnostic summary with recommendations
    
    Returns a simplified summary with key information
    """
    try:
        require_role(credentials, ['medecin', 'administrateur'])
        diagnostic_service = get_diagnostic_service()
        result = diagnostic_service.perform_diagnostic(request, top_n=5)
        summary = diagnostic_service.get_diagnostic_summary(result)
        return SuccessResponse(success=True, message="Résumé du diagnostic généré", data=summary)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating summary: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Erreur lors de la génération du résumé: {str(e)}")


@router.post("/examinations")
async def get_recommended_examinations(request: DiagnosticRequest, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Get recommended medical examinations based on symptoms
    
    Returns a consolidated list of recommended analyses from top matching diseases
    """
    try:
        require_role(credentials, ['medecin', 'administrateur'])
        logger.info(f"Examinations request: age={request.age}, sexe={request.sexe}, symptoms={len(request.symptomes)}")

        # Get top diseases
        hybrid_service = get_hybrid_diagnostic_service()
        result = hybrid_service.perform_diagnostic(request, top_n=10, use_ml=True)
        
        logger.info(f"📊 Diagnostic result: success={result.success}, diagnostics={len(result.diagnostics) if result.diagnostics else 0}")
        
        if not result.success or not result.diagnostics:
            logger.warning("⚠️ No matching diseases found for examinations")
            return SuccessResponse(
                success=False,
                message="Aucune maladie correspondante trouvée",
                data={"analyses": []}
            )
        
        # Collect all recommended analyses from top diseases
        analyses_count = {}
        analyses_by_disease = {}
        
        for diagnostic in result.diagnostics[:10]:  # Top 10 diseases
            disease_name = diagnostic.maladie
            examens = diagnostic.examens_recommandes or []
            logger.info(f"  📋 {disease_name}: {len(examens)} examens - {examens[:3]}")
            
            for examen in examens:
                # Count occurrences
                analyses_count[examen] = analyses_count.get(examen, 0) + 1
                
                # Track which diseases recommend this analysis
                if examen not in analyses_by_disease:
                    analyses_by_disease[examen] = []
                analyses_by_disease[examen].append({
                    "maladie": disease_name,
                    "score": diagnostic.score
                })
        
        # Sort by frequency (most recommended first)
        sorted_analyses = sorted(
            analyses_count.items(),
            key=lambda x: x[1],
            reverse=True
        )
        
        logger.info(f"✅ Found {len(sorted_analyses)} unique analyses")
        
        # Build response with details
        total_diseases = len(result.diagnostics)
        recommended_analyses = []
        for analysis_name, count in sorted_analyses[:15]:  # Top 15 analyses
            diseases = analyses_by_disease[analysis_name]
            pct = round(count / total_diseases * 100) if total_diseases > 0 else 0
            recommended_analyses.append({
                "name": analysis_name,
                "frequency": count,
                "recommended_by": len(diseases),
                "percentage": pct,
                "diseases": [d["maladie"] for d in diseases[:3]],  # Top 3 diseases
                "priority": "high" if count >= 5 else "medium" if count >= 3 else "low"
            })
        
        return SuccessResponse(
            success=True,
            message=f"{len(recommended_analyses)} analyse(s) recommandée(s)",
            data={
                "analyses": recommended_analyses,
                "total_diseases": len(result.diagnostics),
                "patient_info": {"age": request.age, "sexe": request.sexe, "symptomes": request.symptomes}
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting examinations: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Erreur lors de la récupération des examens: {str(e)}")


@router.get("/stats")
async def get_diagnostic_stats():
    """
    Get diagnostic system statistics
    
    Returns information about the dataset and system
    """
    try:
        dataset_loader = get_dataset_loader()
        stats = dataset_loader.get_dataset_stats()
        
        return SuccessResponse(
            success=True,
            message="Statistiques du système",
            data=stats
        )
    except Exception as e:
        logger.error(f"Error getting stats: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération des statistiques: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """
    Health check endpoint
    
    Verify that the diagnostic system is operational
    """
    try:
        dataset_loader = get_dataset_loader()
        
        # Check if dataset is loaded
        if dataset_loader.df is None or dataset_loader.df.empty:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Dataset not loaded"
            )
        
        return SuccessResponse(
            success=True,
            message="Système de diagnostic opérationnel",
            data={
                "status": "healthy",
                "diseases_loaded": len(dataset_loader.df),
                "version": "1.0.0"
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Health check failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Service unavailable: {str(e)}"
        )
