# 🏥 MediDiag - Guide d'Installation depuis GitHub

## 📋 Table des Matières

1. [Prérequis](#prérequis)
2. [Installation Rapide (5 minutes)](#installation-rapide)
3. [Installation Détaillée](#installation-détaillée)
4. [Configuration](#configuration)
5. [Lancement de l'Application](#lancement-de-lapplication)
6. [Comptes de Démonstration](#comptes-de-démonstration)
7. [Vérification de l'Installation](#vérification-de-linstallation)
8. [Dépannage](#dépannage)
9. [Utilisation de l'Application](#utilisation-de-lapplication)

---

## 🎯 Prérequis

Avant de commencer, assurez-vous d'avoir installé :

### Obligatoire
- **Python 3.9+** - [Télécharger Python](https://www.python.org/downloads/)
- **Node.js 16+** - [Télécharger Node.js](https://nodejs.org/)
- **Git** - [Télécharger Git](https://git-scm.com/downloads)

### Optionnel (pour Docker)
- **Docker Desktop** - [Télécharger Docker](https://www.docker.com/products/docker-desktop/)

### Vérifier les installations

```bash
# Vérifier Python
python --version
# Doit afficher: Python 3.9.x ou supérieur

# Vérifier Node.js
node --version
# Doit afficher: v16.x.x ou supérieur

# Vérifier npm
npm --version
# Doit afficher: 8.x.x ou supérieur

# Vérifier Git
git --version
# Doit afficher: git version 2.x.x
```

---

## ⚡ Installation Rapide (5 minutes)

### 1. Cloner le Projet

```bash
# Cloner le repository
git clone https://github.com/VOTRE_USERNAME/medidiag.git

# Aller dans le dossier
cd medidiag
```

### 2. Installer le Backend

```bash
# Aller dans le dossier backend
cd backend-fastapi

# Créer un environnement virtuel
python -m venv venv

# Activer l'environnement virtuel
# Sur Windows (PowerShell)
.\venv\Scripts\Activate.ps1

# Sur Windows (CMD)
venv\Scripts\activate.bat

# Sur Linux/Mac
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt

# Entraîner le modèle ML (2-3 minutes)
python train_ml_model.py
```

### 3. Installer le Frontend

```bash
# Ouvrir un NOUVEAU terminal
cd frontend-react

# Installer les dépendances
npm install

# Copier le fichier de configuration
cp .env.example .env
```

### 4. Lancer l'Application

**Terminal 1 - Backend:**
```bash
cd backend-fastapi
python run.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend-react
npm run dev
```

### 5. Accéder à l'Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Documentation API**: http://localhost:8000/docs

**Identifiants de test:**
- Email: `medecin@demo.com`
- Mot de passe: `demo123`

---

## 📦 Installation Détaillée

### Étape 1: Cloner le Repository

```bash
# Via HTTPS
git clone https://github.com/VOTRE_USERNAME/medidiag.git

# OU via SSH (si configuré)
git clone git@github.com:VOTRE_USERNAME/medidiag.git

# Entrer dans le dossier
cd medidiag

# Vérifier la structure
ls -la
```

**Structure attendue:**
```
medidiag/
├── backend-fastapi/     # API FastAPI
├── frontend-react/      # Interface React
├── database/            # Schémas SQL
├── docs/                # Documentation
├── README.md
└── docker-compose.yml
```

---

### Étape 2: Configuration du Backend

#### 2.1 Créer l'Environnement Virtuel

```bash
cd backend-fastapi

# Créer l'environnement virtuel
python -m venv venv

# Activer l'environnement
# Windows PowerShell
.\venv\Scripts\Activate.ps1

# Windows CMD
venv\Scripts\activate.bat

# Linux/Mac
source venv/bin/activate

# Vérifier l'activation (le prompt doit afficher (venv))
```

#### 2.2 Installer les Dépendances Python

```bash
# Mettre à jour pip
python -m pip install --upgrade pip

# Installer les dépendances
pip install -r requirements.txt

# Vérifier l'installation
pip list
```

**Dépendances principales installées:**
- FastAPI 0.109.0
- Uvicorn 0.27.0
- Pandas 2.1.4
- Scikit-learn 1.4.0
- RapidFuzz 3.6.1

#### 2.3 Configuration de l'Environnement

```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer le fichier .env (optionnel)
# Les valeurs par défaut fonctionnent pour le développement local
```

**Contenu de `.env`:**
```env
APP_NAME=Medical Diagnostic API
DEBUG=True
SECRET_KEY=your-secret-key-change-in-production
HOST=0.0.0.0
PORT=8000
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

#### 2.4 Entraîner le Modèle Machine Learning

```bash
# Entraîner le modèle (durée: 2-3 minutes)
python train_ml_model.py
```

**Sortie attendue:**
```
🚀 Starting ML Model Training...
📊 Loading dataset...
✅ Dataset loaded: 1000 diseases
🔄 Generating training data...
✅ Generated 15000 training samples
🤖 Training Random Forest model...
✅ Model trained successfully!

📈 Performance Metrics:
- Accuracy: 17.00%
- Top-3 Accuracy: 57.03%
- Top-5 Accuracy: 90.70%

💾 Saving model...
✅ Model saved to app/ml/models/
```

#### 2.5 Initialiser la Base de Données

```bash
# La base de données SQLite est créée automatiquement au premier lancement
# Vérifier que le dossier data/ existe
mkdir -p data
```

---

### Étape 3: Configuration du Frontend

#### 3.1 Installer les Dépendances Node.js

```bash
# Ouvrir un NOUVEAU terminal
cd frontend-react

# Installer les dépendances
npm install

# Vérifier l'installation
npm list --depth=0
```

**Dépendances principales installées:**
- React 18.2.0
- Vite 5.0.8
- React Router DOM 6.20.0
- Axios 1.6.2
- TailwindCSS 3.3.6

#### 3.2 Configuration de l'Environnement

```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer le fichier .env si nécessaire
```

**Contenu de `.env`:**
```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_ENV=development
```

---

## 🚀 Lancement de l'Application

### Méthode 1: Lancement Manuel (Recommandé pour le Développement)

#### Terminal 1 - Backend

```bash
cd backend-fastapi

# Activer l'environnement virtuel
# Windows
.\venv\Scripts\Activate.ps1
# Linux/Mac
source venv/bin/activate

# Lancer le serveur
python run.py
```

**Sortie attendue:**
```
🚀 Starting Medical Diagnostic API...
Environment: development
✅ Dataset loaded: 1000 diseases
✅ API is ready to accept requests
INFO:     Uvicorn running on http://0.0.0.0:8000
```

#### Terminal 2 - Frontend

```bash
cd frontend-react

# Lancer le serveur de développement
npm run dev
```

**Sortie attendue:**
```
VITE v5.0.8  ready in 1234 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h to show help
```

---

### Méthode 2: Lancement avec Docker (Production)

```bash
# À la racine du projet
docker-compose up -d

# Vérifier les conteneurs
docker-compose ps

# Voir les logs
docker-compose logs -f
```

**Services disponibles:**
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- PostgreSQL: localhost:5432

**Arrêter les conteneurs:**
```bash
docker-compose down
```

---

## 👥 Comptes de Démonstration

L'application est livrée avec 3 comptes de test :

### 1. Médecin
- **Email:** `medecin@demo.com`
- **Mot de passe:** `demo123`
- **Rôle:** Médecin généraliste
- **Permissions:** Consultation, Diagnostic, Gestion patients

### 2. Infirmier
- **Email:** `infirmier@demo.com`
- **Mot de passe:** `demo123`
- **Rôle:** Infirmier
- **Permissions:** Consultation, Gestion patients

### 3. Administrateur
- **Email:** `admin@demo.com`
- **Mot de passe:** `demo123`
- **Rôle:** Administrateur système
- **Permissions:** Toutes les permissions

---

## ✅ Vérification de l'Installation

### 1. Vérifier le Backend

```bash
# Test de santé de l'API
curl http://localhost:8000/health

# Réponse attendue:
{
  "status": "healthy",
  "version": "1.0.0",
  "environment": "development",
  "dataset": {
    "loaded": true,
    "diseases_count": 1000
  }
}
```

**Via le navigateur:**
- Ouvrir http://localhost:8000/docs
- Vous devez voir la documentation Swagger UI

### 2. Vérifier le Frontend

- Ouvrir http://localhost:5173
- Vous devez voir la page de connexion
- Essayer de se connecter avec `medecin@demo.com` / `demo123`

### 3. Test Complet du Système

```bash
cd backend-fastapi
python test_complete.py
```

**Résultat attendu:**
```
✅ Backend API: OK
✅ Dataset loaded: 1000 diseases
✅ ML Model: Loaded
✅ Diagnostic test: PASSED
✅ All systems operational!
```

---

## 🐛 Dépannage

### Problème 1: Port déjà utilisé

**Erreur:** `Address already in use: 8000`

**Solution:**
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8000 | xargs kill -9
```

### Problème 2: Module Python non trouvé

**Erreur:** `ModuleNotFoundError: No module named 'fastapi'`

**Solution:**
```bash
# Vérifier que l'environnement virtuel est activé
# Le prompt doit afficher (venv)

# Réinstaller les dépendances
pip install -r requirements.txt
```

### Problème 3: Erreur npm install

**Erreur:** `npm ERR! code EACCES`

**Solution:**
```bash
# Nettoyer le cache npm
npm cache clean --force

# Supprimer node_modules
rm -rf node_modules package-lock.json

# Réinstaller
npm install
```

### Problème 4: Modèle ML non trouvé

**Erreur:** `ML model not found`

**Solution:**
```bash
cd backend-fastapi
python train_ml_model.py
```

### Problème 5: CORS Error

**Erreur:** `Access to XMLHttpRequest blocked by CORS policy`

**Solution:**
1. Vérifier que le backend tourne sur le port 8000
2. Vérifier le fichier `.env` du frontend:
   ```env
   VITE_API_URL=http://localhost:8000/api/v1
   ```
3. Redémarrer le frontend

### Problème 6: Base de données verrouillée

**Erreur:** `database is locked`

**Solution:**
```bash
# Arrêter tous les processus backend
# Supprimer le fichier de base de données
rm backend-fastapi/data/medical.db

# Relancer le backend (la BDD sera recréée)
cd backend-fastapi
python run.py
```

---

## 📖 Utilisation de l'Application

### 1. Première Connexion

1. Ouvrir http://localhost:5173
2. Se connecter avec `medecin@demo.com` / `demo123`
3. Vous arrivez sur le **Dashboard**

### 2. Créer un Patient

1. Cliquer sur **"Patients"** dans le menu
2. Cliquer sur **"Nouveau patient"**
3. Remplir le formulaire:
   - Nom: Dupont
   - Prénom: Jean
   - Date de naissance: 1990-05-15
   - Sexe: Masculin
   - Téléphone: 0612345678 (optionnel)
4. Cliquer sur **"Enregistrer"**
5. **Noter le code patient** généré (ex: PAT-20260512-0001)

### 3. Effectuer une Consultation

1. Cliquer sur **"Consultation"** dans le menu
2. **Rechercher le patient:**
   - Entrer le code patient
   - Cliquer sur "Rechercher"
3. **Ajouter des symptômes:**
   - Taper "Fièvre" et appuyer sur Entrée
   - Taper "Fatigue" et appuyer sur Entrée
   - Taper "Maux de tête" et appuyer sur Entrée
4. **Ajouter des analyses (optionnel):**
   - Sélectionner des analyses biologiques
5. **Lancer le diagnostic:**
   - Cliquer sur "Lancer le diagnostic"
   - Attendre les résultats (2-3 secondes)
6. **Consulter les résultats:**
   - Top 10 diagnostics possibles
   - Scores de probabilité
   - Niveaux d'urgence
   - Examens recommandés
7. **Enregistrer la consultation:**
   - Ajouter des notes complémentaires
   - Cliquer sur "Enregistrer la consultation"

### 4. Consulter l'Historique

1. Aller dans **"Patients"**
2. Cliquer sur un patient
3. Voir l'historique des consultations

---

## 📊 Fonctionnalités Principales

### ✅ Diagnostic Intelligent
- **Système hybride:** 70% Machine Learning + 30% Fuzzy Matching
- **Base de données:** 1000 maladies
- **Précision:** 90.7% (Top-5 accuracy)
- **Temps de réponse:** < 1 seconde

### ✅ Gestion des Patients
- Code patient unique automatique
- Dossier médical complet
- Historique des consultations
- Antécédents médicaux et allergies

### ✅ Consultations Médicales
- Saisie des symptômes avec autocomplétion
- Analyses biologiques optionnelles
- Enregistrement des consultations
- Notes du médecin

### ✅ Recommandations
- Examens complémentaires suggérés
- Niveaux d'urgence automatiques
- Analyses biologiques recommandées

---

## 🔐 Sécurité

### En Développement
- ✅ Authentification JWT
- ✅ Validation des données (Pydantic)
- ✅ CORS configuré
- ✅ Base de données SQLite locale

### Pour la Production
⚠️ **Avant de déployer en production:**

1. **Changer les secrets:**
   ```env
   SECRET_KEY=votre-clé-secrète-forte-et-unique
   ```

2. **Utiliser PostgreSQL:**
   ```env
   DATABASE_URL=postgresql://user:password@host:5432/dbname
   ```

3. **Activer HTTPS:**
   - Utiliser un certificat SSL/TLS
   - Configurer Nginx ou Apache

4. **Hasher les mots de passe:**
   - Utiliser bcrypt pour les mots de passe
   - Implémenter une politique de mots de passe forts

5. **Limiter les requêtes:**
   - Implémenter un rate limiting
   - Protéger contre les attaques DDoS

---

## 📚 Documentation Supplémentaire

- **README.md** - Vue d'ensemble du projet
- **docs/ARCHITECTURE.md** - Architecture du système
- **docs/ML_APPROACH.md** - Approche Machine Learning
- **docs/DATASET_ANALYSIS.md** - Analyse du dataset
- **backend-fastapi/README.md** - Documentation backend
- **frontend-react/README.md** - Documentation frontend
- **ENREGISTREMENT_CONSULTATION.md** - Guide des consultations

---

## 🆘 Support

### Problèmes Courants
1. Consulter la section [Dépannage](#dépannage)
2. Vérifier les logs du backend et frontend
3. Consulter la documentation API: http://localhost:8000/docs

### Rapporter un Bug
1. Vérifier que le bug n'a pas déjà été signalé
2. Créer une issue sur GitHub avec:
   - Description du problème
   - Étapes pour reproduire
   - Logs d'erreur
   - Environnement (OS, versions Python/Node)

### Contribuer
1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

## ⚠️ Avertissement Médical

**IMPORTANT:** Cette application est un **outil d'aide à la décision médicale** et ne remplace en aucun cas :
- Une consultation médicale professionnelle
- Un diagnostic médical établi par un médecin
- Un traitement médical prescrit par un professionnel de santé

**Toujours consulter un professionnel de santé qualifié pour tout problème médical.**

---

## 📄 Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## 👨‍💻 Auteur

Développé avec ❤️ pour améliorer le diagnostic médical

---

## 🎉 Félicitations !

Vous avez maintenant installé et configuré **MediDiag** avec succès ! 

**Prochaines étapes:**
1. ✅ Explorer l'interface
2. ✅ Créer des patients de test
3. ✅ Effectuer des diagnostics
4. ✅ Consulter la documentation API
5. ✅ Personnaliser l'application selon vos besoins

**Bon diagnostic ! 🏥**
