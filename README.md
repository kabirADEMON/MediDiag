# 🏥 Système de Diagnostic Médical Intelligent

Plateforme d'aide au diagnostic médical basée sur l'intelligence artificielle combinant Fuzzy Matching et Machine Learning.

---

## 📚 Documentation

| Guide | Description | Temps |
|-------|-------------|-------|
| **[🚀 Guide d'Installation Rapide](INSTALL_GUIDE.md)** | Installation visuelle étape par étape | 10 min |
| **[⚡ Démarrage Rapide](QUICKSTART.md)** | Installation express | 5 min |
| **[📦 Installation Complète](INSTALLATION.md)** | Guide détaillé d'installation | 15 min |
| **[🐳 Déploiement Docker](DOCKER.md)** | Déploiement avec Docker Compose | 10 min |
| **[🏗️ Architecture](docs/ARCHITECTURE.md)** | Architecture du système | - |
| **[🤖 Machine Learning](docs/ML_APPROACH.md)** | Approche ML et performances | - |
| **[📊 Dataset](docs/DATASET_ANALYSIS.md)** | Analyse des 1000 maladies | - |
| **[🔌 API](docs/API.md)** | Documentation API REST | - |

---

## ✨ Fonctionnalités

### 🎯 Diagnostic Intelligent
- **Système hybride** : Fuzzy Matching (30%) + Machine Learning (70%)
- **Analyse complète** : Symptômes + Analyses biologiques + Âge + Sexe
- **1000 maladies** dans la base de données
- **90.7% de précision** (Top-5 accuracy)
- **Recommandations d'examens** médicaux personnalisées
- **Niveaux d'urgence** automatiques (critique, élevée, modérée, faible)

### 🤖 Intelligence Artificielle
- **Random Forest** optimisé (50 arbres, 145 MB)
- **302 features** : 300 texte (TF-IDF) + âge + sexe
- **15,000 cas d'entraînement** synthétiques
- **Entraînement rapide** : ~2 minutes
- **Chargement rapide** : ~10 secondes

### 🔌 API REST (FastAPI)
- **Documentation interactive** : Swagger UI
- **Validation automatique** : Pydantic
- **CORS configuré** pour React
- **Gestion d'erreurs** complète
- **Endpoints** : diagnostic, maladies, statistiques

### ⚛️ Interface React
- **Design moderne** et responsive
- **Formulaires intelligents** avec validation
- **Affichage temps réel** des résultats
- **Gestion des patients** et consultations
- **Statistiques** et graphiques

---

## 🚀 Démarrage rapide (5 minutes)

### Prérequis
- Python 3.9+
- Node.js 16+

### Installation

#### 1. Backend (FastAPI)
```bash
cd backend-fastapi

# Créer environnement virtuel
python -m venv venv

# Activer (Windows)
.\venv\Scripts\Activate.ps1

# Activer (Linux/Mac)
source venv/bin/activate

# Installer dépendances
pip install -r requirements.txt

# Entraîner le modèle ML (~2 min)
python train_ml_model.py

# Démarrer le serveur
python run.py
```

✅ **Backend disponible:** http://localhost:8000  
📖 **API Docs:** http://localhost:8000/docs

#### 2. Frontend (React)
```bash
# Nouveau terminal
cd frontend-react

# Installer dépendances
npm install

# Démarrer le serveur
npm run dev
```

✅ **Frontend disponible:** http://localhost:5173

---

## 🧪 Tests

### Test rapide du modèle ML
```bash
cd backend-fastapi
python test_ml_direct.py
```

### Test de précision
```bash
python test_ml_accuracy.py
```

### Test avec analyses biologiques
```bash
python test_with_analyses.py
```

### Test complet
```bash
python test_complete.py
```

### Test de l'API
```bash
curl -X POST http://localhost:8000/api/v1/diagnostic/ \
  -H "Content-Type: application/json" \
  -d '{
    "age": 35,
    "sexe": "M",
    "symptomes": ["Fièvre", "Maux de tête", "Fatigue"]
  }'
```

---

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend React                           │
│                  (Port 5173/3000)                           │
│  • Interface utilisateur moderne                            │
│  • Formulaires de diagnostic                                │
│  • Affichage des résultats                                  │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/REST
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend FastAPI                           │
│                    (Port 8000)                              │
│  • API REST                                                 │
│  • Validation Pydantic                                      │
│  • Système hybride de diagnostic                           │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
┌──────────────────┐    ┌──────────────────────┐
│ Fuzzy Matching   │    │   Machine Learning   │
│   (30% poids)    │    │     (70% poids)      │
│                  │    │                      │
│ • RapidFuzz      │    │ • Random Forest      │
│ • Filtrage âge   │    │ • TF-IDF (300)       │
│ • Filtrage sexe  │    │ • Age + Sexe         │
│ • Score symptômes│    │ • 601 maladies       │
└──────────────────┘    └──────────────────────┘
        │                         │
        └────────────┬────────────┘
                     ▼
        ┌────────────────────────┐
        │   Résultats combinés   │
        │  • Top 10 diagnostics  │
        │  • Scores pondérés     │
        │  • Examens recommandés │
        │  • Niveau d'urgence    │
        └────────────────────────┘
```

---

## 📁 Structure du projet

```
.
├── backend-fastapi/              # Backend FastAPI
│   ├── app/
│   │   ├── datasets/            # Dataset 1000 maladies
│   │   ├── ml/                  # Modèle Machine Learning
│   │   │   ├── models/          # Modèles entraînés (145 MB)
│   │   │   ├── train_model.py   # Script d'entraînement
│   │   │   └── predictor.py     # Prédictions ML
│   │   ├── routes/              # Routes API
│   │   ├── services/            # Logique métier
│   │   │   ├── hybrid_diagnostic_service.py
│   │   │   ├── matching_service.py
│   │   │   └── scoring_service.py
│   │   ├── models/              # Modèles Pydantic
│   │   └── utils/               # Utilitaires
│   ├── tests/                   # Tests
│   ├── requirements.txt         # Dépendances Python
│   └── run.py                   # Point d'entrée
│
├── frontend-react/              # Frontend React
│   ├── src/
│   │   ├── components/          # Composants React
│   │   ├── pages/               # Pages
│   │   ├── services/            # Services API
│   │   ├── context/             # Context API
│   │   └── utils/               # Utilitaires
│   ├── package.json             # Dépendances Node
│   └── vite.config.js           # Config Vite
│
├── database/                    # Base de données
│   ├── schema.sql               # Schéma PostgreSQL
│   └── migrations/              # Migrations
│
├── docs/                        # Documentation
│   ├── ARCHITECTURE.md
│   ├── ML_APPROACH.md
│   ├── DATASET_ANALYSIS.md
│   └── API.md
│
├── INSTALLATION.md              # Guide d'installation
├── QUICKSTART.md                # Démarrage rapide
└── README.md                    # Ce fichier
```

---

## 🛠️ Technologies

### Backend
- **FastAPI** - Framework web moderne
- **Uvicorn** - Serveur ASGI
- **Pandas** - Manipulation de données
- **Scikit-learn** - Machine Learning
- **RapidFuzz** - Fuzzy matching
- **Pydantic** - Validation de données

### Frontend
- **React 18** - Framework UI
- **Vite** - Build tool
- **Axios** - Client HTTP
- **React Router** - Routing
- **TailwindCSS** - Styling

### Machine Learning
- **Random Forest** - Algorithme de classification
- **TF-IDF** - Vectorisation de texte
- **StandardScaler** - Normalisation
- **LabelEncoder** - Encodage des labels

---

## 📈 Performances

### Modèle ML
- **Top-1 Accuracy:** 17.00%
- **Top-3 Accuracy:** 57.03%
- **Top-5 Accuracy:** 90.70% ✅
- **Cross-Validation:** 17.73% (±0.78%)

### Système Hybride (Tests réels)
- **Top-1 Accuracy:** 90.0% (18/20) ✅
- **Top-5 Accuracy:** 95.0% (19/20) ✅
- **Top-10 Accuracy:** 100% (20/20) ✅

### Optimisations
- **Taille du modèle:** 145 MB (réduit de 4 GB)
- **Temps d'entraînement:** ~2 minutes (réduit de 48 min)
- **Temps de chargement:** ~10 secondes
- **Temps de prédiction:** <1 seconde

---

## 🔒 Sécurité

- ⚠️ **Avertissement médical:** Cet outil est une aide à la décision et ne remplace pas un diagnostic médical professionnel
- 🔐 Authentification JWT (à implémenter)
- 🛡️ Validation des entrées avec Pydantic
- 🔒 CORS configuré
- 🚫 Pas de stockage de données sensibles en clair

---

## 📝 Licence

Ce projet est sous licence MIT.

---

## 👥 Contribution

Les contributions sont les bienvenues! Voir `CONTRIBUTING.md` pour plus de détails.

---

## 📞 Support

Pour toute question:
1. Consulter la [documentation](docs/)
2. Vérifier les [issues GitHub](issues/)
3. Créer une nouvelle issue

---

## 🎯 Roadmap

- [ ] Authentification JWT complète
- [ ] Gestion des utilisateurs (médecins, infirmiers)
- [ ] Historique des consultations
- [ ] Export PDF des diagnostics
- [ ] Graphiques et statistiques avancées
- [ ] Support multilingue
- [ ] Application mobile
- [ ] Amélioration continue du modèle ML

---

## ✅ Statut du projet

🟢 **Opérationnel** - Le système est fonctionnel et prêt pour les tests

- ✅ Backend FastAPI opérationnel
- ✅ Frontend React opérationnel
- ✅ Modèle ML entraîné et optimisé
- ✅ API documentée
- ✅ Tests fonctionnels
- ✅ Documentation complète

---

**Développé avec ❤️ pour améliorer le diagnostic médical**
#   m a l a d i e 
 
 