# 🏥 Backend FastAPI - Diagnostic Médical

## Description
API REST intelligente développée avec FastAPI pour l'aide au diagnostic médical basée sur l'analyse de 1000 maladies.

## 🎯 Fonctionnalités

### ✅ Diagnostic Intelligent Hybride (IA + Algorithmes)
- **Machine Learning** : Random Forest entraîné sur 1000 maladies
- **Fuzzy Matching** : Correspondance textuelle avancée (RapidFuzz)
- **Scoring Hybride** : Combine ML (70%) + Fuzzy (30%)
- Analyse des symptômes du patient
- Filtrage par âge et sexe
- Calcul de scores de probabilité (0-100)
- Détection des niveaux d'urgence (critique, élevée, modérée, faible)

### ✅ Recommandations
- Examens complémentaires suggérés
- Priorisation par urgence
- Analyses biologiques recommandées
- Résultats attendus pour chaque examen

### ✅ Base de Données Médicale
- 1000 maladies répertoriées
- 9 symptômes par maladie
- Analyses biologiques détaillées
- Métadonnées : âge min/max/typique, sexe prédominant

## 🛠️ Technologies

- **FastAPI** - Framework web moderne
- **Pandas & NumPy** - Traitement des données
- **RapidFuzz** - Matching textuel avancé
- **scikit-learn** - Machine Learning
- **Pydantic** - Validation des données
- **Uvicorn** - Serveur ASGI

## 📦 Installation

### 1. Créer un environnement virtuel

```bash
cd backend-fastapi
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### 2. Installer les dépendances

```bash
pip install -r requirements.txt
```

### 3. Configuration

Copier `.env.example` vers `.env` et configurer :

```bash
cp .env.example .env
```

Modifier les variables dans `.env` :
```env
APP_NAME=Medical Diagnostic API
DEBUG=True
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://user:password@localhost:5432/medical_diagnostic
```

## 🚀 Lancement

### Étape 1 : Entraîner le modèle ML (Optionnel mais recommandé)

```bash
# Entraîner le modèle Machine Learning
python train_ml_model.py
```

Cela va :
- Charger le dataset de 1000 maladies
- Générer 10,000+ cas d'entraînement synthétiques
- Entraîner un Random Forest avec TF-IDF
- Sauvegarder le modèle dans `app/ml/models/`
- Afficher les métriques (Accuracy, Top-3, Top-5)

**Note** : Sans modèle ML, l'API fonctionne quand même avec le fuzzy matching seul.

### Étape 2 : Lancer le serveur

#### Méthode 1 : Script de lancement
```bash
python run.py
```

#### Méthode 2 : Uvicorn direct
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Méthode 3 : Depuis le module
```bash
python -m app.main
```

Le serveur démarre sur : **http://localhost:8000**

## 📚 Documentation API

Une fois l'API lancée, accéder à :

- **Swagger UI** : http://localhost:8000/docs
- **ReDoc** : http://localhost:8000/redoc
- **OpenAPI JSON** : http://localhost:8000/openapi.json

## 🔌 Endpoints Principaux

### Diagnostic

```http
POST /api/v1/diagnostic/
Content-Type: application/json

{
  "age": 28,
  "sexe": "F",
  "symptomes": ["fièvre", "fatigue", "maux de tête"],
  "analyses": {
    "hemoglobine": 9.2,
    "plaquettes": 95000
  }
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "10 diagnostic(s) possible(s) identifié(s)",
  "diagnostics": [
    {
      "maladie": "Paludisme à P. falciparum",
      "score": 95.5,
      "urgence": "modérée",
      "compatibilite_age": true,
      "compatibilite_sexe": true,
      "examens_recommandes": ["TDR Paludisme", "NFS", "CRP"],
      "arguments": ["Fièvre élevée", "Thrombopénie", "Fatigue"]
    }
  ],
  "patient_info": {
    "age": 28,
    "sexe": "F"
  }
}
```

### Maladies

```http
GET /api/v1/maladies/?skip=0&limit=50
GET /api/v1/maladies/{id}
GET /api/v1/maladies/search/paludisme
GET /api/v1/maladies/filter/age/28
```

### Health Check

```http
GET /health
GET /api/v1/diagnostic/health
```

## 📁 Structure du Projet

```
backend-fastapi/
├── app/
│   ├── main.py                 # Application FastAPI principale
│   ├── config.py               # Configuration
│   ├── routes/                 # Routes API
│   │   ├── diagnostic.py       # Endpoints diagnostic
│   │   └── maladies.py         # Endpoints maladies
│   ├── services/               # Logique métier
│   │   ├── diagnostic_service.py          # Service diagnostic classique
│   │   ├── hybrid_diagnostic_service.py   # Service hybride ML + Fuzzy
│   │   ├── matching_service.py            # Fuzzy matching
│   │   ├── scoring_service.py             # Calcul des scores
│   │   ├── recommendation_service.py      # Recommandations
│   │   └── preprocessing_service.py       # Chargement dataset
│   ├── ml/                     # Machine Learning
│   │   ├── train_model.py      # Entraînement du modèle
│   │   ├── predictor.py        # Prédictions ML
│   │   ├── models/             # Modèles entraînés (*.pkl)
│   │   └── README.md           # Documentation ML
│   ├── models/                 # Modèles Pydantic
│   │   ├── request_models.py
│   │   └── response_models.py
│   ├── utils/                  # Utilitaires
│   │   ├── text_processing.py  # Nettoyage texte
│   │   └── similarity.py       # Calcul similarité
│   └── datasets/               # Dataset CSV
│       └── 1000_Maladies_Complet_Age_Sexe.csv
├── tests/                      # Tests
├── train_ml_model.py          # Script d'entraînement ML
├── requirements.txt            # Dépendances
├── .env.example               # Variables d'environnement
└── run.py                     # Script de lancement
```

## 🧪 Tests

```bash
# Installer pytest
pip install pytest pytest-asyncio

# Lancer les tests
pytest

# Avec couverture
pytest --cov=app tests/
```

## 🔧 Développement

### Ajouter une nouvelle route

1. Créer un fichier dans `app/routes/`
2. Définir le router FastAPI
3. Inclure dans `app/main.py`

### Ajouter un nouveau service

1. Créer un fichier dans `app/services/`
2. Implémenter la logique métier
3. Utiliser dans les routes

## 📊 Performance

- **Temps de réponse** : < 500ms pour un diagnostic complet
- **Dataset** : 1000 maladies chargées en mémoire
- **Matching** : RapidFuzz pour correspondance rapide
- **ML** : Random Forest avec TF-IDF (si entraîné)
- **Concurrence** : Support asynchrone avec FastAPI

### Métriques ML (après entraînement)

- **Accuracy** : ~60-70%
- **Top-3 Accuracy** : ~85-90% (la vraie maladie est dans le top 3)
- **Top-5 Accuracy** : ~95%+ (la vraie maladie est dans le top 5)
- **Temps de prédiction ML** : < 100ms

## 🤖 Machine Learning

### Approche Hybride

Le système utilise une **approche hybride** combinant :

1. **Fuzzy Matching** (30%) - RapidFuzz
   - Matching textuel des symptômes
   - Rapide et explicable
   - Fonctionne sans entraînement

2. **Machine Learning** (70%) - Random Forest
   - Apprentissage des patterns
   - Meilleure généralisation
   - Amélioration continue

### Entraîner le modèle

```bash
# Installer scikit-learn et joblib (déjà dans requirements.txt)
pip install scikit-learn joblib

# Entraîner le modèle
python train_ml_model.py
```

### Utiliser le modèle

Le modèle est automatiquement chargé au démarrage du serveur.

```python
# Le service hybride est utilisé automatiquement
from app.services.hybrid_diagnostic_service import get_hybrid_diagnostic_service

service = get_hybrid_diagnostic_service()

# Vérifier le statut du ML
status = service.get_model_status()
print(f"ML disponible: {status['ml_available']}")
```

### Fallback automatique

- **Avec modèle ML** : Scoring hybride (70% ML + 30% Fuzzy)
- **Sans modèle ML** : Fuzzy matching seul (100%)

Le système fonctionne dans les deux cas !

Pour plus de détails, voir [`app/ml/README.md`](app/ml/README.md)

## ⚠️ Avertissement Médical

Cette API est un **outil d'aide à la décision médicale** et ne remplace en aucun cas :
- Une consultation médicale
- Un diagnostic médical professionnel
- Un traitement médical

**Toujours consulter un professionnel de santé qualifié.**

## 📝 Licence

Projet académique - Mémoire universitaire

## 👨‍💻 Auteur

Développé avec FastAPI et ❤️
