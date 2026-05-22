"""
Hybrid Diagnostic Service - Combines Fuzzy Matching + Machine Learning
"""
from typing import List, Dict, Optional
import logging
from datetime import datetime

from app.models.request_models import DiagnosticRequest
from app.models.response_models import DiagnosticResult, DiagnosticResponse
from app.services.matching_service import get_matching_engine
from app.services.scoring_service import get_scoring_service
from app.services.recommendation_service import get_recommendation_service
from app.services.clinical_scoring_service import get_clinical_scoring_manager
from app.services.diagnostic_service import _apply_anti_anchoring
from app.ml.predictor import get_ml_predictor

logger = logging.getLogger(__name__)


class HybridDiagnosticService:
    """
    Hybrid diagnostic service combining:
    - Fuzzy matching (RapidFuzz) - 30% weight
    - Machine Learning (Random Forest) - 70% weight
    """
    
    def __init__(self):
        self.matching_engine = get_matching_engine()
        self.scoring_service = get_scoring_service()
        self.recommendation_service = get_recommendation_service()
        self.clinical_scoring = get_clinical_scoring_manager()
        self.ml_predictor = get_ml_predictor()
        
        # Weights for hybrid scoring
        self.ML_WEIGHT = 0.70  # 70% ML
        self.FUZZY_WEIGHT = 0.30  # 30% Fuzzy matching
    
    def perform_diagnostic(
        self,
        request: DiagnosticRequest,
        top_n: int = 10,
        use_ml: bool = True
    ) -> DiagnosticResponse:
        """
        Perform hybrid diagnostic analysis
        
        Args:
            request: Diagnostic request with patient data
            top_n: Number of top diagnoses to return
            use_ml: Whether to use ML predictions (fallback to fuzzy only if False)
            
        Returns:
            DiagnosticResponse with results
        """
        try:
            logger.info(f"Starting HYBRID diagnostic for age={request.age}, sex={request.sexe}")
            logger.info(f"Symptoms: {request.symptomes}")
            logger.info(f"ML enabled: {use_ml}")
            
            # Step 1: Get fuzzy matching results
            fuzzy_results = self.matching_engine.match_diseases(
                age=request.age,
                sex=request.sexe,
                symptoms=request.symptomes,
                top_n=20  # Get more candidates for ML
            )
            
            if not fuzzy_results:
                logger.warning("No matching diseases found")
                return DiagnosticResponse(
                    success=False,
                    message="Aucune maladie correspondante trouvée. Veuillez consulter un médecin.",
                    diagnostics=[],
                    patient_info={
                        "age": request.age,
                        "sexe": request.sexe,
                        "symptomes": request.symptomes
                    }
                )
            
            # Step 2: Get ML predictions (if enabled and available)
            ml_results = []
            if use_ml and self.ml_predictor.is_loaded:
                logger.info("Getting ML predictions with age and sex...")
                ml_results = self.ml_predictor.predict(
                    symptoms=request.symptomes,
                    age=request.age,  # Pass age to ML
                    sex=request.sexe,  # Pass sex to ML
                    top_n=20,
                    min_probability=0.01
                )
                logger.info(f"ML returned {len(ml_results)} predictions")
            else:
                logger.info("ML not used, using fuzzy matching only")
            
            # Step 3: Combine results (Hybrid scoring)
            combined_results = self._combine_results(
                fuzzy_results,
                ml_results,
                request
            )
            
            # Step 4: Build diagnostic results
            diagnostic_results = []
            
            for disease in combined_results[:top_n]:
                # Calculate age compatibility
                age_compatible, age_score = self.matching_engine.calculate_age_compatibility(
                    request.age,
                    disease['age_min'],
                    disease['age_max'],
                    disease['age_typical']
                )
                
                # Calculate sex compatibility
                sex_compatible, sex_score = self.matching_engine.calculate_sex_compatibility(
                    request.sexe,
                    disease['sex_predominant']
                )
                
                # Calculate analyses match score if analyses provided
                analyses_score = 0.0
                if request.analyses:
                    analyses_score = self.scoring_service.calculate_analyses_match_score(
                        request.analyses,
                        disease.get('analyses', []),
                        disease.get('expected_results', []),
                        analyses_anomalies=request.analyses_anomalies or [],
                    )
                    logger.info(f"  📊 {disease['disease_name']}: analyses_score={analyses_score:.1f}%")
                
                # Use hybrid score as base
                final_score = disease['hybrid_score']

                # Analyses boost
                if request.analyses and analyses_score > 0:
                    analyses_boost = (analyses_score / 100) * 30
                    final_score = min(100, final_score + analyses_boost)
                    logger.info(f"  ✨ {disease['disease_name']}: boosted to {final_score:.1f}% (analyses match: {analyses_score:.1f}%)")

                # Exclusionary logic: key mandatory symptom absent → moderate malus
                if disease.get('key_symptom_absent', False):
                    final_score = round(final_score * 0.5, 2)
                    logger.info(f"  ✂ Exclusionary malus '{disease['disease_name']}': key symptom absent → {final_score}")

                # ScoreCliniqueManager: validated clinical score boost
                clinical_boost = self.clinical_scoring.compute_boost(
                    disease_name=disease['disease_name'],
                    symptoms=request.symptomes,
                    age=request.age,
                )
                if clinical_boost > 0:
                    final_score = min(100.0, round(final_score + clinical_boost, 2))
                    logger.info(f"  ⬆ Clinical boost '{disease['disease_name']}': +{clinical_boost} → {final_score}")
                
                # Determine urgency level
                urgency = self.scoring_service.calculate_urgency_level(
                    disease['disease_name'],
                    final_score,
                    disease.get('matched_symptoms', [])
                )
                
                # Extract matching arguments
                arguments = self.scoring_service.extract_matching_arguments(
                    disease.get('matched_symptoms', []),
                    max_arguments=5
                )
                
                # Add ML confidence if available
                if disease.get('ml_score'):
                    arguments.insert(0, f"Confiance IA: {disease['ml_score']:.0f}%")
                
                # Get recommended examinations
                examinations = disease.get('analyses', [])[:5]
                
                # Create diagnostic result
                result = DiagnosticResult(
                    maladie=disease['disease_name'],
                    score=final_score,
                    urgence=urgency,
                    compatibilite_age=age_compatible,
                    compatibilite_sexe=sex_compatible,
                    examens_recommandes=examinations,
                    arguments=arguments if arguments else ["Correspondance des symptômes"]
                )
                
                diagnostic_results.append(result)
            
            # Step 5: Sort, deduplicate, threshold
            diagnostic_results.sort(key=lambda x: x.score, reverse=True)

            # Anti-anchoring: max 1 variant per root in top 4, embed duplicates as variantes
            diagnostic_results = _apply_anti_anchoring(diagnostic_results)

            # Minimum confidence threshold — intentionally low (hybrid ML scores scale 0-100)
            MIN_SCORE = 1.0
            if diagnostic_results and diagnostic_results[0].score < MIN_SCORE:
                logger.warning(f"Low confidence: top score={diagnostic_results[0].score:.1f} < {MIN_SCORE}")
                return DiagnosticResponse(
                    success=True,
                    message=(
                        "Les symptômes fournis sont insuffisants pour établir un diagnostic fiable. "
                        "Veuillez préciser ou ajouter d'autres symptômes."
                    ),
                    diagnostics=[],
                    patient_info={
                        "age": request.age,
                        "sexe": request.sexe,
                        "symptomes": request.symptomes,
                        "low_confidence": True,
                    },
                    timestamp=datetime.now()
                )

            # Step 6: Build response
            ml_status = "activé" if (use_ml and self.ml_predictor.is_loaded) else "désactivé"

            response = DiagnosticResponse(
                success=True,
                message=f"{len(diagnostic_results)} diagnostic(s) identifié(s) (IA {ml_status})",
                diagnostics=diagnostic_results,
                patient_info={
                    "age": request.age,
                    "sexe": request.sexe,
                    "symptomes": request.symptomes,
                    "nombre_symptomes": len(request.symptomes),
                    "ml_enabled": use_ml and self.ml_predictor.is_loaded
                },
                timestamp=datetime.now()
            )

            logger.info(f"Hybrid diagnostic completed: {len(diagnostic_results)} results")
            
            return response
            
        except Exception as e:
            logger.error(f"Error during hybrid diagnostic: {e}", exc_info=True)
            return DiagnosticResponse(
                success=False,
                message=f"Erreur lors du diagnostic: {str(e)}",
                diagnostics=[],
                patient_info={
                    "age": request.age,
                    "sexe": request.sexe
                }
            )
    
    def _combine_results(
        self,
        fuzzy_results: List[Dict],
        ml_results: List[Dict],
        request: DiagnosticRequest
    ) -> List[Dict]:
        """
        Combine fuzzy matching and ML results with weighted scoring
        
        Args:
            fuzzy_results: Results from fuzzy matching
            ml_results: Results from ML model
            request: Original request
            
        Returns:
            Combined and sorted results
        """
        # Create a dictionary to merge results by disease name
        disease_scores = {}
        
        # Add fuzzy matching results
        for fuzzy in fuzzy_results:
            disease_name = fuzzy['disease_name']
            disease_scores[disease_name] = {
                **fuzzy,
                'fuzzy_score': fuzzy['score'],
                'ml_score': 0.0,
                'has_fuzzy': True,
                'has_ml': False
            }
        
        # Add/merge ML results
        for ml in ml_results:
            disease_name = ml['disease_name']
            
            if disease_name in disease_scores:
                # Disease found in both - merge
                disease_scores[disease_name]['ml_score'] = ml['ml_score']
                disease_scores[disease_name]['has_ml'] = True
            else:
                # Disease only in ML - need to get details from dataset
                disease_info = self.matching_engine.dataset_loader.get_disease_by_name(disease_name)
                
                if disease_info:
                    disease_scores[disease_name] = {
                        'disease_id': disease_info['N°'],
                        'disease_name': disease_name,
                        'fuzzy_score': 0.0,
                        'ml_score': ml['ml_score'],
                        'has_fuzzy': False,
                        'has_ml': True,
                        'age_min': disease_info['Age_Min'],
                        'age_max': disease_info['Age_Max'],
                        'age_typical': disease_info['Age_Typique'],
                        'sex_predominant': disease_info['Sexe_Predominant'],
                        'matched_symptoms': [],
                        'all_disease_symptoms': disease_info.get('all_symptoms', []),
                        'analyses': disease_info.get('analyses_list', []),
                        'expected_results': disease_info.get('resultats_list', [])
                    }
        
        # Calculate hybrid scores
        for disease_name, disease in disease_scores.items():
            fuzzy_score = disease['fuzzy_score']
            ml_score = disease['ml_score']
            
            # Weighted combination
            if disease['has_ml']:
                # Use ML weight
                hybrid_score = (
                    fuzzy_score * self.FUZZY_WEIGHT +
                    ml_score * self.ML_WEIGHT
                )
            else:
                # Only fuzzy matching available
                hybrid_score = fuzzy_score
            
            disease['hybrid_score'] = round(hybrid_score, 2)
        
        # Convert to list and sort by hybrid score
        combined = list(disease_scores.values())
        combined.sort(key=lambda x: x['hybrid_score'], reverse=True)
        
        logger.info(f"Combined {len(combined)} unique diseases")
        
        return combined
    
    def get_model_status(self) -> Dict:
        """Get status of ML model"""
        if self.ml_predictor.is_loaded:
            model_info = self.ml_predictor.get_model_info()
            return {
                "ml_available": True,
                "model_info": model_info,
                "weights": {
                    "ml": self.ML_WEIGHT,
                    "fuzzy": self.FUZZY_WEIGHT
                }
            }
        else:
            return {
                "ml_available": False,
                "message": "ML model not trained. Run train_model.py to enable ML predictions.",
                "fallback": "Using fuzzy matching only"
            }


# Global hybrid diagnostic service instance
hybrid_diagnostic_service = HybridDiagnosticService()


def get_hybrid_diagnostic_service() -> HybridDiagnosticService:
    """Get the global hybrid diagnostic service instance"""
    return hybrid_diagnostic_service
