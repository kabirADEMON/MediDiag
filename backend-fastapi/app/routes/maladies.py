"""
Maladies routes - Disease information endpoints
"""
from fastapi import APIRouter, HTTPException, Query, status
from typing import Optional
import logging

from app.models.response_models import SuccessResponse, MaladieInfo
from app.services.preprocessing_service import get_dataset_loader

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/maladies", tags=["Maladies"])


@router.get("/")
async def get_all_diseases(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=100, description="Number of records to return"),
    search: Optional[str] = Query(None, description="Search by disease name")
):
    """
    Get list of all diseases
    
    **Query Parameters:**
    - skip: Pagination offset
    - limit: Number of results (max 100)
    - search: Optional search term
    
    **Returns:**
    - List of diseases with basic information
    """
    try:
        dataset_loader = get_dataset_loader()
        
        if search:
            # Search diseases
            diseases = dataset_loader.search_diseases(search, limit=limit)
        else:
            # Get all diseases with pagination
            df = dataset_loader.get_all_diseases()
            diseases = df.iloc[skip:skip+limit].to_dict('records')
        
        # Format response
        formatted_diseases = []
        for disease in diseases:
            formatted_diseases.append({
                "id": int(disease.get('N°', 0)),
                "nom": disease.get('Maladie', ''),
                "age_min": int(disease.get('Age_Min', 0)),
                "age_max": int(disease.get('Age_Max', 0)),
                "age_typique": int(disease.get('Age_Typique', 0)),
                "sexe_predominant": disease.get('Sexe_Predominant', 'Both')
            })
        
        return SuccessResponse(
            success=True,
            message=f"{len(formatted_diseases)} maladie(s) trouvée(s)",
            data={
                "diseases": formatted_diseases,
                "total": len(dataset_loader.get_all_diseases()),
                "skip": skip,
                "limit": limit
            }
        )
    except Exception as e:
        logger.error(f"Error getting diseases: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération des maladies: {str(e)}"
        )


@router.get("/{disease_id}")
async def get_disease_by_id(disease_id: int):
    """
    Get detailed information about a specific disease
    
    **Path Parameters:**
    - disease_id: Disease ID (1-1000)
    
    **Returns:**
    - Complete disease information including symptoms and examinations
    """
    try:
        dataset_loader = get_dataset_loader()
        disease = dataset_loader.get_disease_by_id(disease_id)
        
        if not disease:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Maladie avec ID {disease_id} non trouvée"
            )
        
        # Format symptoms
        symptoms = []
        for i in range(1, 10):
            symptom = disease.get(f'Symptôme_{i}', '')
            if symptom:
                symptoms.append(symptom)
        
        # Format response
        disease_info = {
            "id": int(disease.get('N°', 0)),
            "nom": disease.get('Maladie', ''),
            "age_min": int(disease.get('Age_Min', 0)),
            "age_max": int(disease.get('Age_Max', 0)),
            "age_typique": int(disease.get('Age_Typique', 0)),
            "sexe_predominant": disease.get('Sexe_Predominant', 'Both'),
            "symptomes": symptoms,
            "analyses_biologiques": disease.get('Analyses_biologiques_et_examens', ''),
            "resultats_attendus": disease.get('Résultats_attendus', '')
        }
        
        return SuccessResponse(
            success=True,
            message="Maladie trouvée",
            data=disease_info
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting disease {disease_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération de la maladie: {str(e)}"
        )


@router.get("/search/{query}")
async def search_diseases(
    query: str,
    limit: int = Query(20, ge=1, le=50, description="Number of results")
):
    """
    Search diseases by name
    
    **Path Parameters:**
    - query: Search term
    
    **Query Parameters:**
    - limit: Maximum number of results
    
    **Returns:**
    - List of matching diseases
    """
    try:
        dataset_loader = get_dataset_loader()
        diseases = dataset_loader.search_diseases(query, limit=limit)
        
        if not diseases:
            return SuccessResponse(
                success=True,
                message="Aucune maladie trouvée",
                data={"diseases": [], "query": query}
            )
        
        # Format response
        formatted_diseases = []
        for disease in diseases:
            formatted_diseases.append({
                "id": int(disease.get('N°', 0)),
                "nom": disease.get('Maladie', ''),
                "age_typique": int(disease.get('Age_Typique', 0)),
                "sexe_predominant": disease.get('Sexe_Predominant', 'Both')
            })
        
        return SuccessResponse(
            success=True,
            message=f"{len(formatted_diseases)} maladie(s) trouvée(s)",
            data={
                "diseases": formatted_diseases,
                "query": query,
                "count": len(formatted_diseases)
            }
        )
    except Exception as e:
        logger.error(f"Error searching diseases: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la recherche: {str(e)}"
        )


@router.get("/filter/age/{age}")
async def filter_diseases_by_age(
    age: int,
    limit: int = Query(50, ge=1, le=100)
):
    """
    Filter diseases by patient age
    
    **Path Parameters:**
    - age: Patient age
    
    **Returns:**
    - List of diseases compatible with the age
    """
    try:
        dataset_loader = get_dataset_loader()
        df_filtered = dataset_loader.filter_by_age(age)
        
        diseases = df_filtered.head(limit).to_dict('records')
        
        formatted_diseases = []
        for disease in diseases:
            formatted_diseases.append({
                "id": int(disease.get('N°', 0)),
                "nom": disease.get('Maladie', ''),
                "age_min": int(disease.get('Age_Min', 0)),
                "age_max": int(disease.get('Age_Max', 0)),
                "age_typique": int(disease.get('Age_Typique', 0))
            })
        
        return SuccessResponse(
            success=True,
            message=f"{len(formatted_diseases)} maladie(s) compatible(s) avec l'âge {age} ans",
            data={
                "diseases": formatted_diseases,
                "age": age,
                "total_compatible": len(df_filtered)
            }
        )
    except Exception as e:
        logger.error(f"Error filtering by age: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors du filtrage par âge: {str(e)}"
        )


@router.get("/categories/stats")
async def get_disease_categories():
    """
    Get disease statistics by categories
    
    **Returns:**
    - Statistics about disease distribution
    """
    try:
        dataset_loader = get_dataset_loader()
        stats = dataset_loader.get_dataset_stats()
        
        return SuccessResponse(
            success=True,
            message="Statistiques des catégories",
            data=stats
        )
    except Exception as e:
        logger.error(f"Error getting categories: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération des catégories: {str(e)}"
        )
