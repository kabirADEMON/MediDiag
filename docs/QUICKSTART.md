# ⚡ DÉMARRAGE RAPIDE - 5 minutes

Guide ultra-rapide pour démarrer le système de diagnostic médical.

---

## 🚀 Installation Express

### 1. Prérequis (2 min)

```bash
# Vérifier Python 3.9+
python --version

# Vérifier Node.js 16+
node --version
```

### 2. Backend (2 min)

```bash
# Cloner et installer
cd backend-fastapi
python -m venv venv

# Windows
.\venv\Scripts\Activate.ps1

# Linux/Mac
source venv/bin/activate

# Installer dépendances
pip install -r requirements.txt

# Entraîner le modèle ML (~2 min)
python train_ml_model.py
```

### 3. Frontend (1 min)

```bash
# Dans un nouveau terminal
cd frontend-react
npm install
```

---

## 🎯 Démarrage

### Terminal 1: Backend

```bash
cd backend-fastapi
.\venv\Scripts\Activate.ps1  # Windows
python run.py
```

✅ Backend: http://localhost:8000

### Terminal 2: Frontend

```bash
cd frontend-react
npm run dev
```

✅ Frontend: http://localhost:5173

---

## 🧪 Test rapide

```bash
cd backend-fastapi
python test_ml_direct.py
```

---

## 📊 Résultat attendu

- ✅ Backend sur port 8000
- ✅ Frontend sur port 5173
- ✅ Modèle ML chargé (145 MB)
- ✅ API docs: http://localhost:8000/docs
- ✅ Précision ML: 90.7% (Top-5)

---

## 🔥 Test du système

### Via l'API

```bash
curl -X POST http://localhost:8000/api/v1/diagnostic/ \
  -H "Content-Type: application/json" \
  -d '{
    "age": 35,
    "sexe": "M",
    "symptomes": ["Fièvre", "Maux de tête", "Fatigue"]
  }'
```

### Via le frontend

1. Ouvrir http://localhost:5173
2. Aller sur "Diagnostic"
3. Entrer les symptômes
4. Cliquer "Diagnostiquer"

---

## ⚠️ Problèmes courants

### Port déjà utilisé

```bash
# Changer le port dans .env
PORT=8001
```

### Modèle non trouvé

```bash
cd backend-fastapi
python train_ml_model.py
```

### Erreur CORS

Vérifier `.env`:
```env
CORS_ORIGINS=http://localhost:5173
```

---

## 📚 Documentation complète

Voir `INSTALLATION.md` pour plus de détails.

---

## ✅ C'est prêt!

Votre système de diagnostic médical intelligent est opérationnel! 🎉
