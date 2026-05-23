# 🚀 Guide d'Installation Rapide - MediDiag

> Installation complète en **10 minutes** ⏱️

---

## 📋 Prérequis (2 min)

### ✅ Vérifiez que vous avez :

```bash
# Python 3.9+
python --version
# ➜ Python 3.11.x

# Node.js 16+
node --version
# ➜ v18.x.x

# npm
npm --version
# ➜ 9.x.x

# Git
git --version
# ➜ git version 2.x.x
```

### ❌ Pas installé ? Téléchargez :

| Logiciel | Windows | macOS | Linux |
|----------|---------|-------|-------|
| **Python** | [python.org](https://python.org) | `brew install python` | `sudo apt install python3` |
| **Node.js** | [nodejs.org](https://nodejs.org) | `brew install node` | `sudo apt install nodejs npm` |
| **Git** | [git-scm.com](https://git-scm.com) | `brew install git` | `sudo apt install git` |

---

## 📥 1. Cloner le projet (30 sec)

```bash
git clone https://github.com/Djabir03/maladie.git
cd maladie
```

---

## 🐍 2. Backend FastAPI (4 min)

### Étape 1 : Créer l'environnement virtuel

<details>
<summary><b>🪟 Windows (PowerShell)</b></summary>

```powershell
cd backend-fastapi
python -m venv venv
.\venv\Scripts\Activate.ps1
```

</details>

<details>
<summary><b>🐧 Linux / 🍎 macOS</b></summary>

```bash
cd backend-fastapi
python3 -m venv venv
source venv/bin/activate
```

</details>

### Étape 2 : Installer les dépendances

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

⏳ **Durée :** ~2 minutes

### Étape 3 : Entraîner le modèle ML

```bash
python train_ml_model.py
```

⏳ **Durée :** ~2 minutes

**✅ Résultat attendu :**
```
✅ ENTRAÎNEMENT TERMINÉ AVEC SUCCÈS!
📊 Top-5 Accuracy: 90.70%
📁 Modèle sauvegardé: app/ml/models/random_forest.pkl (145 MB)
```

### Étape 4 : Démarrer le serveur

```bash
python run.py
```

**✅ Backend prêt :** http://localhost:8000  
**📖 API Docs :** http://localhost:8000/docs

---

## ⚛️ 3. Frontend React (3 min)

### Ouvrir un nouveau terminal

### Étape 1 : Installer les dépendances

```bash
cd frontend-react
npm install
```

⏳ **Durée :** ~2 minutes

### Étape 2 : Démarrer le serveur

```bash
npm run dev
```

**✅ Frontend prêt :** http://localhost:5173

---

## 🧪 4. Tester l'installation (1 min)

### Test 1 : API Health Check

```bash
curl http://localhost:8000/health
```

**✅ Réponse attendue :**
```json
{"status": "healthy"}
```

### Test 2 : Diagnostic Test

```bash
curl -X POST http://localhost:8000/api/v1/diagnostic/ \
  -H "Content-Type: application/json" \
  -d '{
    "age": 35,
    "sexe": "M",
    "symptomes": ["Fièvre", "Maux de tête", "Fatigue"]
  }'
```

**✅ Réponse attendue :** JSON avec top 10 diagnostics

### Test 3 : Interface Web

1. Ouvrir http://localhost:5173
2. Cliquer sur "Nouveau Diagnostic"
3. Remplir le formulaire
4. Voir les résultats

---

## 🎉 Installation terminée !

### ✅ Checklist finale

- [ ] Backend démarre sur http://localhost:8000
- [ ] Frontend démarre sur http://localhost:5173
- [ ] API répond au health check
- [ ] Diagnostic test fonctionne
- [ ] Interface web accessible

### 🚀 Prochaines étapes

1. **Consulter la documentation API :** http://localhost:8000/docs
2. **Lire le guide complet :** [INSTALLATION.md](INSTALLATION.md)
3. **Voir l'architecture :** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
4. **Comprendre le ML :** [docs/ML_APPROACH.md](docs/ML_APPROACH.md)

---

## 🐛 Problèmes courants

<details>
<summary><b>❌ Erreur : "Module not found"</b></summary>

**Solution :**
```bash
# Vérifier que l'environnement virtuel est activé
pip install -r requirements.txt
```

</details>

<details>
<summary><b>❌ Erreur : "Port 8000 already in use"</b></summary>

**Solution Windows :**
```powershell
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

**Solution Linux/Mac :**
```bash
lsof -ti:8000 | xargs kill -9
```

</details>

<details>
<summary><b>❌ Erreur : "CORS policy"</b></summary>

**Solution :**
Créer `backend-fastapi/.env` :
```env
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

</details>

<details>
<summary><b>❌ Frontend ne se connecte pas au backend</b></summary>

**Solution :**
Créer `frontend-react/.env` :
```env
VITE_API_URL=http://localhost:8000/api/v1
```

</details>

---

## 📊 Architecture installée

```
┌─────────────────────────────────────────┐
│         Frontend React                  │
│      http://localhost:5173              │
│  • Interface utilisateur                │
│  • Formulaires de diagnostic            │
└──────────────┬──────────────────────────┘
               │ HTTP/REST
               ▼
┌─────────────────────────────────────────┐
│         Backend FastAPI                 │
│      http://localhost:8000              │
│  • API REST                             │
│  • Système hybride                      │
│  • Modèle ML (145 MB)                   │
└─────────────────────────────────────────┘
```

---

## 📞 Besoin d'aide ?

- 📖 **Documentation complète :** [INSTALLATION.md](INSTALLATION.md)
- 🐛 **Signaler un bug :** [GitHub Issues](https://github.com/Djabir03/maladie/issues)
- 💬 **Questions :** Créer une issue avec le tag `question`

---

## 🎯 Performances attendues

| Métrique | Valeur |
|----------|--------|
| **Top-1 Accuracy** | 17.00% |
| **Top-5 Accuracy** | 90.70% ✅ |
| **Temps d'entraînement** | ~2 minutes |
| **Temps de chargement** | ~10 secondes |
| **Temps de prédiction** | <1 seconde |

---

## 🔒 Note de sécurité

⚠️ **Important :** Ce système est une **aide à la décision** et ne remplace pas un diagnostic médical professionnel.

---

**Développé avec ❤️ pour améliorer le diagnostic médical**

[⬅️ Retour au README](README.md) | [📖 Documentation complète](INSTALLATION.md) | [🐳 Installation Docker](DOCKER.md)
