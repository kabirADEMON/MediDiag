"""
Metadata routes - Get symptoms and analyses from dataset
"""
from fastapi import APIRouter, HTTPException, status, Query
from typing import List, Optional
import logging
import pandas as pd

from app.models.response_models import SuccessResponse
from app.services.preprocessing_service import get_dataset_loader

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/metadata", tags=["Metadata"])


@router.get("/symptoms")
async def get_all_symptoms(search: Optional[str] = Query(None, min_length=1)):
    """
    Get all unique symptoms from the dataset
    
    **Query Parameters:**
    - search: Optional search query to filter symptoms
    
    **Returns:**
    - List of unique symptoms
    """
    try:
        dataset_loader = get_dataset_loader()
        
        if dataset_loader.df is None or dataset_loader.df.empty:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Dataset not loaded"
            )
        
        # Extract all symptoms from all symptom columns
        all_symptoms = set()
        symptom_columns = [f'Symptôme_{i}' for i in range(1, 10)]
        
        for col in symptom_columns:
            if col in dataset_loader.df.columns:
                symptoms = dataset_loader.df[col].dropna().unique()
                all_symptoms.update(symptoms)
        
        # Convert to sorted list
        symptoms_list = sorted(list(all_symptoms))
        
        # Apply search filter if provided
        if search:
            search_lower = search.lower()
            symptoms_list = [
                s for s in symptoms_list 
                if search_lower in s.lower()
            ]
        
        return SuccessResponse(
            success=True,
            message=f"{len(symptoms_list)} symptôme(s) trouvé(s)",
            data={
                "symptoms": symptoms_list,
                "total": len(symptoms_list)
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting symptoms: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération des symptômes: {str(e)}"
        )


@router.get("/analyses")
async def get_all_analyses(search: Optional[str] = Query(None, min_length=1)):
    """
    Get all unique biological analyses with their possible results from the dataset
    
    **Query Parameters:**
    - search: Optional search query to filter analyses
    
    **Returns:**
    - List of analysis-result pairs (e.g., "NFS: anémie normocytaire")
    """
    try:
        dataset_loader = get_dataset_loader()
        
        if dataset_loader.df is None or dataset_loader.df.empty:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Dataset not loaded"
            )
        
        # Extract analysis-result pairs from the dataset
        analysis_result_pairs = set()
        
        # Iterate through each disease row
        for _, row in dataset_loader.df.iterrows():
            analyses_text = row.get('Analyses_biologiques_et_examens', '')
            results_text = row.get('Résultats_attendus', '')
            
            if pd.isna(analyses_text) or pd.isna(results_text):
                continue
            
            # Split by semicolon
            analyses = [a.strip() for a in str(analyses_text).split(';') if a.strip()]
            results = [r.strip() for r in str(results_text).split(';') if r.strip()]
            
            # Pair each analysis with its result
            for i, analysis in enumerate(analyses):
                if i < len(results):
                    result = results[i]
                    # Create the pair "Analysis: Result"
                    pair = f"{analysis}: {result}"
                    analysis_result_pairs.add(pair)
                else:
                    # If no corresponding result, just add the analysis name
                    analysis_result_pairs.add(analysis)
        
        # Convert to sorted list
        analyses_list = sorted(list(analysis_result_pairs))
        
        logger.info(f"Found {len(analyses_list)} unique analysis-result pairs in dataset")
        
        # Apply search filter if provided
        if search:
            search_lower = search.lower()
            analyses_list = [
                a for a in analyses_list 
                if search_lower in a.lower()
            ]
        
        # Return as simple strings (the pair already contains the info)
        return SuccessResponse(
            success=True,
            message=f"{len(analyses_list)} analyse(s) trouvée(s)",
            data={
                "analyses": analyses_list,
                "total": len(analyses_list)
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting analyses: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération des analyses: {str(e)}"
        )


@router.get("/symptoms/popular")
async def get_popular_symptoms(limit: int = Query(20, ge=1, le=100)):
    """
    Get most popular symptoms from the dataset
    
    **Query Parameters:**
    - limit: Maximum number of symptoms to return (default: 20)
    
    **Returns:**
    - List of most common symptoms
    """
    try:
        dataset_loader = get_dataset_loader()
        
        if dataset_loader.df is None or dataset_loader.df.empty:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Dataset not loaded"
            )
        
        # Count symptom occurrences
        symptom_counts = {}
        symptom_columns = [f'Symptôme_{i}' for i in range(1, 10)]
        
        for col in symptom_columns:
            if col in dataset_loader.df.columns:
                for symptom in dataset_loader.df[col].dropna():
                    symptom_counts[symptom] = symptom_counts.get(symptom, 0) + 1
        
        # Sort by frequency and get top N
        popular_symptoms = sorted(
            symptom_counts.items(),
            key=lambda x: x[1],
            reverse=True
        )[:limit]
        
        symptoms_list = [
            {"name": symptom, "count": count}
            for symptom, count in popular_symptoms
        ]
        
        return SuccessResponse(
            success=True,
            message=f"{len(symptoms_list)} symptôme(s) populaire(s)",
            data={
                "symptoms": symptoms_list,
                "total": len(symptoms_list)
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting popular symptoms: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération des symptômes populaires: {str(e)}"
        )


@router.get("/analyses/popular")
async def get_popular_analyses(limit: int = Query(20, ge=1, le=100)):
    """
    Get most popular analyses from the dataset
    
    **Query Parameters:**
    - limit: Maximum number of analyses to return (default: 20)
    
    **Returns:**
    - List of most common analyses
    """
    try:
        dataset_loader = get_dataset_loader()
        
        if dataset_loader.df is None or dataset_loader.df.empty:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Dataset not loaded"
            )
        
        # Count analysis occurrences
        analysis_counts = {}
        analysis_columns = [f'Analyse_{i}' for i in range(1, 10)]
        
        for col in analysis_columns:
            if col in dataset_loader.df.columns:
                for analysis in dataset_loader.df[col].dropna():
                    analysis_counts[analysis] = analysis_counts.get(analysis, 0) + 1
        
        # Sort by frequency and get top N
        popular_analyses = sorted(
            analysis_counts.items(),
            key=lambda x: x[1],
            reverse=True
        )[:limit]
        
        analyses_list = [
            {"name": analysis, "count": count}
            for analysis, count in popular_analyses
        ]
        
        return SuccessResponse(
            success=True,
            message=f"{len(analyses_list)} analyse(s) populaire(s)",
            data={
                "analyses": analyses_list,
                "total": len(analyses_list)
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting popular analyses: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération des analyses populaires: {str(e)}"
        )
