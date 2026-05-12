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
        expected_results: List[str]
    ) -> float:
        """
        Calculate how well provided analyses match expected results
        
        Args:
            provided_analyses: Dict of "Analysis: Result" -> value (1 for selected)
            expected_analyses: List of expected analyses for the disease
            expected_results: List of expected results for the disease
            
        Returns:
            Match score (0-100)
        """
        if not provided_analyses or not expected_analyses:
            return 0.0
        
        # Build expected pairs from the disease
        expected_pairs = []
        for i, analysis in enumerate(expected_analyses):
            if i < len(expected_results):
                expected_pairs.append(f"{analysis}: {expected_results[i]}")
            else:
                expected_pairs.append(analysis)
        
        # Count matches
        matches = 0
        total_provided = len(provided_analyses)
        
        for provided_pair in provided_analyses.keys():
            # Check if this pair matches any expected pair
            for expected_pair in expected_pairs:
                # Fuzzy match: check if key parts are present
                provided_lower = provided_pair.lower()
                expected_lower = expected_pair.lower()
                
                # Extract analysis name (before ":")
                provided_analysis = provided_lower.split(':')[0].strip()
                expected_analysis = expected_lower.split(':')[0].strip()
                
                # If analysis names match
                if provided_analysis in expected_analysis or expected_analysis in provided_analysis:
                    # Check if results also match (after ":")
                    if ':' in provided_lower and ':' in expected_lower:
                        provided_result = provided_lower.split(':', 1)[1].strip()
                        expected_result = expected_lower.split(':', 1)[1].strip()
                        
                        # Fuzzy match on results
                        if provided_result in expected_result or expected_result in provided_result:
                            matches += 1
                            break
                    else:
                        # Just analysis name matches
                        matches += 0.5
                        break
        
        # Calculate score
        if total_provided == 0:
            return 0.0
        
        score = (matches / total_provided) * 100
        return min(100.0, score)
    
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
        # Weights
        SYMPTOM_WEIGHT = 0.60  # 60% - Most important
        AGE_WEIGHT = 0.15      # 15%
        SEX_WEIGHT = 0.10      # 10%
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
