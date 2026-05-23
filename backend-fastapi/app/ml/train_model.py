"""
ML Model Training — Random Forest sur les maladies racines (106 classes).

Améliorations vs version précédente :
- Entraîne sur la maladie RACINE (106 classes) et non les variantes (601 classes)
  → chaque classe passe de ~25 à ~140 exemples d'entraînement
- Génération d'âge uniforme entre Age_Min et Age_Max (plus de biais Age_Typique)
- Ajout de features d'âge normalisé + tranche d'âge (enfant/adulte/senior)
- Hyperparamètres Random Forest adaptés à 106 classes (200 arbres, min_leaf=2)
- 30 cas synthétiques par ligne dataset (au lieu de 15)
"""
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import accuracy_score
import joblib
import logging
from pathlib import Path
from typing import Tuple, Dict, List
import json
from scipy.sparse import hstack, csr_matrix

logger = logging.getLogger(__name__)

DATASET_PATH = Path(__file__).parent.parent / 'datasets' / '1000_Maladies_Complet_Age_Sexe.csv'


def _extract_root(name: str) -> str:
    """Extrait la maladie racine en supprimant la variante entre parenthèses."""
    return name.split('(')[0].strip()


class DiseaseMLModel:
    """Random Forest entraîné sur les maladies racines (106 classes)."""

    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            max_features=500,
            ngram_range=(1, 2),   # Bigrams pour capturer "douleur thoracique", "fièvre persistante"
            min_df=2,
            max_df=0.90,
            sublinear_tf=True,
            norm='l2',
            analyzer='word',
        )
        self.scaler = StandardScaler()
        self.classifier = RandomForestClassifier(
            n_estimators=200,        # 4× plus qu'avant — nécessaire pour 106 classes
            max_depth=25,            # Arbres plus profonds car moins de classes
            min_samples_split=5,
            min_samples_leaf=2,      # 2 au lieu de 5 — données plus nombreuses par classe
            max_features='sqrt',
            bootstrap=True,
            oob_score=True,
            random_state=42,
            n_jobs=-1,
            class_weight='balanced', # Compense les classes sous-représentées
        )
        self.label_encoder = LabelEncoder()
        self.model_dir = Path(__file__).parent / 'models'
        self.model_dir.mkdir(exist_ok=True)

    # ── Chargement du dataset ──────────────────────────────────────────────────

    def load_dataset(self, csv_path: str) -> pd.DataFrame:
        df = pd.read_csv(csv_path, encoding='utf-8-sig', sep=None, engine='python')

        # Colonne racine (sans variante)
        df['Maladie_Racine'] = df['Maladie'].apply(_extract_root)

        # Texte complet = tous les symptômes + analyses + résultats
        sym_cols = [c for c in df.columns if 'ympt' in c]
        df['symptomes_text'] = df[sym_cols].fillna('').agg(' '.join, axis=1).str.lower().str.strip()
        df['analyses_text'] = df['Analyses_biologiques_et_examens'].fillna('').str.lower()
        df['resultats_text'] = df['Résultats_attendus'].fillna('').str.lower()
        df['full_text'] = df['symptomes_text'] + ' ' + df['analyses_text'] + ' ' + df['resultats_text']

        n_roots = df['Maladie_Racine'].nunique()
        n_variants = df['Maladie'].nunique()
        logger.info(f"Dataset chargé : {len(df)} lignes, {n_variants} variantes, {n_roots} racines")
        return df

    # ── Génération de cas synthétiques ────────────────────────────────────────

    def generate_synthetic_cases(
        self,
        df: pd.DataFrame,
        cases_per_row: int = 30,
    ) -> Tuple[List[str], List[List[float]], List[str]]:
        """
        Génère cases_per_row exemples par ligne du dataset.
        Target = Maladie_Racine (106 classes).
        Features = texte TF-IDF + [age_scaled, age_group_0..3, is_child, is_senior, sex_M]
        """
        X_texts: List[str] = []
        X_nums: List[List[float]] = []
        y_labels: List[str] = []

        sym_cols = [c for c in df.columns if 'ympt' in c]

        for _, row in df.iterrows():
            symptoms = [
                str(row[c]).lower().strip()
                for c in sym_cols
                if pd.notna(row[c]) and str(row[c]).strip()
            ]
            if len(symptoms) < 2:
                continue

            analyses = str(row['Analyses_biologiques_et_examens']).lower() if pd.notna(row['Analyses_biologiques_et_examens']) else ''
            resultats = str(row['Résultats_attendus']).lower() if pd.notna(row['Résultats_attendus']) else ''

            age_min = int(row['Age_Min']) if pd.notna(row['Age_Min']) else 0
            age_max = int(row['Age_Max']) if pd.notna(row['Age_Max']) else 100
            age_typ = int(row['Age_Typique']) if pd.notna(row['Age_Typique']) else (age_min + age_max) // 2
            sex_pred = row['Sexe_Predominant']
            racine = row['Maladie_Racine']

            for i in range(cases_per_row):
                # ── Sélection des symptômes ────────────────────────────────
                # 50% : symptômes précoces (indices bas = plus caractéristiques)
                # 50% : sélection pondérée par rang
                if i < cases_per_row // 2:
                    n = np.random.randint(3, min(len(symptoms) + 1, 8))
                    selected = np.random.choice(symptoms, size=n, replace=False).tolist()
                else:
                    weights = np.array([1.0 / (j + 1) for j in range(len(symptoms))])
                    weights /= weights.sum()
                    n = np.random.randint(3, min(len(symptoms) + 1, 8))
                    selected = np.random.choice(symptoms, size=n, replace=False, p=weights).tolist()

                text = ' '.join(selected)
                if analyses:
                    text += ' ' + analyses
                if resultats:
                    text += ' ' + resultats

                # ── Génération de l'âge ────────────────────────────────────
                # Mix uniforme (60%) + centré sur Age_Typique (40%)
                # Élimine le biais Age_Typique 45-81 pour les jeunes patients
                if np.random.random() < 0.6:
                    age = int(np.random.uniform(age_min, age_max + 1))
                else:
                    std = max((age_max - age_min) / 4, 1)
                    age = int(np.clip(np.random.normal(age_typ, std), age_min, age_max))

                # ── Features numériques enrichies ──────────────────────────
                age_norm = (age - age_min) / max(age_max - age_min, 1)  # 0..1 dans la plage

                # Tranche d'âge (one-hot style)
                is_child  = 1 if age < 18 else 0
                is_young  = 1 if 18 <= age < 40 else 0
                is_middle = 1 if 40 <= age < 65 else 0
                is_senior = 1 if age >= 65 else 0

                # Sexe
                if sex_pred == 'Both':
                    sex = np.random.choice(['M', 'F'])
                elif sex_pred in ('M', 'F'):
                    sex = sex_pred if np.random.random() < 0.8 else ('F' if sex_pred == 'M' else 'M')
                else:
                    sex = np.random.choice(['M', 'F'])
                sex_enc = 0 if sex == 'M' else 1

                nums = [age_norm, is_child, is_young, is_middle, is_senior, sex_enc]

                X_texts.append(text)
                X_nums.append(nums)
                y_labels.append(racine)

        logger.info(f"Cas générés : {len(X_texts)} pour {df['Maladie_Racine'].nunique()} racines")
        return X_texts, X_nums, y_labels

    # ── Entraînement ──────────────────────────────────────────────────────────

    def train(self, csv_path: str) -> Dict:
        df = self.load_dataset(csv_path)
        X_texts, X_nums, y_labels = self.generate_synthetic_cases(df, cases_per_row=30)

        # Encodage des labels (racines)
        y_encoded = self.label_encoder.fit_transform(y_labels)
        n_classes = len(self.label_encoder.classes_)
        logger.info(f"Classes cibles : {n_classes} racines")

        # TF-IDF sur les textes de symptômes
        logger.info("Vectorisation TF-IDF (symptoms + analyses)...")
        X_tfidf = self.vectorizer.fit_transform(X_texts)

        # Normalisation des features numériques
        X_num_arr = np.array(X_nums)
        # Fit scaler sur les 2 premières colonnes quantitatives (age_norm + sexe)
        # Les colonnes binaires (tranches) n'ont pas besoin de scaling
        self.scaler.fit(X_num_arr[:, :1])  # Uniquement age_norm
        X_num_arr[:, 0] = self.scaler.transform(X_num_arr[:, :1]).flatten()

        X_combined = hstack([X_tfidf, csr_matrix(X_num_arr)])
        logger.info(f"Features totales : {X_combined.shape[1]} "
                    f"(TF-IDF: {X_tfidf.shape[1]}, numériques: {X_num_arr.shape[1]})")

        # Split stratifié
        X_train, X_test, y_train, y_test = train_test_split(
            X_combined, y_encoded,
            test_size=0.2,
            random_state=42,
            stratify=y_encoded,
        )
        logger.info(f"Train : {X_train.shape[0]} | Test : {X_test.shape[0]}")

        # Entraînement
        logger.info("Entraînement du Random Forest...")
        self.classifier.fit(X_train, y_train)

        oob = getattr(self.classifier, 'oob_score_', None)
        if oob:
            logger.info(f"OOB score : {oob:.2%}")

        # Évaluation
        y_pred = self.classifier.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)

        y_proba = self.classifier.predict_proba(X_test)
        top3 = np.mean([y_test[i] in np.argsort(y_proba[i])[-3:] for i in range(len(y_test))])
        top5 = np.mean([y_test[i] in np.argsort(y_proba[i])[-5:] for i in range(len(y_test))])

        # Cross-validation (5-fold)
        logger.info("Cross-validation 5-fold...")
        cv = cross_val_score(self.classifier, X_train, y_train, cv=5, scoring='accuracy', n_jobs=-1)

        metrics = {
            'accuracy': float(accuracy),
            'top3_accuracy': float(top3),
            'top5_accuracy': float(top5),
            'oob_score': float(oob) if oob else None,
            'cv_mean': float(cv.mean()),
            'cv_std': float(cv.std()),
            'n_root_classes': n_classes,
            'n_training_samples': len(X_texts),
            'n_tfidf_features': int(X_tfidf.shape[1]),
            'n_numeric_features': X_num_arr.shape[1],
            'training_mode': 'root_diseases',
        }

        logger.info(f"Accuracy     : {accuracy:.2%}")
        logger.info(f"Top-3        : {top3:.2%}")
        logger.info(f"Top-5        : {top5:.2%}")
        logger.info(f"CV           : {cv.mean():.2%} ± {cv.std():.2%}")

        return metrics

    # ── Sauvegarde / chargement ────────────────────────────────────────────────

    def save_model(self):
        joblib.dump(self.classifier,    self.model_dir / 'random_forest.pkl')
        joblib.dump(self.vectorizer,    self.model_dir / 'tfidf_vectorizer.pkl')
        joblib.dump(self.label_encoder, self.model_dir / 'label_encoder.pkl')
        joblib.dump(self.scaler,        self.model_dir / 'age_scaler.pkl')
        logger.info(f"Modèle sauvegardé dans {self.model_dir}")

    def load_model(self):
        self.classifier    = joblib.load(self.model_dir / 'random_forest.pkl')
        self.vectorizer    = joblib.load(self.model_dir / 'tfidf_vectorizer.pkl')
        self.label_encoder = joblib.load(self.model_dir / 'label_encoder.pkl')
        self.scaler        = joblib.load(self.model_dir / 'age_scaler.pkl')
        logger.info("Modèle chargé")


# ── Point d'entrée ─────────────────────────────────────────────────────────────

def train_and_save_model(csv_path: str) -> Dict:
    model = DiseaseMLModel()
    metrics = model.train(csv_path)
    model.save_model()

    model_dir = Path(__file__).parent / 'models'
    with open(model_dir / 'training_metrics.json', 'w', encoding='utf-8') as f:
        json.dump(metrics, f, indent=2, ensure_ascii=False)

    return metrics


if __name__ == '__main__':
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s %(levelname)s %(message)s'
    )
    csv = str(DATASET_PATH)
    metrics = train_and_save_model(csv)

    print('\n' + '='*55)
    print('  ENTRAÎNEMENT TERMINÉ')
    print('='*55)
    print(f"  Accuracy        : {metrics['accuracy']:.2%}")
    print(f"  Top-3 Accuracy  : {metrics['top3_accuracy']:.2%}")
    print(f"  Top-5 Accuracy  : {metrics['top5_accuracy']:.2%}")
    print(f"  CV              : {metrics['cv_mean']:.2%} ± {metrics['cv_std']:.2%}")
    print(f"  Classes cibles  : {metrics['n_root_classes']} racines")
    print(f"  Échantillons    : {metrics['n_training_samples']}")
    print('='*55)
