"""
Scoring service - Calculate final scores and urgency levels
"""
from typing import Dict, List
import logging

logger = logging.getLogger(__name__)


class ScoringService:
    """Service for calculating diagnostic scores and urgency levels"""
    
    # Urgency keywords for different levels
    URGENCY_KEYWORDS = {
        'critique': [
            'infarctus', 'avc', 'hemorragie', 'choc', 'coma', 'arret cardiaque',
            'embolie pulmonaire', 'meningite', 'sepsis', 'acidocetose',
            'convulsions', 'detresse respiratoire', 'purpura fulminans'
        ],
        'elevee': [
            'pneumonie', 'appendicite', 'cholecystite', 'pancreatite',
            'insuffisance cardiaque', 'insuffisance renale', 'thrombose',
            'pericardite', 'myocardite', 'encephalite', 'abces'
        ],
        'moderee': [
            'paludisme', 'dengue', 'typhoide', 'hepatite', 'tuberculose',
            'pneumopathie', 'pyelonephrite', 'cellulite', 'erysipele'
        ]
    }
    
    def calculate_urgency_level(
        self,
        disease_name: str,
        score: float,
        matched_symptoms: List[Dict]
    ) -> str:
        """
        Determine urgency level based on disease and symptoms
        
        Args:
            disease_name: Name of the disease
            score: Match score
            matched_symptoms: List of matched symptoms
            
        Returns:
            Urgency level: 'critique', 'élevée', 'modérée', 'faible'
        """
        disease_lower = disease_name.lower()
        
        # Check for critical diseases
        for keyword in self.URGENCY_KEYWORDS['critique']:
            if keyword in disease_lower:
                return 'critique'
        
        # Check for high urgency diseases
        for keyword in self.URGENCY_KEYWORDS['elevee']:
            if keyword in disease_lower:
                return 'élevée'
        
        # Check for moderate urgency diseases
        for keyword in self.URGENCY_KEYWORDS['moderee']:
            if keyword in disease_lower:
                return 'modérée'
        
        # Check symptom severity
        symptom_texts = ' '.join([
            s.get('patient_symptom', '') + ' ' + s.get('disease_symptom', '')
            for s in matched_symptoms
        ]).lower()
        
        # Critical symptoms
        critical_symptoms = [
            'douleur thoracique', 'paralysie', 'perte de conscience',
            'hemorragie', 'dyspnee severe', 'confusion', 'syncope'
        ]
        
        for symptom in critical_symptoms:
            if symptom in symptom_texts:
                return 'élevée'
        
        # Default based on score
        if score >= 85:
            return 'modérée'
        elif score >= 70:
            return 'faible'
        else:
            return 'faible'
    
    def calculate_analyses_match_score(
        self,
        provided_analyses: Dict[str, any],
        expected_analyses: List[str],
        expected_results: List[str],
        analyses_anomalies: List[str] = None,
    ) -> float:
        """
        Calculate how well provided analyses match expected results.

        Abnormal analyses matching a disease's expected pattern score much higher
        than normal ones (abnormal value confirms the disease, normal value just
        confirms the test was ordered).

        Returns a bonus score 0-100; no penalty for missing analyses.
        """
        if not provided_analyses or not expected_analyses:
            return 0.0

        anomaly_set = {a.lower() for a in (analyses_anomalies or [])}

        try:
            if isinstance(expected_analyses, str):
                expected_analyses = [a.strip() for a in expected_analyses.split(';')]

            expected_lower = [a.lower() for a in expected_analyses]

            total_bonus = 0.0
            max_per_match_abnormal = 25.0   # abnormal + name match → strong confirmation
            max_per_match_normal   = 8.0    # normal  + name match → weak confirmation

            for provided_name in provided_analyses.keys():
                p_low = provided_name.lower()
                p_terms = p_low.split()

                for exp in expected_lower:
                    match_found = (
                        p_low == exp
                        or p_low in exp
                        or exp in p_low
                        or any(
                            len(pt) >= 3 and et.startswith(pt[:3])
                            for pt in p_terms
                            for et in exp.split()
                        )
                    )
                    if match_found:
                        is_abnormal = p_low in anomaly_set
                        bonus = max_per_match_abnormal if is_abnormal else max_per_match_normal
                        total_bonus += bonus
                        logger.debug(
                            f"Analyses match: '{provided_name}' ≈ '{exp}' "
                            f"({'abnormal' if is_abnormal else 'normal'}) +{bonus}"
                        )
                        break

            return min(100.0, round(total_bonus, 2))

        except Exception as e:
            logger.error(f"Error calculating analyses match score: {e}")
            return 0.0
    
    def calculate_final_score(
        self,
        symptom_score: float,
        age_compatibility: float,
        sex_compatibility: float,
        analyses_match: float = 0.0
    ) -> float:
        """
        Calculate final weighted score
        
        Args:
            symptom_score: Symptom match score (0-100)
            age_compatibility: Age compatibility score (0-100)
            sex_compatibility: Sex compatibility score (0-100)
            analyses_match: Lab results match score (0-100)
            
        Returns:
            Final weighted score (0-100)
        """
        # Weights — symptoms dominate as primary clinical evidence
        SYMPTOM_WEIGHT = 0.70  # 70%
        AGE_WEIGHT = 0.10      # 10%
        SEX_WEIGHT = 0.05      #  5%
        ANALYSES_WEIGHT = 0.15 # 15%
        
        final_score = (
            symptom_score * SYMPTOM_WEIGHT +
            age_compatibility * AGE_WEIGHT +
            sex_compatibility * SEX_WEIGHT +
            analyses_match * ANALYSES_WEIGHT
        )
        
        return round(final_score, 2)
    
    def extract_matching_arguments(
        self,
        matched_symptoms: List[Dict],
        max_arguments: int = 5
    ) -> List[str]:
        """
        Extract top matching arguments (symptoms) for display
        
        Args:
            matched_symptoms: List of matched symptoms with scores
            max_arguments: Maximum number of arguments to return
            
        Returns:
            List of argument strings
        """
        # Sort by score
        sorted_symptoms = sorted(
            matched_symptoms,
            key=lambda x: x.get('score', 0),
            reverse=True
        )
        
        arguments = []
        for symptom in sorted_symptoms[:max_arguments]:
            disease_symptom = symptom.get('disease_symptom', '')
            if disease_symptom:
                # Capitalize first letter
                formatted = disease_symptom[0].upper() + disease_symptom[1:]
                arguments.append(formatted)
        
        return arguments
    
    def calculate_confidence_level(self, score: float) -> str:
        """
        Determine confidence level based on score
        
        Args:
            score: Match score (0-100)
            
        Returns:
            Confidence level: 'très élevée', 'élevée', 'moyenne', 'faible'
        """
        if score >= 90:
            return 'très élevée'
        elif score >= 75:
            return 'élevée'
        elif score >= 60:
            return 'moyenne'
        else:
            return 'faible'
    
    def should_recommend_urgent_consultation(
        self,
        urgency_level: str,
        score: float
    ) -> bool:
        """
        Determine if urgent medical consultation is recommended
        
        Args:
            urgency_level: Urgency level
            score: Match score
            
        Returns:
            True if urgent consultation recommended
        """
        if urgency_level in ['critique', 'élevée']:
            return True
        
        if urgency_level == 'modérée' and score >= 85:
            return True
        
        return False


# Global scoring service instance
scoring_service = ScoringService()


def get_scoring_service() -> ScoringService:
    """Get the global scoring service instance"""
    return scoring_service
