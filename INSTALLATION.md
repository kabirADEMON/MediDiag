# 📦 GUIDE D'INSTALLATION - Système de Diagnostic Médical Intelligent

## 📋 Table des matières

1. [Prérequis](#prérequis)
2. [Installation Backend (FastAPI)](#installation-backend-fastapi)
3. [Installation Frontend (React)](#installation-frontend-react)
4. [Installation Base de données (PostgreSQL)](#installation-base-de-données-postgresql)
5. [Configuration](#configuration)
6. [Entraînement du modèle ML](#entraînement-du-modèle-ml)
7. [Démarrage du système](#démarrage-du-système)
8. [Tests](#tests)
9. [Dépannage](#dépannage)

---

## 🔧 Prérequis

### Logiciels requis

- **Python 3.9+** (recommandé: 3.10 ou 3.11)
- **Node.js 16+** et **npm** ou **yarn**
- **PostgreSQL 14+** (optionnel pour la version complète)
- **Git**

### Vérification des versions

```bash
# Python
python --version

# Node.js
node --version

# npm
npm --version

# PostgreSQL (optionnel)
psql --version
```

---

## 🐍 Installation Backend (FastAPI)

### Étape 1: Cloner le projet

```bash
git clone <url-du-repo>
cd <nom-du-projet>
```

### Étape 2: Créer un environnement virtuel Python

#### Windows (PowerShell)
```powershell
cd backend-fastapi
python -m venv venv
.\venv\Scripts\Activate.ps1
```

#### Linux/Mac
```bash
cd backend-fastapi
python3 -m venv venv
source venv/bin/activate
```

### Étape 3: Installer les dépendances Python

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

**Dépendances principales installées:**
- FastAPI
- Uvicorn
- Pandas
- NumPy
- Scikit-learn
- RapidFuzz
- Pydantic
- Python-dotenv

### Étape 4: Vérifier l'installation

```bash
python -c "import fastapi; import pandas; import sklearn; print('✅ Toutes les dépendances sont installées')"
```

---

## ⚛️ Installation Frontend (React)

### Étape 1: Accéder au dossier frontend

```bash
cd frontend-react
```

### Étape 2: Installer les dépendances Node.js

#### Avec npm
```bash
npm install
```

#### Avec yarn
```bash
yarn install
```

**Dépendances principales installées:**
- React 18
- React Router DOM
- Axios
- TailwindCSS
- Lucide React (icônes)

### Étape 3: Vérifier l'installation

```bash
npm list react
```

---

## 🗄️ Installation Base de données (PostgreSQL)

### Option 1: Installation locale (Recommandé pour production)

#### Windows
1. Télécharger PostgreSQL depuis [postgresql.org](https://www.postgresql.org/download/windows/)
2. Installer avec les paramètres par défaut
3. Noter le mot de passe du superutilisateur

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Mac
```bash
brew install postgresql
brew services start postgresql
```

### Option 2: Version simplifiée (Sans base de données)

Le système peut fonctionner **sans PostgreSQL** pour les tests et le développement. Les données seront stockées en mémoire.

### Création de la base de données

```bash
# Se connecter à PostgreSQL
psql -U postgres

# Créer la base de données
CREATE DATABASE medical_diagnostic;

# Créer un utilisateur
CREATE USER medical_user WITH PASSWORD 'votre_mot_de_passe';

# Donner les permissions
GRANT ALL PRIVILEGES ON DATABASE medical_diagnostic TO medical_user;

# Quitter
\q
```

### Initialiser le schéma

```bash
cd database
psql -U medical_user -d medical_diagnostic -f schema.sql
```

---

## ⚙️ Configuration

### Backend - Fichier `.env`

Créer un fichier `.env` dans `backend-fastapi/`:

```bash
cd backend-fastapi
cp .env.example .env
```

Éditer `.env`:

```env
# Application
APP_NAME="Medical Diagnostic API"
APP_VERSION="1.0.0"
ENVIRONMENT=development
DEBUG=True

# Server
HOST=0.0.0.0
PORT=8000

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Database (optionnel)
DATABASE_URL=postgresql://medical_user:votre_mot_de_passe@localhost:5432/medical_diagnostic

# Security
SECRET_KEY=votre_cle_secrete_tres_longue_et_aleatoire
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Logging
LOG_LEVEL=INFO
```

### Frontend - Fichier `.env`

Créer un fichier `.env` dans `frontend-react/`:

```bash
cd frontend-react
cp .env.example .env
```

Éditer `.env`:

```env
# API Backend
VITE_API_URL=http://localhost:8000/api/v1

# Application
VITE_APP_NAME=Medical Diagnostic System
VITE_APP_VERSION=1.0.0
```

---

## 🤖 Entraînement du modèle ML

### Étape 1: Vérifier le dataset

Le dataset doit être présent dans:
```
backend-fastapi/app/datasets/1000_Maladies_Complet_Age_Sexe.csv
```

### Étape 2: Entraîner le modèle

```bash
cd backend-fastapi
python train_ml_model.py
```

**Durée:** ~2 minutes

**Résultat attendu:**
```
✅ ENTRAÎNEMENT TERMINÉ AVEC SUCCÈS!
📊 MÉTRIQUES DE PERFORMANCE:
• Précision (Accuracy):     17.00%
• Top-3 Accuracy:           57.03%
• Top-5 Accuracy:           90.70%
• Cross-Validation:         17.73% (±0.78%)

📁 MODÈLE SAUVEGARDÉ:
• Nombre de maladies:       601
• Exemples d'entraînement:  15000
• Features texte:           300
• Features totales:         302
```

### Étape 3: Vérifier les fichiers du modèle

```bash
ls -lh app/ml/models/
```

**Fichiers créés:**
- `random_forest.pkl` (~145 MB)
- `tfidf_vectorizer.pkl` (~10 KB)
- `label_encoder.pkl` (~170 KB)
- `age_scaler.pkl` (~1 KB)
- `training_metrics.json`

---

## 🚀 Démarrage du système

### Démarrage complet (Backend + Frontend)

#### Terminal 1: Backend FastAPI

```bash
cd backend-fastapi
.\venv\Scripts\Activate.ps1  # Windows
# ou
source venv/bin/activate      # Linux/Mac

# Démarrer le serveur
python run.py
```

**Serveur disponible sur:** http://localhost:8000

**Documentation API:** http://localhost:8000/docs

#### Terminal 2: Frontend React

```bash
cd frontend-react

# Démarrer le serveur de développement
npm run dev
# ou
yarn dev
```

**Application disponible sur:** http://localhost:5173 ou http://localhost:3000

### Démarrage en production

#### Backend (avec Gunicorn)

```bash
cd backend-fastapi
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

#### Frontend (build de production)

```bash
cd frontend-react
npm run build
# Les fichiers sont dans dist/

# Servir avec un serveur web (nginx, apache, etc.)
```

---

## 🧪 Tests

### Tests Backend

#### Test simple (vérification de base)
```bash
cd backend-fastapi
python test_simple.py
```

#### Test du modèle ML
```bash
python test_ml_direct.py
```

#### Test de précision ML
```bash
# Démarrer le serveur d'abord
python test_ml_accuracy.py
```

#### Test avec analyses biologiques
```bash
python test_with_analyses.py
```

#### Test complet
```bash
python test_complete.py
```

### Tests Frontend

```bash
cd frontend-react
npm test
```

### Test de l'API avec curl

```bash
# Health check
curl http://localhost:8000/health

# Test diagnostic
curl -X POST http://localhost:8000/api/v1/diagnostic/ \
  -H "Content-Type: application/json" \
  -d '{
    "age": 35,
    "sexe": "M",
    "symptomes": ["Fièvre", "Maux de tête", "Fatigue"]
  }'
```

---

## 🔍 Vérification de l'installation

### Checklist complète

- [ ] Python 3.9+ installé
- [ ] Node.js 16+ installé
- [ ] Environnement virtuel Python créé
- [ ] Dépendances Python installées
- [ ] Dépendances Node.js installées
- [ ] Fichiers `.env` configurés
- [ ] Dataset présent
- [ ] Modèle ML entraîné
- [ ] Backend démarre sans erreur
- [ ] Frontend démarre sans erreur
- [ ] API accessible sur http://localhost:8000
- [ ] Frontend accessible sur http://localhost:5173
- [ ] Tests passent avec succès

### Script de vérification automatique

```bash
# Backend
cd backend-fastapi
python -c "
import sys
import os
from pathlib import Path

checks = []

# Vérifier Python
checks.append(('Python version', sys.version_info >= (3, 9)))

# Vérifier dataset
dataset_path = Path('app/datasets/1000_Maladies_Complet_Age_Sexe.csv')
checks.append(('Dataset présent', dataset_path.exists()))

# Vérifier modèle ML
model_path = Path('app/ml/models/random_forest.pkl')
checks.append(('Modèle ML présent', model_path.exists()))

# Vérifier .env
env_path = Path('.env')
checks.append(('Fichier .env présent', env_path.exists()))

print('\n🔍 VÉRIFICATION DE L\'INSTALLATION\n')
for check, result in checks:
    status = '✅' if result else '❌'
    print(f'{status} {check}')

all_ok = all(result for _, result in checks)
print(f'\n{'✅ Installation complète!' if all_ok else '❌ Installation incomplète'}')
"
```

---

## 🐛 Dépannage

### Problème: Module Python non trouvé

**Solution:**
```bash
# Vérifier que l'environnement virtuel est activé
which python  # Linux/Mac
where python  # Windows

# Réinstaller les dépendances
pip install -r requirements.txt
```

### Problème: Port 8000 déjà utilisé

**Solution:**
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8000 | xargs kill -9
```

### Problème: Erreur CORS

**Solution:**
Vérifier que `CORS_ORIGINS` dans `.env` inclut l'URL du frontend:
```env
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Problème: Modèle ML trop lent à charger

**Cause:** Le modèle fait 145 MB et peut prendre 10-20 secondes à charger.

**Solution:** Le modèle est chargé au premier appel. Attendre le premier diagnostic.

### Problème: Erreur de connexion à PostgreSQL

**Solution:**
```bash
# Vérifier que PostgreSQL est démarré
sudo systemctl status postgresql  # Linux
brew services list                # Mac

# Tester la connexion
psql -U medical_user -d medical_diagnostic
```

### Problème: Frontend ne se connecte pas au backend

**Solution:**
1. Vérifier que le backend est démarré
2. Vérifier `VITE_API_URL` dans `frontend-react/.env`
3. Vérifier les CORS dans le backend

---

## 📊 Architecture du système installé

```
Système de Diagnostic Médical
│
├── Frontend (React)
│   ├── Port: 5173
│   ├── URL: http://localhost:5173
│   └── Connexion API: http://localhost:8000
│
├── Backend (FastAPI)
│   ├── Port: 8000
│   ├── URL: http://localhost:8000
│   ├── Docs: http://localhost:8000/docs
│   └── Modèle ML: 145 MB (302 features)
│
├── Base de données (PostgreSQL) - Optionnel
│   ├── Port: 5432
│   ├── Database: medical_diagnostic
│   └── User: medical_user
│
└── Dataset
    ├── Fichier: 1000_Maladies_Complet_Age_Sexe.csv
    ├── Maladies: 1000
    └── Colonnes: 17
```

---

## 🎯 Prochaines étapes

Après l'installation:

1. **Tester le système:**
   ```bash
   cd backend-fastapi
   python test_complete.py
   ```

2. **Accéder à la documentation API:**
   http://localhost:8000/docs

3. **Lancer l'application frontend:**
   http://localhost:5173

4. **Créer un compte utilisateur** (si authentification activée)

5. **Effectuer un diagnostic test**

---

## 📞 Support

Pour toute question ou problème:

1. Consulter la documentation dans `/docs`
2. Vérifier les logs du backend
3. Vérifier la console du frontend
4. Consulter les issues GitHub

---

## 📝 Notes importantes

- **Sécurité:** Changer les clés secrètes en production
- **Performance:** Le premier diagnostic peut prendre 10-20s (chargement du modèle)
- **Dataset:** Ne pas modifier le fichier CSV sans réentraîner le modèle
- **Modèle ML:** Réentraîner si le dataset change
- **CORS:** Configurer correctement pour la production

---

## ✅ Installation réussie!

Si tous les tests passent, votre système est prêt à l'emploi! 🎉

**Système de Diagnostic Médical Intelligent**
- ✅ Backend FastAPI opérationnel
- ✅ Frontend React opérationnel
- ✅ Modèle ML entraîné (90.7% Top-5 accuracy)
- ✅ API documentée
- ✅ Tests fonctionnels

**Bon diagnostic! 🏥**
