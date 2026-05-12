# Machine Learning Module

## 📚 Vue d'ensemble

Ce module implémente un système de **Machine Learning** pour améliorer la précision du diagnostic médical.

## 🎯 Approche Hybride

Le système combine deux approches :

1. **Fuzzy Matching** (RapidFuzz) - 30%
   - Matching textuel des symptômes
   - Rapide et explicable
   - Fonctionne sans entraînement

2. **Machine Learning** (Random Forest) - 70%
   - Apprentissage des patterns
   - Meilleure généralisation
   - Amélioration continue

## 📦 Fichiers

### `train_model.py`
Script d'entraînement du modèle ML
- Charge le dataset (1000 maladies)
- Génère des cas synthétiques (augmentation de données)
- Entraîne un Random Forest avec TF-IDF
- Sauvegarde le modèle entraîné

### `predictor.py`
Service de prédiction ML
- Charge le modèle entraîné
- Fait des prédictions sur de nouveaux symptômes
- Retourne les probabilités pour chaque maladie

### `models/`
Dossier contenant les modèles entraînés
- `random_forest.pkl` - Modèle Random Forest
- `tfidf_vectorizer.pkl` - Vectoriseur TF-IDF
- `label_encoder.pkl` - Encodeur de labels
- `training_metrics.json` - Métriques d'entraînement

## 🚀 Utilisation

### 1. Entraîner le modèle

```bash
cd backend-fastapi
python train_ml_model.py
```

Cela va :
- Charger le dataset
- Générer 10,000+ exemples d'entraînement
- Entraîner le modèle Random Forest
- Sauvegarder le modèle dans `models/`
- Afficher les métriques de performance

### 2. Utiliser le modèle

Le modèle est automatiquement chargé au démarrage du serveur FastAPI.

```python
from app.ml.predictor import get_ml_predictor

predictor = get_ml_predictor()

# Faire une prédiction
results = predictor.predict(
    symptoms=["fièvre", "toux", "fatigue"],
    top_n=10
)

# Résultats
for result in results:
    print(f"{result['disease_name']}: {result['probability']:.2%}")
```

### 3. Service hybride

Le service hybride combine automatiquement fuzzy matching et ML :

```python
from app.services.hybrid_diagnostic_service import get_hybrid_diagnostic_service

service = get_hybrid_diagnostic_service()

# Diagnostic hybride
response = service.perform_diagnostic(
    request=diagnostic_request,
    use_ml=True  # Active le ML
)
```

## 📊 Métriques attendues

Après entraînement, vous devriez obtenir :

- **Accuracy** : ~60-70%
- **Top-3 Accuracy** : ~85-90%
- **Top-5 Accuracy** : ~95%+
- **Temps de prédiction** : < 100ms

## 🔧 Configuration

### Paramètres du modèle

Dans `train_model.py` :

```python
# TF-IDF
max_features=500      # Nombre max de features
ngram_range=(1, 2)    # Unigrammes et bigrammes
min_df=2              # Fréquence minimale
max_df=0.8            # Fréquence maximale

# Random Forest
n_estimators=200      # Nombre d'arbres
max_depth=30          # Profondeur max
min_samples_split=5   # Échantillons min pour split
```

### Poids hybrides

Dans `hybrid_diagnostic_service.py` :

```python
ML_WEIGHT = 0.70      # 70% ML
FUZZY_WEIGHT = 0.30   # 30% Fuzzy
```

## 🎓 Algorithme

### Pipeline d'entraînement

```
1. Charger dataset (1000 maladies)
   ↓
2. Générer cas synthétiques (10 par maladie)
   ↓
3. Vectoriser avec TF-IDF (symptômes → vecteurs)
   ↓
4. Entraîner Random Forest
   ↓
5. Valider avec cross-validation
   ↓
6. Sauvegarder modèle + métriques
```

### Pipeline de prédiction

```
1. Recevoir symptômes patient
   ↓
2. Vectoriser avec TF-IDF
   ↓
3. Prédire avec Random Forest
   ↓
4. Retourner top N maladies avec probabilités
```

### Scoring hybride

```
Score Final = (Score_ML × 0.70) + (Score_Fuzzy × 0.30)
```

## 📈 Amélioration continue

### Phase 1 : Actuelle ✅
- Random Forest + TF-IDF
- Données synthétiques
- Scoring hybride

### Phase 2 : Futur 🚀
- Word embeddings (CamemBERT)
- Neural networks
- Données réelles de patients
- Feedback loop médecins

## ⚠️ Important

- Le modèle doit être **entraîné avant utilisation**
- Sans modèle, le système utilise **uniquement fuzzy matching**
- Le modèle est **sauvegardé localement** (pas dans git)
- **Validation médicale** toujours requise

## 🔍 Debugging

### Vérifier si le modèle est chargé

```python
from app.ml.predictor import get_ml_predictor

predictor = get_ml_predictor()
print(f"ML disponible: {predictor.is_loaded}")

if predictor.is_loaded:
    info = predictor.get_model_info()
    print(f"Maladies: {info['n_diseases']}")
    print(f"Accuracy: {info['accuracy']:.2%}")
```

### Logs

Le module log automatiquement :
- Chargement du modèle
- Prédictions ML
- Erreurs éventuelles

Vérifiez les logs du serveur FastAPI.

## 📚 Ressources

- **scikit-learn** : https://scikit-learn.org/
- **Random Forest** : https://scikit-learn.org/stable/modules/ensemble.html#forest
- **TF-IDF** : https://scikit-learn.org/stable/modules/feature_extraction.html#tfidf

## 🤝 Contribution

Pour améliorer le modèle :

1. Ajuster les hyperparamètres dans `train_model.py`
2. Augmenter `cases_per_disease` pour plus de données
3. Tester différents algorithmes (XGBoost, Neural Networks)
4. Collecter des données réelles de patients
