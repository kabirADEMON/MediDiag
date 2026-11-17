# MediDiag — Système de Diagnostic Médical Assisté par IA

MediDiag est une plateforme d'aide au diagnostic médical qui combine l'analyse des symptômes cliniques, les résultats d'analyses biologiques et des techniques d'intelligence artificielle pour proposer des hypothèses diagnostiques et des examens complémentaires.

Le système repose sur une approche hybride associant le Fuzzy Matching et le Machine Learning.

## Documentation

| Document | Description |
|---|---|
| [Guide d'installation](INSTALL_GUIDE.md) | Installation étape par étape |
| [Démarrage rapide](QUICKSTART.md) | Configuration et lancement |
| [Installation complète](INSTALLATION.md) | Instructions détaillées |
| [Déploiement Docker](DOCKER.md) | Déploiement avec Docker |
| [Architecture](docs/ARCHITECTURE.md) | Architecture technique |
| [Approche Machine Learning](docs/ML_APPROACH.md) | Modèle et méthodologie |
| [Analyse du dataset](docs/DATASET_ANALYSIS.md) | Structure et analyse des données |
| [Documentation API](docs/API.md) | Endpoints REST |

## Fonctionnalités

### Diagnostic médical

- Analyse des symptômes cliniques.
- Prise en compte de l'âge et du sexe du patient.
- Intégration des résultats d'analyses biologiques.
- Proposition de diagnostics probables avec scores associés.
- Recommandation d'examens complémentaires.
- Évaluation des niveaux d'urgence.

### Intelligence artificielle

- Approche hybride combinant Fuzzy Matching et Machine Learning.
- Classification avec Random Forest.
- Vectorisation des symptômes avec TF-IDF.
- Prise en compte des caractéristiques du patient.
- Classement des diagnostics selon leurs scores.

### Gestion médicale

- Enregistrement des patients.
- Saisie des symptômes et des résultats biologiques.
- Consultation des résultats de diagnostic.
- Interface de suivi des consultations.
- Visualisation des statistiques.

### API et interface utilisateur

- API REST développée avec FastAPI.
- Documentation interactive avec Swagger UI.
- Validation des données avec Pydantic.
- Interface utilisateur React.
- Communication entre le frontend et le backend.

## Technologies utilisées

| Domaine | Technologies |
|---|---|
| Backend | Python, FastAPI, Uvicorn |
| Frontend | React 18, Vite |
| Machine Learning | Scikit-learn, Random Forest |
| Traitement de texte | TF-IDF, RapidFuzz |
| Manipulation des données | Pandas |
| Validation | Pydantic |
| Communication API | Axios, REST |
| Base de données | PostgreSQL |

## Installation

### Prérequis

- Python 3.9 ou supérieur
- Node.js 16 ou supérieur
- npm
- PostgreSQL si la configuration de la base de données est utilisée

### 1. Backend

```bash
cd backend-fastapi

python -m venv venv
```

Activation de l'environnement virtuel sous Windows :

```powershell
.\venv\Scripts\Activate.ps1
```

Sous Linux ou macOS :

```bash
source venv/bin/activate
```

Installation des dépendances :

```bash
pip install -r requirements.txt
```

Entraînement du modèle :

```bash
python train_ml_model.py
```

Démarrage du serveur :

```bash
python run.py
```

Backend : `http://localhost:8000`

Documentation API : `http://localhost:8000/docs`

### 2. Frontend

Dans un nouveau terminal :

```bash
cd frontend-react

npm install

npm run dev
```

Frontend : `http://localhost:5173`

## Tests

Les scripts de test disponibles comprennent :

| Script | Objectif |
|---|---|
| `test_ml_direct.py` | Tester directement le modèle ML |
| `test_ml_accuracy.py` | Évaluer les performances du modèle |
| `test_with_analyses.py` | Tester avec des résultats biologiques |
| `test_complete.py` | Exécuter les tests du système |

Exemple d'exécution :

```bash
cd backend-fastapi

python test_complete.py
```

## Architecture du projet

```text
MediDiag/
├── backend-fastapi/
│   ├── app/
│   │   ├── datasets/
│   │   ├── ml/
│   │   │   ├── models/
│   │   │   ├── train_model.py
│   │   │   └── predictor.py
│   │   ├── routes/
│   │   ├── services/
│   │   │   ├── hybrid_diagnostic_service.py
│   │   │   ├── matching_service.py
│   │   │   └── scoring_service.py
│   │   ├── models/
│   │   └── utils/
│   ├── tests/
│   ├── requirements.txt
│   └── run.py
│
├── frontend-react/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── context/
│   │   └── utils/
│   ├── package.json
│   └── vite.config.js
│
├── database/
│   ├── schema.sql
│   └── migrations/
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── ML_APPROACH.md
│   ├── DATASET_ANALYSIS.md
│   └── API.md
│
├── INSTALLATION.md
├── QUICKSTART.md
└── README.md
```

## Évaluation du modèle

Les résultats rapportés dans les tests du projet sont les suivants :

### Modèle Machine Learning

| Indicateur | Résultat |
|---|---:|
| Top-1 Accuracy | 17,00 % |
| Top-3 Accuracy | 57,03 % |
| Top-5 Accuracy | 90,70 % |
| Cross-Validation | 17,73 % ± 0,78 % |

### Système hybride

Résultats rapportés sur un ensemble de 20 cas de test :

| Indicateur | Résultat |
|---|---:|
| Top-1 Accuracy | 90,00 % |
| Top-5 Accuracy | 95,00 % |
| Top-10 Accuracy | 100 % |

Ces résultats correspondent à des évaluations distinctes. Ils ne constituent pas une validation clinique du système ni une garantie de performance sur des patients réels.

## Sécurité et limites

- Validation des données entrantes avec Pydantic.
- Configuration CORS pour les échanges entre frontend et backend.
- Authentification JWT : fonctionnalité à implémenter selon l'état actuel du projet.
- Protection des données médicales à renforcer avant tout déploiement en environnement réel.

**Avertissement médical :** MediDiag est un outil expérimental d'aide à la décision. Les résultats proposés ne remplacent ni l'expertise d'un professionnel de santé ni un diagnostic médical établi après examen clinique.

## Évolutions envisagées

- Mise en place de l'authentification JWT.
- Gestion des rôles utilisateurs : médecins, infirmiers et administrateurs.
- Historique des consultations.
- Génération et exportation de rapports PDF.
- Amélioration de l'évaluation et des performances du modèle.
- Développement de fonctionnalités statistiques avancées.
- Prise en charge de plusieurs langues.

## Licence

Ce projet est distribué sous licence MIT.
