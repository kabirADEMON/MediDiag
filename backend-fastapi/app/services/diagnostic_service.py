"""
Main diagnostic service - Orchestrates the entire diagnostic process
"""
from typing import List, Dict, Optional
import logging
from datetime import datetime

from app.models.request_models import DiagnosticRequest
from app.models.response_models import DiagnosticResult, DiagnosticResponse
from app.services.matching_service import get_matching_engine
from app.services.scoring_service import get_scoring_service
from app.services.recommendation_service import get_recommendation_service

logger = logging.getLogger(__name__)


class DiagnosticService:
    """Main service for performing medical diagnostics"""
    
    def __init__(self):
        self.matching_engine = get_matching_engine()
        self.scoring_service = get_scoring_service()
        self.recommendation_service = get_recommendation_service()
    
    def perform_diagnostic(
        self,
        request: DiagnosticRequest,
        top_n: int = 10
    ) -> DiagnosticResponse:
        """
        Perform complete diagnostic analysis
        
        Args:
            request: Diagnostic request with patient data
            top_n: Number of top diagnoses to return
            
        Returns:
            DiagnosticResponse with results
        """
        try:
            logger.info(f"Starting diagnostic for age={request.age}, sex={request.sexe}")
            logger.info(f"Symptoms: {request.symptomes}")
            
            # Step 1: Match diseases
            matched_diseases = self.matching_engine.match_diseases(
                age=request.age,
                sex=request.sexe,
                symptoms=request.symptomes,
                top_n=top_n
            )
            
            if not matched_diseases:
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
            
            # Step 2: Calculate detailed scores and build results
            diagnostic_results = []
            
            for disease in matched_diseases:
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
                
                # Calculate final score
                final_score = self.scoring_service.calculate_final_score(
                    symptom_score=disease['score'],
                    age_compatibility=age_score,
                    sex_compatibility=sex_score,
                    analyses_match=0.0  # TODO: Implement if analyses provided
                )
                
                # Determine urgency level
                urgency = self.scoring_service.calculate_urgency_level(
                    disease['disease_name'],
                    final_score,
                    disease['matched_symptoms']
                )
                
                # Extract matching arguments
                arguments = self.scoring_service.extract_matching_arguments(
                    disease['matched_symptoms'],
                    max_arguments=5
                )
                
                # Get recommended examinations (first 5 from disease)
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
            
            # Step 3: Sort by final score
            diagnostic_results.sort(key=lambda x: x.score, reverse=True)
            
            # Step 4: Build response
            response = DiagnosticResponse(
                success=True,
                message=f"{len(diagnostic_results)} diagnostic(s) possible(s) identifié(s)",
                diagnostics=diagnostic_results,
                patient_info={
                    "age": request.age,
                    "sexe": request.sexe,
                    "symptomes": request.symptomes,
                    "nombre_symptomes": len(request.symptomes)
                },
                timestamp=datetime.now()
            )
            
            logger.info(f"Diagnostic completed successfully: {len(diagnostic_results)} results")
            
            return response
            
        except Exception as e:
            logger.error(f"Error during diagnostic: {e}", exc_info=True)
            return DiagnosticResponse(
                success=False,
                message=f"Erreur lors du diagnostic: {str(e)}",
                diagnostics=[],
                patient_info={
                    "age": request.age,
                    "sexe": request.sexe
                }
            )
    
    def get_recommended_examinations(
        self,
        diagnostic_results: List[DiagnosticResult],
        urgency_level: Optional[str] = None
    ) -> Dict[str, List[str]]:
        """
        Get prioritized examination recommendations
        
        Args:
            diagnostic_results: List of diagnostic results
            urgency_level: Optional urgency level override
            
        Returns:
            Dictionary with prioritized examinations
        """
        # Extract top diseases info
        top_diseases = []
        for result in diagnostic_results[:5]:
            top_diseases.append({
                'disease_name': result.maladie,
                'score': result.score,
                'analyses': result.examens_recommandes
            })
        
        # Get recommendations
        examinations = self.recommendation_service.recommend_examinations(
            top_diseases,
            max_exams=10
        )
        
        # Determine urgency level
        if urgency_level is None and diagnostic_results:
            urgency_level = diagnostic_results[0].urgence
        
        # Prioritize examinations
        prioritized = self.recommendation_service.prioritize_examinations(
            examinations,
            urgency_level or 'faible'
        )
        
        return prioritized
    
    def get_diagnostic_summary(
        self,
        diagnostic_response: DiagnosticResponse
    ) -> Dict:
        """
        Generate a summary of the diagnostic
        
        Args:
            diagnostic_response: Diagnostic response
            
        Returns:
            Summary dictionary
        """
        if not diagnostic_response.diagnostics:
            return {
                "status": "no_match",
                "message": "Aucun diagnostic trouvé",
                "recommendation": "Consulter un médecin pour évaluation clinique"
            }
        
        top_result = diagnostic_response.diagnostics[0]
        
        # Determine recommendation
        urgent_consultation = self.scoring_service.should_recommend_urgent_consultation(
            top_result.urgence,
            top_result.score
        )
        
        confidence = self.scoring_service.calculate_confidence_level(top_result.score)
        
        summary = {
            "status": "success",
            "top_diagnosis": top_result.maladie,
            "confidence": confidence,
            "score": top_result.score,
            "urgency": top_result.urgence,
            "urgent_consultation_required": urgent_consultation,
            "total_matches": len(diagnostic_response.diagnostics),
            "recommendation": self._generate_recommendation(top_result, urgent_consultation)
        }
        
        return summary
    
    def _generate_recommendation(
        self,
        result: DiagnosticResult,
        urgent: bool
    ) -> str:
        """Generate recommendation text"""
        if urgent:
            return f"⚠️ Consultation médicale URGENTE recommandée. Diagnostic probable: {result.maladie}"
        elif result.urgence == 'modérée':
            return f"Consultation médicale recommandée dans les 24-48h. Diagnostic probable: {result.maladie}"
        else:
            return f"Consultation médicale conseillée. Diagnostic possible: {result.maladie}"


# Global diagnostic service instance
diagnostic_service = DiagnosticService()


def get_diagnostic_service() -> DiagnosticService:
    """Get the global diagnostic service instance"""
    return diagnostic_service
