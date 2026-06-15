"""
ML Predictor - Use trained model for predictions
Supports: Symptoms + Analyses + Results + Age + Sex
"""
import logging
from pathlib import Path
from typing import List, Dict, Optional
import joblib
import numpy as np
from scipy.sparse import hstack, csr_matrix

from app.services.symptom_normalizer_service import get_symptom_normalizer

logger = logging.getLogger(__name__)


class MLPredictor:
    """Predictor using trained ML model with all features"""
    
    def __init__(self):
        self.model_dir = Path(__file__).parent / 'models'
        self.classifier = None
        self.vectorizer = None
        self.label_encoder = None
        self.scaler = None
        self.is_loaded = False
    
    def load_model(self) -> bool:
        """
        Load trained model components
        
        Returns:
            True if model loaded successfully, False otherwise
        """
        try:
            logger.info(f"Loading ML model from {self.model_dir}")
            
            # Check if model files exist
            if not (self.model_dir / 'random_forest.pkl').exists():
                logger.warning("ML model not found. Run train_model.py first.")
                return False
            
            self.classifier = joblib.load(self.model_dir / 'random_forest.pkl')
            self.vectorizer = joblib.load(self.model_dir / 'tfidf_vectorizer.pkl')
            self.label_encoder = joblib.load(self.model_dir / 'label_encoder.pkl')
            
            # Try to load scaler (for new model with age/sex)
            scaler_path = self.model_dir / 'age_scaler.pkl'
            if scaler_path.exists():
                self.scaler = joblib.load(scaler_path)
                logger.info("Loaded model with age/sex features")
            else:
                self.scaler = None
                logger.info("Loaded model without age/sex features (old version)")
            
            self.is_loaded = True
            logger.info("ML model loaded successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error loading ML model: {e}")
            self.is_loaded = False
            return False
    
    def predict(
        self,
        symptoms: List[str],
        age: int = None,
        sex: str = None,
        top_n: int = 10,
        min_probability: float = 0.01
    ) -> List[Dict]:
        """
        Predict root diseases from symptoms + age + sex.
        Returns root names (e.g. "Pneumonie") not variants.
        """
        if not self.is_loaded:
            if not self.load_model():
                logger.warning("ML model not available, returning empty predictions")
                return []

        try:
            # Normalise symptoms to canonical dataset vocabulary before
            # TF-IDF vectorisation so the model receives the same terms it
            # was trained on, even when the clinician uses informal language.
            normalizer = get_symptom_normalizer()
            canonical_symptoms, _ = normalizer.normalize_list(symptoms)
            symptom_text = ' '.join([s.lower().strip() for s in canonical_symptoms if s])

            if not symptom_text:
                return []

            X_text = self.vectorizer.transform([symptom_text])

            if self.scaler is not None:
                if age is None:
                    age = 40
                if sex is None:
                    sex = 'M'

                # 6-feature vector matching train_model.py generate_synthetic_cases
                # age_norm: global 0-120 approximation (training used per-disease Age_Min/Max)
                age_norm_raw = np.clip(age / 120.0, 0.0, 1.0)
                age_norm_scaled = self.scaler.transform([[age_norm_raw]])[0][0]

                is_child  = 1 if age < 18 else 0
                is_young  = 1 if 18 <= age < 40 else 0
                is_middle = 1 if 40 <= age < 65 else 0
                is_senior = 1 if age >= 65 else 0
                sex_enc   = 0 if sex == 'M' else 1

                nums = np.array([[age_norm_scaled, is_child, is_young, is_middle, is_senior, sex_enc]])
                X = hstack([X_text, csr_matrix(nums)])
            else:
                X = X_text
            
            # Predict probabilities
            probabilities = self.classifier.predict_proba(X)[0]
            
            # Get top N predictions
            top_indices = np.argsort(probabilities)[-top_n:][::-1]
            
            results = []
            for idx in top_indices:
                probability = probabilities[idx]
                
                if probability >= min_probability:
                    disease_name = self.label_encoder.inverse_transform([idx])[0]
                    
                    results.append({
                        'disease_name': disease_name,
                        'probability': float(probability),
                        'ml_score': float(probability * 100)
                    })
            
            logger.info(f"ML prediction returned {len(results)} results")
            return results
            
        except Exception as e:
            logger.error(f"Error during ML prediction: {e}")
            return []
    
    def get_model_info(self) -> Optional[Dict]:
        """Get information about the loaded model"""
        if not self.is_loaded:
            return None
        
        try:
            import json
            metrics_file = self.model_dir / 'training_metrics.json'
            
            if metrics_file.exists():
                with open(metrics_file, 'r', encoding='utf-8') as f:
                    metrics = json.load(f)
                return metrics
            
            return {
                'n_diseases': len(self.label_encoder.classes_),
                'n_features': self.vectorizer.get_feature_names_out().shape[0]
            }
            
        except Exception as e:
            logger.error(f"Error getting model info: {e}")
            return None


# Global predictor instance
_ml_predictor = None


def get_ml_predictor() -> MLPredictor:
    """Get the global ML predictor instance"""
    global _ml_predictor
    
    if _ml_predictor is None:
        _ml_predictor = MLPredictor()
        _ml_predictor.load_model()
    
    return _ml_predictor
