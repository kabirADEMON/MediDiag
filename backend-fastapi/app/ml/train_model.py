"""
Machine Learning Model Training
Train a Random Forest classifier for disease prediction
Includes: Symptoms + Analyses + Results + Age + Sex
"""
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, accuracy_score
import joblib
import logging
from pathlib import Path
from typing import Tuple, Dict
import json
from scipy.sparse import hstack, csr_matrix

logger = logging.getLogger(__name__)


class DiseaseMLModel:
    """Machine Learning model for disease prediction with ALL features"""
    
    def __init__(self):
        # TF-IDF for text features (symptoms + analyses + results) - OPTIMIZED
        self.vectorizer = TfidfVectorizer(
            max_features=300,  # Reduced from 800 (smaller model)
            ngram_range=(1, 1),  # Only unigrams (no bigrams for speed)
            min_df=2,
            max_df=0.85,
            sublinear_tf=True,
            norm='l2'
        )
        
        # Scaler for numerical features (age)
        self.scaler = StandardScaler()
        
        # Random Forest classifier (optimized for size and speed)
        self.classifier = RandomForestClassifier(
            n_estimators=50,  # Reduced from 250 (5x smaller)
            max_depth=15,  # Reduced from 35 (smaller trees)
            min_samples_split=10,  # Increased from 3 (simpler trees)
            min_samples_leaf=5,  # Increased from 1 (simpler trees)
            max_features='sqrt',
            bootstrap=True,
            oob_score=True,
            random_state=42,
            n_jobs=-1,
            class_weight='balanced',
            warm_start=False
        )
        
        self.label_encoder = LabelEncoder()
        self.model_dir = Path(__file__).parent / 'models'
        self.model_dir.mkdir(exist_ok=True)
    
    def load_dataset(self, csv_path: str) -> pd.DataFrame:
        """Load and preprocess the disease dataset"""
        logger.info(f"Loading dataset from {csv_path}")
        df = pd.read_csv(csv_path, encoding='utf-8')
        
        # Combine all symptoms into one text field
        symptom_cols = [f'Symptôme_{i}' for i in range(1, 10)]
        df['all_symptoms_text'] = df[symptom_cols].fillna('').agg(' '.join, axis=1)
        
        # Add analyses and results to the text (important for ML!)
        df['analyses_text'] = df['Analyses_biologiques_et_examens'].fillna('')
        df['results_text'] = df['Résultats_attendus'].fillna('')
        
        # Combine symptoms + analyses + results for richer features
        df['full_text'] = (
            df['all_symptoms_text'] + ' ' + 
            df['analyses_text'] + ' ' + 
            df['results_text']
        )
        
        # Clean text
        df['all_symptoms_text'] = df['all_symptoms_text'].str.lower().str.strip()
        df['full_text'] = df['full_text'].str.lower().str.strip()
        
        logger.info(f"Loaded {len(df)} diseases with symptoms, analyses, and results")
        return df
    
    def generate_synthetic_cases(
        self,
        df: pd.DataFrame,
        cases_per_disease: int = 15
    ) -> Tuple[list, list, list, list]:
        """
        Generate synthetic training cases with ALL features:
        - Symptoms (text)
        - Analyses (text)
        - Results (text)
        - Age (numerical)
        - Sex (categorical: M/F)
        """
        logger.info(f"Generating {cases_per_disease} synthetic cases per disease")
        
        X_texts = []
        X_ages = []
        X_sexes = []
        y_labels = []
        
        for idx, row in df.iterrows():
            disease_name = row['Maladie']
            
            # Get symptoms
            symptom_cols = [f'Symptôme_{i}' for i in range(1, 10)]
            symptoms = [
                str(row[col]).lower().strip()
                for col in symptom_cols
                if pd.notna(row[col]) and str(row[col]).strip()
            ]
            
            if len(symptoms) < 2:
                continue
            
            # Get age range
            age_min = int(row['Age_Min']) if pd.notna(row['Age_Min']) else 0
            age_max = int(row['Age_Max']) if pd.notna(row['Age_Max']) else 100
            age_typical = int(row['Age_Typique']) if pd.notna(row['Age_Typique']) else (age_min + age_max) // 2
            
            # Get sex
            sex_predominant = row['Sexe_Predominant']
            
            # Get analyses and results
            analyses = str(row['Analyses_biologiques_et_examens']).lower() if pd.notna(row['Analyses_biologiques_et_examens']) else ''
            results = str(row['Résultats_attendus']).lower() if pd.notna(row['Résultats_attendus']) else ''
            
            # Generate variations
            for i in range(cases_per_disease):
                # Select symptoms (weighted selection)
                if i < cases_per_disease // 2:
                    n_symptoms = np.random.randint(3, min(len(symptoms) + 1, 8))
                    selected_symptoms = np.random.choice(symptoms, size=n_symptoms, replace=False)
                else:
                    weights = [1.0 / (i + 1) for i in range(len(symptoms))]
                    weights = np.array(weights) / sum(weights)
                    n_symptoms = np.random.randint(3, min(len(symptoms) + 1, 8))
                    selected_symptoms = np.random.choice(
                        symptoms, 
                        size=min(n_symptoms, len(symptoms)), 
                        replace=False, 
                        p=weights
                    )
                
                # Combine text: symptoms + analyses + results
                text_features = ' '.join(selected_symptoms)
                if analyses:
                    text_features += ' ' + analyses
                if results:
                    text_features += ' ' + results
                
                # Generate age (around typical age with variation)
                age_std = (age_max - age_min) / 4
                generated_age = int(np.random.normal(age_typical, age_std))
                generated_age = np.clip(generated_age, age_min, age_max)
                
                # Generate sex
                if sex_predominant == 'Both':
                    generated_sex = np.random.choice(['M', 'F'])
                elif sex_predominant in ['M', 'F']:
                    # 80% predominant sex, 20% other
                    if np.random.random() < 0.8:
                        generated_sex = sex_predominant
                    else:
                        generated_sex = 'F' if sex_predominant == 'M' else 'M'
                else:
                    generated_sex = np.random.choice(['M', 'F'])
                
                X_texts.append(text_features)
                X_ages.append(generated_age)
                X_sexes.append(generated_sex)
                y_labels.append(disease_name)
        
        logger.info(f"Generated {len(X_texts)} training cases with symptoms, analyses, results, age, and sex")
        return X_texts, X_ages, X_sexes, y_labels
    
    def train(self, csv_path: str) -> Dict:
        """
        Train the ML model with ALL features
        
        Returns:
            Dictionary with training metrics
        """
        logger.info("Starting model training with symptoms, analyses, results, age, and sex...")
        
        # Load dataset
        df = self.load_dataset(csv_path)
        
        # Generate synthetic training data - 15 cases per disease (good balance)
        X_texts, X_ages, X_sexes, y_labels = self.generate_synthetic_cases(df, cases_per_disease=15)
        
        # Encode labels
        y_encoded = self.label_encoder.fit_transform(y_labels)
        
        # Vectorize text features
        logger.info("Vectorizing text features (symptoms + analyses + results) with TF-IDF...")
        X_text_vectors = self.vectorizer.fit_transform(X_texts)
        
        # Encode sex (M=0, F=1)
        X_sex_encoded = np.array([0 if sex == 'M' else 1 for sex in X_sexes]).reshape(-1, 1)
        
        # Scale age
        X_age_scaled = self.scaler.fit_transform(np.array(X_ages).reshape(-1, 1))
        
        # Combine all features: text + age + sex
        logger.info("Combining text, age, and sex features...")
        X_combined = hstack([
            X_text_vectors,  # TF-IDF features (sparse)
            csr_matrix(X_age_scaled),  # Age (scaled)
            csr_matrix(X_sex_encoded)  # Sex (encoded)
        ])
        
        logger.info(f"Total features: {X_combined.shape[1]} (text: {X_text_vectors.shape[1]}, age: 1, sex: 1)")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X_combined, y_encoded,
            test_size=0.2,
            random_state=42,
            stratify=y_encoded
        )
        
        logger.info(f"Training set: {X_train.shape[0]} samples")
        logger.info(f"Test set: {X_test.shape[0]} samples")
        
        # Train model
        logger.info("Training Random Forest classifier...")
        self.classifier.fit(X_train, y_train)
        
        # Log OOB score if available
        if hasattr(self.classifier, 'oob_score_'):
            logger.info(f"Out-of-bag score: {self.classifier.oob_score_:.2%}")
        
        # Evaluate
        logger.info("Evaluating model...")
        y_pred = self.classifier.predict(X_test)
        
        accuracy = accuracy_score(y_test, y_pred)
        
        # Top-3 accuracy
        y_proba = self.classifier.predict_proba(X_test)
        top3_indices = np.argsort(y_proba, axis=1)[:, -3:]
        top3_accuracy = np.mean([
            y_test[i] in top3_indices[i]
            for i in range(len(y_test))
        ])
        
        # Top-5 accuracy
        top5_indices = np.argsort(y_proba, axis=1)[:, -5:]
        top5_accuracy = np.mean([
            y_test[i] in top5_indices[i]
            for i in range(len(y_test))
        ])
        
        # Cross-validation
        logger.info("Running cross-validation...")
        cv_scores = cross_val_score(
            self.classifier, X_train, y_train,
            cv=5, scoring='accuracy'
        )
        
        metrics = {
            'accuracy': float(accuracy),
            'top3_accuracy': float(top3_accuracy),
            'top5_accuracy': float(top5_accuracy),
            'cv_mean': float(cv_scores.mean()),
            'cv_std': float(cv_scores.std()),
            'oob_score': float(self.classifier.oob_score_) if hasattr(self.classifier, 'oob_score_') else None,
            'n_diseases': len(self.label_encoder.classes_),
            'n_training_samples': len(X_texts),
            'n_text_features': X_text_vectors.shape[1],
            'n_total_features': X_combined.shape[1],
            'includes_age': True,
            'includes_sex': True,
            'includes_analyses': True,
            'includes_results': True
        }
        
        logger.info(f"Training complete!")
        logger.info(f"Accuracy: {accuracy:.2%}")
        logger.info(f"Top-3 Accuracy: {top3_accuracy:.2%}")
        logger.info(f"Top-5 Accuracy: {top5_accuracy:.2%}")
        logger.info(f"CV Score: {cv_scores.mean():.2%} (+/- {cv_scores.std():.2%})")
        
        return metrics
    
    def save_model(self):
        """Save trained model and all components"""
        logger.info(f"Saving model to {self.model_dir}")
        
        joblib.dump(self.classifier, self.model_dir / 'random_forest.pkl')
        joblib.dump(self.vectorizer, self.model_dir / 'tfidf_vectorizer.pkl')
        joblib.dump(self.label_encoder, self.model_dir / 'label_encoder.pkl')
        joblib.dump(self.scaler, self.model_dir / 'age_scaler.pkl')  # Save age scaler
        
        logger.info("Model saved successfully")
    
    def load_model(self):
        """Load trained model and all components"""
        logger.info(f"Loading model from {self.model_dir}")
        
        self.classifier = joblib.load(self.model_dir / 'random_forest.pkl')
        self.vectorizer = joblib.load(self.model_dir / 'tfidf_vectorizer.pkl')
        self.label_encoder = joblib.load(self.model_dir / 'label_encoder.pkl')
        self.scaler = joblib.load(self.model_dir / 'age_scaler.pkl')  # Load age scaler
        
        logger.info("Model loaded successfully")
    
    def predict(self, symptoms: list, top_n: int = 10) -> list:
        """
        Predict diseases from symptoms
        
        Args:
            symptoms: List of symptom strings
            top_n: Number of top predictions to return
            
        Returns:
            List of (disease_name, probability) tuples
        """
        # Combine symptoms into text
        symptom_text = ' '.join([s.lower().strip() for s in symptoms])
        
        # Vectorize
        X = self.vectorizer.transform([symptom_text])
        
        # Predict probabilities
        probabilities = self.classifier.predict_proba(X)[0]
        
        # Get top N predictions
        top_indices = np.argsort(probabilities)[-top_n:][::-1]
        
        results = []
        for idx in top_indices:
            disease_name = self.label_encoder.inverse_transform([idx])[0]
            probability = probabilities[idx]
            
            if probability > 0.01:  # Only include if > 1% probability
                results.append({
                    'disease_name': disease_name,
                    'probability': float(probability),
                    'ml_score': float(probability * 100)
                })
        
        return results


def train_and_save_model(csv_path: str) -> Dict:
    """
    Train and save the ML model
    
    Args:
        csv_path: Path to the disease dataset CSV
        
    Returns:
        Training metrics
    """
    model = DiseaseMLModel()
    metrics = model.train(csv_path)
    model.save_model()
    
    # Save metrics
    model_dir = Path(__file__).parent / 'models'
    with open(model_dir / 'training_metrics.json', 'w', encoding='utf-8') as f:
        json.dump(metrics, f, indent=2, ensure_ascii=False)
    
    return metrics


if __name__ == '__main__':
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Train model
    csv_path = '../datasets/1000_Maladies_Complet_Age_Sexe.csv'
    metrics = train_and_save_model(csv_path)
    
    print("\n" + "="*50)
    print("TRAINING COMPLETE!")
    print("="*50)
    print(f"Accuracy: {metrics['accuracy']:.2%}")
    print(f"Top-3 Accuracy: {metrics['top3_accuracy']:.2%}")
    print(f"Top-5 Accuracy: {metrics['top5_accuracy']:.2%}")
    print(f"Number of diseases: {metrics['n_diseases']}")
    print(f"Training samples: {metrics['n_training_samples']}")
    print("="*50)
