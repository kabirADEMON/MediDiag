"""
Hybrid Diagnostic Service - Combines Fuzzy Matching + Machine Learning
"""
from typing import List, Dict, Optional
import logging
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor

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
            
            # Step 1+2: Fuzzy matching AND ML prediction run in parallel.
            # They are fully independent — no need to wait for one before the other.
            POOL_SIZE = 100 if request.analyses else 30

            fuzzy_results = []
            ml_results = []

            def _run_fuzzy():
                return self.matching_engine.match_diseases(
                    age=request.age,
                    sex=request.sexe,
                    symptoms=request.symptomes,
                    top_n=POOL_SIZE,
                    temporalite=request.temporalite,
                    symptomes_absents=request.symptomes_absents,
                )

            def _run_ml():
                if not (use_ml and self.ml_predictor.is_loaded):
                    return []
                return self.ml_predictor.predict(
                    symptoms=request.symptomes,
                    age=request.age,
                    sex=request.sexe,
                    top_n=POOL_SIZE,
                    min_probability=0.01,
                )

            with ThreadPoolExecutor(max_workers=2) as pool:
                f_fuzzy = pool.submit(_run_fuzzy)
                f_ml    = pool.submit(_run_ml)
                fuzzy_results = f_fuzzy.result()
                ml_results    = f_ml.result()

            logger.info(f"Fuzzy: {len(fuzzy_results)} | ML: {len(ml_results)} predictions")

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
            
            # Step 3: Combine results (Hybrid scoring)
            combined_results = self._combine_results(
                fuzzy_results,
                ml_results,
                request
            )
            
            # Step 4: Build diagnostic results, tracking raw (uncapped) scores
            # so that sorting is not frozen by the 100-point cap.
            raw_scored: list[tuple[float, DiagnosticResult]] = []

            for disease in combined_results:
                # Age / sex compatibility
                age_compatible, age_score = self.matching_engine.calculate_age_compatibility(
                    request.age,
                    disease['age_min'],
                    disease['age_max'],
                    disease['age_typical']
                )
                sex_compatible, sex_score = self.matching_engine.calculate_sex_compatibility(
                    request.sexe,
                    disease['sex_predominant']
                )

                # Analyses match score
                analyses_score = 0.0
                if request.analyses:
                    analyses_score = self.scoring_service.calculate_analyses_match_score(
                        request.analyses,
                        disease.get('analyses', []),
                        disease.get('expected_results', []),
                        analyses_anomalies=request.analyses_anomalies or [],
                    )
                    logger.info(f"  📊 {disease['disease_name']}: analyses_score={analyses_score:.1f}%")

                # Base = hybrid score (ML 70% + fuzzy 30%)
                final_score = disease['hybrid_score']

                # Analyses boost — intentionally NOT capped here so that a
                # lower-ranked disease can overtake the preliminary leader.
                if request.analyses and analyses_score > 0:
                    analyses_boost = (analyses_score / 100) * 60
                    final_score += analyses_boost
                    logger.info(
                        f"  ✨ {disease['disease_name']}: raw={final_score:.1f}% "
                        f"(analyses match: {analyses_score:.1f}%)"
                    )

                # Exclusionary malus: key symptom absent
                if disease.get('key_symptom_absent', False):
                    final_score = round(final_score * 0.5, 2)
                    logger.info(f"  ✂ Exclusionary malus '{disease['disease_name']}': → {final_score}")

                # ScoreCliniqueManager validated clinical boost
                clinical_boost = self.clinical_scoring.compute_boost(
                    disease_name=disease['disease_name'],
                    symptoms=request.symptomes,
                    age=request.age,
                )
                if clinical_boost > 0:
                    final_score = round(final_score + clinical_boost, 2)
                    logger.info(f"  ⬆ Clinical boost '{disease['disease_name']}': +{clinical_boost} → {final_score}")

                raw_score = round(final_score, 2)

                urgency = self.scoring_service.calculate_urgency_level(
                    disease['disease_name'],
                    raw_score,
                    disease.get('matched_symptoms', [])
                )
                arguments = self.scoring_service.extract_matching_arguments(
                    disease.get('matched_symptoms', []),
                    max_arguments=5
                )
                if disease.get('ml_score'):
                    arguments.insert(0, f"Confiance IA: {disease['ml_score']:.0f}%")

                result = DiagnosticResult(
                    maladie=disease['disease_name'],
                    score=raw_score,          # will be normalised after sort
                    urgence=urgency,
                    compatibilite_age=age_compatible,
                    compatibilite_sexe=sex_compatible,
                    examens_recommandes=disease.get('analyses', [])[:5],
                    arguments=arguments if arguments else ["Correspondance des symptômes"]
                )
                raw_scored.append((raw_score, result))

            # Step 5a: Sort by RAW score (pre-cap) so a heavily-boosted disease
            # can displace the preliminary leader even if both would exceed 100.
            raw_scored.sort(key=lambda x: x[0], reverse=True)
            diagnostic_results = [r for _, r in raw_scored]

            # Step 5b: Anti-anchoring on the re-ordered list
            diagnostic_results = _apply_anti_anchoring(diagnostic_results)

            # Step 5c: Re-normalise so the winner always shows ≤ 85 %
            # (consistent with ML scale convention) — scales the whole list
            # proportionally so relative gaps are preserved.
            if diagnostic_results:
                top_raw = diagnostic_results[0].score
                if top_raw > 85.0:
                    scale = 85.0 / top_raw
                    for r in diagnostic_results:
                        r.score = round(r.score * scale, 2)
                else:
                    for r in diagnostic_results:
                        r.score = round(min(85.0, r.score), 2)

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
    
    @staticmethod
    def _disease_root(name: str) -> str:
        """Extract root name — strips variant in parentheses (matches train_model.py)."""
        return name.split('(')[0].strip()

    def _combine_results(
        self,
        fuzzy_results: List[Dict],
        ml_results: List[Dict],
        request: DiagnosticRequest
    ) -> List[Dict]:
        """
        Combine fuzzy matching and ML results with weighted scoring.

        ML now predicts root names ("Pneumonie").  Fuzzy results have variant
        names ("Pneumonie (Aiguë)").  The merge maps each ML root onto every
        fuzzy variant that shares the same root so the ML confidence spreads
        across all variants of the same pathology.
        """
        disease_scores: Dict[str, Dict] = {}

        for fuzzy in fuzzy_results:
            disease_name = fuzzy['disease_name']
            disease_scores[disease_name] = {
                **fuzzy,
                'fuzzy_score': fuzzy['score'],
                'ml_score': 0.0,
                'has_fuzzy': True,
                'has_ml': False,
            }

        # Build root → [variant names] index from fuzzy candidates
        root_to_variants: Dict[str, List[str]] = {}
        for dname in disease_scores:
            root = self._disease_root(dname)
            root_to_variants.setdefault(root, []).append(dname)

        # Normalize ML probabilities so the top prediction maps to 85 %.
        # Raw probabilities across 106 classes are small (~5-30 %) even for the
        # clear winner; this normalization preserves the relative ranking while
        # producing intuitive scores.
        if ml_results:
            max_ml_raw = max(ml['ml_score'] for ml in ml_results)
            if max_ml_raw > 0:
                TARGET_TOP = 85.0
                scale = min(TARGET_TOP / max_ml_raw, 5.0)  # cap at 5× amplification
                for ml in ml_results:
                    ml['ml_score'] = min(TARGET_TOP, round(ml['ml_score'] * scale, 2))

        # Apply ML scores to all fuzzy variants sharing the same root
        for ml in ml_results:
            ml_root = ml['disease_name']  # root name from the trained model
            ml_score = ml['ml_score']

            matching_variants = root_to_variants.get(ml_root, [])
            if matching_variants:
                for variant_name in matching_variants:
                    existing = disease_scores[variant_name]['ml_score']
                    # Keep the highest ML score if root appears multiple times
                    if ml_score > existing:
                        disease_scores[variant_name]['ml_score'] = ml_score
                        disease_scores[variant_name]['has_ml'] = True
            else:
                # Root not in fuzzy candidates — exact name fallback
                if ml_root in disease_scores:
                    disease_scores[ml_root]['ml_score'] = ml_score
                    disease_scores[ml_root]['has_ml'] = True

        # Calculate hybrid scores
        for disease in disease_scores.values():
            fuzzy_score = disease['fuzzy_score']
            ml_score = disease['ml_score']

            if disease['has_ml']:
                hybrid_score = (
                    fuzzy_score * self.FUZZY_WEIGHT +
                    ml_score * self.ML_WEIGHT
                )
            else:
                hybrid_score = fuzzy_score

            disease['hybrid_score'] = round(hybrid_score, 2)

        combined = list(disease_scores.values())
        combined.sort(key=lambda x: x['hybrid_score'], reverse=True)

        ml_hits = sum(1 for d in combined if d['has_ml'])
        logger.info(f"Combined {len(combined)} diseases, {ml_hits} with ML boost")

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
