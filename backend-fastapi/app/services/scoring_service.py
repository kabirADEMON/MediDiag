"""
Scoring service - Calculate final scores and urgency levels
"""
from typing import Dict, List
import logging
import re

from rapidfuzz import fuzz

logger = logging.getLogger(__name__)

# Strip parenthetical qualifiers: "NFS (hyperleucocytose)" → "nfs"
_STRIP_PARENS = re.compile(r'\s*\([^)]*\)')

# Synonym groups — any two terms in the same group are considered a match.
# Covers the gap between frontend display names and dataset abbreviations.
_SYNONYM_GROUPS: List[set] = [
    # NFS / complete blood count
    {"nfs", "nfp", "fns", "globules blancs", "leucocytes", "gb",
     "globules rouges", "gr", "hémoglobine", "hemoglobine", "hb",
     "hematocrite", "ht", "plaquettes", "formule sanguine",
     "numération formule sanguine", "numération", "cbc"},
    # CRP
    {"crp", "protéine c réactive", "proteine c reactive",
     "protéine c", "proteine c"},
    # ESR / VS
    {"vs", "vitesse de sédimentation", "vitesse sedimentation", "esr"},
    # Blood glucose / diabetes
    {"glycémie", "glycemie", "glucose", "sucre sanguin", "hba1c",
     "hémoglobine glyquée", "hemoglobine glyquee", "insuline", "insulinémie"},
    # Renal function
    {"créatinine", "creatinine", "bilan rénal", "bilan renal",
     "fonction rénale", "fonction renale", "urée", "uree", "ionogramme"},
    # Liver / transaminases
    {"transaminases", "alat", "asat", "tgp", "tgo", "sgpt", "sgot",
     "bilan hépatique", "bilan hepatique", "gamma gt", "gamma-gt",
     "ggt", "phosphatases alcalines", "pal"},
    # Bilirubin
    {"bilirubine", "bili", "bilirubine totale"},
    # Troponin
    {"troponine", "troponin", "troponine i", "troponine t"},
    # D-dimers
    {"d-dimères", "d-dimeres", "d dimères", "d dimeres",
     "ddimères", "ddimeres"},
    # Urine analysis
    {"ecbu", "analyse urine", "examen urine", "bau",
     "bandelette urinaire", "cytobactériologique urine"},
    # Blood culture
    {"hémoculture", "hemoculture", "culture sanguine"},
    # Procalcitonin
    {"procalcitonine", "pct", "procalcitonin"},
    # Pancreatic enzymes
    {"lipase", "amylase", "bilan pancréatique", "bilan pancreatique"},
    # Coagulation
    {"tp", "inr", "coagulation", "taux de prothrombine", "temps de quick"},
    # Thyroid
    {"tsh", "thyroïde", "thyroide", "t3", "t4"},
    # Iron / ferritin
    {"ferritine", "bilan martial", "fer sérique", "fer serique",
     "saturation transferrine"},
    # LDH
    {"ldh", "lactate déshydrogénase", "lactate dehydrogenase",
     "lacticodéhydrogénase", "lacticodehydrogenase"},
    # Uric acid
    {"acide urique", "uricémie", "uricemie"},
    # Fibrinogen
    {"fibrinogène", "fibrinogene", "fibrine"},
    # Prothrombin / INR (merged with coagulation above but explicit)
    {"tp", "inr"},
]

# Build reverse lookup: term → group index
_TERM_TO_GROUP: Dict[str, int] = {}
for _i, _grp in enumerate(_SYNONYM_GROUPS):
    for _term in _grp:
        _TERM_TO_GROUP[_term] = _i


def _norm_exp(name: str) -> str:
    """'NFS (hyperleucocytose)' → 'nfs'."""
    return _STRIP_PARENS.sub('', name).strip().lower()


def _analyses_match(provided_lower: str, expected_raw: str) -> bool:
    """True if the provided analysis name corresponds to the expected dataset name."""
    exp_norm = _norm_exp(expected_raw)
    exp_raw_low = expected_raw.lower()

    # 1. Direct fuzzy on normalized strings
    if fuzz.ratio(provided_lower, exp_norm) >= 72:
        return True
    if fuzz.partial_ratio(provided_lower, exp_norm) >= 82:
        return True

    # 2. Synonym group match
    p_grp = _TERM_TO_GROUP.get(provided_lower)
    e_grp = _TERM_TO_GROUP.get(exp_norm)
    if p_grp is not None and e_grp is not None and p_grp == e_grp:
        return True

    # 3. Any synonym of the provided name appears literally in the raw expected string
    # e.g. provided="leucocytes", synonym "nfs" → found in "nfs (hyperleucocytose)"
    if p_grp is not None:
        for term in _SYNONYM_GROUPS[p_grp]:
            if len(term) >= 3 and term in exp_raw_low:
                return True

    return False


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

            total_bonus = 0.0
            max_per_match_abnormal = 25.0   # abnormal + name match → strong confirmation
            max_per_match_normal   = 8.0    # normal  + name match → weak confirmation

            for provided_name in provided_analyses.keys():
                p_low = provided_name.lower()

                for exp_raw in expected_analyses:
                    if _analyses_match(p_low, exp_raw):
                        is_abnormal = p_low in anomaly_set
                        bonus = max_per_match_abnormal if is_abnormal else max_per_match_normal
                        total_bonus += bonus
                        logger.debug(
                            f"Analyses match: '{provided_name}' ≈ '{exp_raw}' "
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
