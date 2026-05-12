"""
Recommendation service - Recommend additional medical examinations
"""
from typing import List, Dict, Set
import logging

logger = logging.getLogger(__name__)


class RecommendationService:
    """Service for recommending medical examinations"""
    
    # Essential basic examinations
    BASIC_EXAMS = [
        "NFS (Numération Formule Sanguine)",
        "CRP (Protéine C-Réactive)",
        "VS (Vitesse de Sédimentation)"
    ]
    
    def recommend_examinations(
        self,
        top_diseases: List[Dict],
        max_exams: int = 10
    ) -> List[str]:
        """
        Recommend examinations based on top matching diseases
        
        Args:
            top_diseases: List of top matching diseases
            max_exams: Maximum number of examinations to recommend
            
        Returns:
            List of recommended examinations
        """
        if not top_diseases:
            return self.BASIC_EXAMS
        
        # Collect all examinations from top diseases
        exam_frequency: Dict[str, int] = {}
        exam_scores: Dict[str, float] = {}
        
        for disease in top_diseases[:5]:  # Consider top 5 diseases
            analyses = disease.get('analyses', [])
            disease_score = disease.get('score', 0)
            
            for analysis in analyses:
                analysis_clean = analysis.strip()
                if analysis_clean:
                    # Count frequency
                    exam_frequency[analysis_clean] = exam_frequency.get(analysis_clean, 0) + 1
                    # Accumulate weighted score
                    exam_scores[analysis_clean] = exam_scores.get(analysis_clean, 0) + disease_score
        
        # Sort by frequency and score
        sorted_exams = sorted(
            exam_frequency.keys(),
            key=lambda x: (exam_frequency[x], exam_scores[x]),
            reverse=True
        )
        
        # Prioritize basic exams
        recommended = []
        
        # Add basic exams first if they appear in recommendations
        for basic_exam in self.BASIC_EXAMS:
            for exam in sorted_exams:
                if any(keyword in exam.lower() for keyword in basic_exam.lower().split()):
                    if exam not in recommended:
                        recommended.append(exam)
                        break
        
        # Add other high-priority exams
        for exam in sorted_exams:
            if exam not in recommended:
                recommended.append(exam)
            
            if len(recommended) >= max_exams:
                break
        
        return recommended[:max_exams]
    
    def prioritize_examinations(
        self,
        examinations: List[str],
        urgency_level: str
    ) -> Dict[str, List[str]]:
        """
        Prioritize examinations by urgency
        
        Args:
            examinations: List of examinations
            urgency_level: Urgency level
            
        Returns:
            Dictionary with 'urgent', 'important', 'complementary' lists
        """
        urgent = []
        important = []
        complementary = []
        
        # Keywords for urgent examinations
        urgent_keywords = [
            'troponine', 'ecg', 'scanner', 'ponction lombaire',
            'gaz du sang', 'lactate', 'hemoculture', 'tdr'
        ]
        
        # Keywords for important examinations
        important_keywords = [
            'nfs', 'crp', 'glycemie', 'creatinine', 'bilan hepatique',
            'ionogramme', 'radio', 'echographie'
        ]
        
        for exam in examinations:
            exam_lower = exam.lower()
            
            # Check if urgent
            if any(keyword in exam_lower for keyword in urgent_keywords):
                urgent.append(exam)
            # Check if important
            elif any(keyword in exam_lower for keyword in important_keywords):
                important.append(exam)
            # Otherwise complementary
            else:
                complementary.append(exam)
        
        # Adjust based on urgency level
        if urgency_level in ['critique', 'élevée']:
            # Move important to urgent
            urgent.extend(important[:3])
            important = important[3:]
        
        return {
            'urgent': urgent,
            'important': important,
            'complementary': complementary
        }
    
    def get_examination_explanation(self, examination: str) -> str:
        """
        Get a brief explanation of why an examination is recommended
        
        Args:
            examination: Examination name
            
        Returns:
            Brief explanation
        """
        explanations = {
            'nfs': 'Évaluer les cellules sanguines (anémie, infection, inflammation)',
            'crp': 'Mesurer l\'inflammation',
            'glycemie': 'Vérifier le taux de sucre dans le sang',
            'creatinine': 'Évaluer la fonction rénale',
            'troponine': 'Détecter une atteinte cardiaque',
            'ecg': 'Analyser l\'activité électrique du cœur',
            'radio thorax': 'Visualiser les poumons et le cœur',
            'echographie': 'Examiner les organes internes',
            'scanner': 'Imagerie détaillée des organes',
            'hemoculture': 'Rechercher une infection dans le sang',
            'tdr': 'Test de diagnostic rapide',
            'ponction lombaire': 'Analyser le liquide céphalo-rachidien'
        }
        
        exam_lower = examination.lower()
        
        for key, explanation in explanations.items():
            if key in exam_lower:
                return explanation
        
        return 'Examen complémentaire recommandé pour le diagnostic'
    
    def filter_duplicate_examinations(self, examinations: List[str]) -> List[str]:
        """
        Remove duplicate or very similar examinations
        
        Args:
            examinations: List of examinations
            
        Returns:
            Filtered list without duplicates
        """
        seen: Set[str] = set()
        filtered = []
        
        for exam in examinations:
            # Normalize for comparison
            exam_normalized = exam.lower().strip()
            
            # Check if similar exam already added
            is_duplicate = False
            for seen_exam in seen:
                # Simple similarity check
                if exam_normalized in seen_exam or seen_exam in exam_normalized:
                    is_duplicate = True
                    break
            
            if not is_duplicate:
                filtered.append(exam)
                seen.add(exam_normalized)
        
        return filtered


# Global recommendation service instance
recommendation_service = RecommendationService()


def get_recommendation_service() -> RecommendationService:
    """Get the global recommendation service instance"""
    return recommendation_service
