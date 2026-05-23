# Approche Machine Learning - Diagnostic Médical

## 📊 Vue d'ensemble

Notre système utilise une **approche hybride** combinant :
1. **Matching algorithmique** (Phase 1 - Actuelle)
2. **Machine Learning** (Phase 2 - Amélioration)

---

## Phase 1 : Matching Algorithmique Intelligent ✅

### Algorithme actuel
```
1. Filtrage par âge et sexe (réduction de l'espace de recherche)
2. Fuzzy matching des symptômes (RapidFuzz avec seuil 60%)
3. Scoring pondéré multi-critères
4. Détection d'urgence par mots-clés
5. Recommandations d'examens
```

### Avantages
- ✅ Rapide (< 1 seconde)
- ✅ Pas besoin d'entraînement
- ✅ Explicable (on sait pourquoi une maladie est suggérée)
- ✅ Fonctionne immédiatement avec le dataset

### Limites
- ⚠️ Dépend de la qualité du matching textuel
- ⚠️ Ne capture pas les patterns complexes
- ⚠️ Pas d'apprentissage des cas réels

---

## Phase 2 : Machine Learning (Amélioration) 🚀

### Modèles proposés

#### 1. **TF-IDF + Random Forest** (Recommandé pour démarrer)
```python
# Vectorisation des symptômes
TF-IDF → Vecteurs numériques

# Classification multi-classe
Random Forest → Probabilités pour chaque maladie

# Avantages
- Rapide à entraîner
- Bonne performance
- Interprétable (feature importance)
```

#### 2. **Word Embeddings + Neural Network**
```python
# Embeddings pré-entraînés (CamemBERT pour français)
Symptômes → Embeddings 768D

# Réseau de neurones
Dense layers → Softmax → Probabilités

# Avantages
- Capture le sens sémantique
- Meilleure généralisation
- Gère les synonymes
```

#### 3. **Ensemble Learning** (Meilleure précision)
```python
# Combine plusieurs modèles
- Random Forest
- Gradient Boosting
- Neural Network

# Vote pondéré → Prédiction finale

# Avantages
- Meilleure précision
- Plus robuste
- Réduit les faux positifs
```

---

## 🎯 Architecture Hybride Recommandée

```
┌─────────────────────────────────────────────────┐
│           REQUÊTE PATIENT                       │
│  (âge, sexe, symptômes)                        │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  ÉTAPE 1 : Filtrage Rapide                     │
│  - Filtrer par âge/sexe                        │
│  - Réduire de 1000 → ~200 maladies             │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  ÉTAPE 2 : Scoring Hybride                     │
│                                                 │
│  ┌──────────────────┐  ┌──────────────────┐   │
│  │ Fuzzy Matching   │  │  ML Model        │   │
│  │ (RapidFuzz)      │  │  (Random Forest) │   │
│  │ Score: 0-100     │  │  Proba: 0-1      │   │
│  └────────┬─────────┘  └────────┬─────────┘   │
│           │                      │              │
│           └──────────┬───────────┘              │
│                      ▼                          │
│           ┌──────────────────┐                 │
│           │  Score Combiné   │                 │
│           │  70% ML + 30% FM │                 │
│           └──────────────────┘                 │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  ÉTAPE 3 : Post-traitement                     │
│  - Détection d'urgence                         │
│  - Recommandations d'examens                   │
│  - Niveau de confiance                         │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│           RÉSULTATS FINAUX                      │
│  Top 3-5 maladies avec scores et urgence       │
└─────────────────────────────────────────────────┘
```

---

## 📦 Données d'entraînement

### Dataset actuel
- **1000 maladies** avec symptômes
- **9 symptômes** par maladie
- **Métadonnées** : âge, sexe, analyses, résultats

### Augmentation des données
```python
# Générer des cas synthétiques
- Combinaisons de symptômes
- Variations d'âge
- Cas atypiques
- Synonymes de symptômes

# Objectif : 10,000+ exemples d'entraînement
```

---

## 🔧 Implémentation

### Fichiers à créer
```
backend-fastapi/app/ml/
├── train_model.py          # Entraînement du modèle
├── predictor.py            # Prédictions ML
├── feature_engineering.py  # Extraction de features
├── model_evaluation.py     # Métriques et validation
└── models/
    ├── random_forest.pkl   # Modèle entraîné
    ├── tfidf_vectorizer.pkl
    └── label_encoder.pkl
```

### Pipeline d'entraînement
```python
1. Charger le dataset (1000 maladies)
2. Générer des cas synthétiques (augmentation)
3. Extraire les features (TF-IDF des symptômes)
4. Entraîner Random Forest
5. Valider (cross-validation)
6. Sauvegarder le modèle
7. Évaluer les métriques
```

---

## 📈 Métriques de performance

### Métriques à suivre
- **Accuracy** : % de prédictions correctes
- **Top-3 Accuracy** : La vraie maladie est dans le top 3
- **Precision/Recall** : Par niveau d'urgence
- **F1-Score** : Équilibre précision/rappel
- **Temps de réponse** : < 2 secondes

### Objectifs
- Top-1 Accuracy : **> 60%**
- Top-3 Accuracy : **> 85%**
- Top-5 Accuracy : **> 95%**
- Temps de réponse : **< 1 seconde**

---

## 🚀 Roadmap

### Phase 1 : Actuelle ✅
- [x] Fuzzy matching algorithmique
- [x] Filtrage âge/sexe
- [x] Scoring pondéré
- [x] Détection d'urgence

### Phase 2 : ML Basique (À faire)
- [ ] Entraîner Random Forest
- [ ] Intégrer les prédictions ML
- [ ] Scoring hybride (ML + Fuzzy)
- [ ] Évaluation des performances

### Phase 3 : ML Avancé (Futur)
- [ ] Word embeddings (CamemBERT)
- [ ] Neural network
- [ ] Ensemble learning
- [ ] Apprentissage continu

### Phase 4 : Production (Futur)
- [ ] A/B testing
- [ ] Monitoring des prédictions
- [ ] Feedback loop (médecins)
- [ ] Amélioration continue

---

## 💡 Recommandations

### Pour démarrer
1. **Utiliser l'approche actuelle** (fuzzy matching) - Elle fonctionne bien !
2. **Collecter des données réelles** - Cas de patients avec diagnostics confirmés
3. **Entraîner un modèle simple** - Random Forest avec TF-IDF
4. **Comparer les performances** - ML vs Fuzzy matching
5. **Approche hybride** - Combiner les deux pour meilleure précision

### Considérations importantes
- ⚠️ **Validation médicale** : Un médecin doit toujours valider
- ⚠️ **Responsabilité** : C'est un outil d'aide, pas de diagnostic final
- ⚠️ **Données sensibles** : Respecter RGPD et confidentialité
- ⚠️ **Biais** : Surveiller les biais dans les prédictions

---

## 📚 Ressources

### Librairies Python
- **scikit-learn** : Random Forest, TF-IDF
- **transformers** : CamemBERT (embeddings français)
- **xgboost** : Gradient Boosting
- **tensorflow/pytorch** : Neural networks

### Datasets médicaux
- **ICD-10** : Classification internationale des maladies
- **SNOMED CT** : Terminologie médicale
- **PubMed** : Articles médicaux pour enrichir les données

---

## ✅ Conclusion

**L'approche actuelle est déjà intelligente** grâce au fuzzy matching et au scoring multi-critères. 

**Le Machine Learning apportera** :
- Meilleure précision sur les cas complexes
- Apprentissage des patterns réels
- Amélioration continue avec les données

**Recommandation** : Commencer avec l'approche actuelle, puis ajouter le ML progressivement en mode hybride.
