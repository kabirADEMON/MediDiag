"""
Preprocessing service for loading and preparing the medical dataset
"""
import pandas as pd
from typing import List, Dict, Optional
import logging
from math import log
from pathlib import Path

from app.config import settings
from app.utils.text_processing import clean_symptom, parse_analyses_text

logger = logging.getLogger(__name__)


class DatasetLoader:
    """Load and preprocess the medical dataset"""
    
    def __init__(self):
        self.df: Optional[pd.DataFrame] = None
        self.dataset_path = Path(settings.DATASET_PATH)
        self._load_dataset()
    
    def _load_dataset(self):
        """Load the CSV dataset"""
        try:
            logger.info(f"Loading dataset from {self.dataset_path}")
            self.df = pd.read_csv(self.dataset_path, encoding='utf-8')
            logger.info(f"Dataset loaded successfully: {len(self.df)} diseases")
            self._preprocess_dataset()
        except Exception as e:
            logger.error(f"Error loading dataset: {e}")
            raise
    
    def _preprocess_dataset(self):
        """Preprocess the dataset for efficient matching"""
        if self.df is None:
            return
        
        # Fill NaN values
        self.df = self.df.fillna("")
        
        # Create a combined symptoms column (all 9 symptoms)
        symptom_cols = [f'Symptôme_{i}' for i in range(1, 10)]
        self.df['all_symptoms'] = self.df[symptom_cols].apply(
            lambda row: [s for s in row if s], axis=1
        )
        
        # Clean and normalize symptoms
        self.df['cleaned_symptoms'] = self.df['all_symptoms'].apply(
            lambda symptoms: [clean_symptom(s) for s in symptoms if s]
        )
        
        # Parse analyses
        self.df['analyses_list'] = self.df['Analyses_biologiques_et_examens'].apply(
            parse_analyses_text
        )
        
        # Parse expected results
        self.df['resultats_list'] = self.df['Résultats_attendus'].apply(
            parse_analyses_text
        )

        # Compute IDF weights for all symptoms
        self._compute_symptom_idf()

        logger.info("Dataset preprocessing completed")

    def _compute_symptom_idf(self):
        """
        Compute IDF (inverse document frequency) for each symptom.
        Symptoms appearing in many diseases get a low weight; rare symptoms get high weight.
        Formula: idf = log((N+1) / (df+1)) + 1
        """
        freq: Dict[str, int] = {}
        for symptoms_list in self.df['cleaned_symptoms']:
            seen: set = set()
            for s in symptoms_list:
                if s and s not in seen:
                    freq[s] = freq.get(s, 0) + 1
                    seen.add(s)

        n = len(self.df)
        self.symptom_idf: Dict[str, float] = {
            s: log((n + 1) / (count + 1)) + 1.0
            for s, count in freq.items()
        }
        logger.info(f"IDF computed for {len(self.symptom_idf)} unique symptoms")
    
    def get_symptom_idf(self, symptom: str) -> float:
        """
        Return the IDF weight for a symptom.
        Unknown symptoms are treated as maximally rare (high diagnostic value).
        """
        if not hasattr(self, 'symptom_idf'):
            return 1.0
        if symptom in self.symptom_idf:
            return self.symptom_idf[symptom]
        # Unknown symptom: treat as appearing in 1 disease (high IDF)
        n = len(self.df) if self.df is not None else 1000
        return log((n + 1) / 2) + 1.0

    def get_all_diseases(self) -> pd.DataFrame:
        """Get all diseases"""
        return self.df
    
    def filter_by_age(self, age: int) -> pd.DataFrame:
        """Filter diseases by patient age. age=0 means unknown — skip filter."""
        if self.df is None:
            return pd.DataFrame()
        if age <= 0:
            return self.df
        return self.df[
            (self.df['Age_Min'] <= age) & (self.df['Age_Max'] >= age)
        ]
    
    def filter_by_sex(self, df: pd.DataFrame, sex: str) -> pd.DataFrame:
        """Filter diseases by patient sex"""
        if df.empty:
            return df
        
        # Keep diseases that match sex or are for 'Both'
        return df[
            (df['Sexe_Predominant'] == 'Both') | 
            (df['Sexe_Predominant'] == sex)
        ]
    
    def filter_by_age_and_sex(self, age: int, sex: str) -> pd.DataFrame:
        """Filter diseases by both age and sex"""
        df_age = self.filter_by_age(age)
        df_filtered = self.filter_by_sex(df_age, sex)
        return df_filtered
    
    def get_disease_by_id(self, disease_id: int) -> Optional[Dict]:
        """Get a specific disease by ID"""
        if self.df is None:
            return None
        
        disease = self.df[self.df['N°'] == disease_id]
        if disease.empty:
            return None
        
        return disease.iloc[0].to_dict()
    
    def get_disease_by_name(self, name: str) -> Optional[Dict]:
        """Get a specific disease by name"""
        if self.df is None:
            return None
        
        disease = self.df[self.df['Maladie'].str.lower() == name.lower()]
        if disease.empty:
            return None
        
        return disease.iloc[0].to_dict()
    
    def search_diseases(self, query: str, limit: int = 10) -> List[Dict]:
        """Search diseases by name"""
        if self.df is None:
            return []
        
        query_lower = query.lower()
        matches = self.df[
            self.df['Maladie'].str.lower().str.contains(query_lower, na=False)
        ]
        
        return matches.head(limit).to_dict('records')
    
    def get_dataset_stats(self) -> Dict:
        """Get dataset statistics"""
        if self.df is None:
            return {}
        
        return {
            "total_diseases": len(self.df),
            "sex_distribution": self.df['Sexe_Predominant'].value_counts().to_dict(),
            "age_range": {
                "min": int(self.df['Age_Min'].min()),
                "max": int(self.df['Age_Max'].max())
            }
        }


# Global dataset loader instance
dataset_loader = DatasetLoader()


def get_dataset_loader() -> DatasetLoader:
    """Get the global dataset loader instance"""
    return dataset_loader
