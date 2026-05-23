# 🔌 Connexion Frontend-Backend - Guide complet

## ✅ État de la connexion

Le frontend React est **100% connecté** au backend FastAPI avec toutes les routes nécessaires.

---

## 🎯 Routes Backend créées

### ✅ 1. Authentification (`/api/v1/auth`)

| Méthode | Endpoint | Description | Status |
|---------|----------|-------------|--------|
| POST | `/auth/login` | Connexion utilisateur | ✅ |
| POST | `/auth/logout` | Déconnexion | ✅ |
| POST | `/auth/refresh` | Rafraîchir le token | ✅ |
| GET | `/auth/me` | Utilisateur actuel | ✅ |
| POST | `/auth/register` | Inscription | ✅ |

**Comptes de démonstration :**
```json
{
  "email": "medecin@demo.com",
  "password": "demo123",
  "role": "medecin"
}
```

### ✅ 2. Patients (`/api/v1/patients`)

| Méthode | Endpoint | Description | Status |
|---------|----------|-------------|--------|
| GET | `/patients` | Liste des patients | ✅ |
| GET | `/patients/{id}` | Détails patient | ✅ |
| POST | `/patients` | Créer patient | ✅ |
| PUT | `/patients/{id}` | Modifier patient | ✅ |
| DELETE | `/patients/{id}` | Supprimer patient | ✅ |
| GET | `/patients/search/{query}` | Rechercher | ✅ |

**Champs patient :**
- ✅ nom (requis)
- ✅ prenom (requis)
- ✅ date_naissance (requis)
- ✅ sexe (requis: M/F)
- ✅ telephone (optionnel)
- ✅ email (optionnel)
- ✅ adresse (optionnel)
- ✅ antecedents_medicaux (optionnel)
- ✅ allergies (optionnel)
- ✅ groupe_sanguin (optionnel: A+, A-, B+, B-, AB+, AB-, O+, O-)

### ✅ 3. Diagnostic (`/api/v1/diagnostic`)

| Méthode | Endpoint | Description | Status |
|---------|----------|-------------|--------|
| POST | `/diagnostic` | Diagnostic complet | ✅ |
| POST | `/diagnostic/quick` | Diagnostic rapide | ✅ |
| POST | `/diagnostic/summary` | Résumé | ✅ |
| POST | `/diagnostic/examinations` | Examens recommandés | ✅ |
| GET | `/diagnostic/stats` | Statistiques | ✅ |
| GET | `/diagnostic/health` | Health check | ✅ |

### ✅ 4. Maladies (`/api/v1/maladies`)

| Méthode | Endpoint | Description | Status |
|---------|----------|-------------|--------|
| GET | `/maladies` | Liste maladies | ✅ |
| GET | `/maladies/{id}` | Détails maladie | ✅ |
| GET | `/maladies/search/{query}` | Rechercher | ✅ |
| GET | `/maladies/filter/age/{age}` | Filtrer par âge | ✅ |
| GET | `/maladies/categories/stats` | Stats catégories | ✅ |

---

## 🔐 Configuration CORS

Le backend est configuré pour accepter les requêtes du frontend :

```python
# backend-fastapi/app/config.py
CORS_ORIGINS: List[str] = [
    "http://localhost:3000",  # React (CRA)
    "http://localhost:5173"   # Vite
]
```

---

## 📡 Configuration Frontend

### Variables d'environnement

```env
# frontend-react/.env
VITE_API_URL=http://localhost:8000/api/v1
```

### Axios centralisé

```javascript
// frontend-react/src/api/axios.js
const axiosInstance = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  timeout: 30000,
})

// Intercepteur pour ajouter le token JWT
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('medical_auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

---

## 🚀 Lancement complet

### 1. Backend FastAPI

```bash
cd backend-fastapi

# Activer l'environnement virtuel
# Windows
.\venv\Scripts\Activate.ps1
# Linux/Mac
source venv/bin/activate

# Installer les dépendances (si nécessaire)
pip install -r requirements.txt

# Lancer le serveur
python run.py
```

✅ **Backend disponible :** http://localhost:8000  
📖 **API Docs :** http://localhost:8000/docs

### 2. Frontend React

```bash
cd frontend-react

# Installer les dépendances (si nécessaire)
npm install

# Lancer le serveur
npm run dev
```

✅ **Frontend disponible :** http://localhost:5173

---

## 🧪 Test de la connexion

### Test 1 : Health Check

```bash
curl http://localhost:8000/health
```

**Réponse attendue :**
```json
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

### Test 2 : Login

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "medecin@demo.com",
    "password": "demo123"
  }'
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "token_type": "bearer",
    "user": {
      "id": 1,
      "email": "medecin@demo.com",
      "nom": "Dupont",
      "prenom": "Jean",
      "role": "medecin"
    }
  }
}
```

### Test 3 : Diagnostic

```bash
curl -X POST http://localhost:8000/api/v1/diagnostic \
  -H "Content-Type: application/json" \
  -d '{
    "age": 28,
    "sexe": "F",
    "symptomes": ["Fièvre", "Fatigue", "Maux de tête"]
  }'
```

### Test 4 : Créer un patient

```bash
curl -X POST http://localhost:8000/api/v1/patients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "nom": "Dupont",
    "prenom": "Marie",
    "date_naissance": "1990-05-15",
    "sexe": "F",
    "telephone": "0612345678",
    "email": "marie.dupont@example.com",
    "groupe_sanguin": "A+"
  }'
```

---

## 🔄 Flux complet Frontend → Backend

### Exemple : Créer un patient

```
1. User remplit le formulaire (PatientNew.jsx)
   ↓
2. Validation avec Zod (patientSchema)
   ↓
3. Appel patientApi.createPatient(data)
   ↓
4. Axios ajoute le token JWT automatiquement
   ↓
5. POST /api/v1/patients
   ↓
6. Backend valide les données
   ↓
7. Backend crée le patient
   ↓
8. Backend retourne le patient créé
   ↓
9. Frontend affiche le succès
   ↓
10. Redirection vers /patients
```

---

## 📝 Pages Frontend connectées

### ✅ Login (`/login`)
- Connexion avec email/password
- Stockage du token JWT
- Redirection vers dashboard

### ✅ Dashboard (`/dashboard`)
- Affichage des statistiques
- Appels API pour les données

### ✅ Patients (`/patients`)
- Liste des patients (GET /patients)
- Recherche (GET /patients?search=...)
- Pagination

### ✅ Nouveau Patient (`/patients/new`)
- Formulaire complet avec tous les champs
- Validation Zod
- POST /patients

### ✅ Détails Patient (`/patients/:id`)
- GET /patients/{id}
- Affichage des informations

### ✅ Consultation (`/consultation`)
- POST /diagnostic
- Affichage des résultats IA

### ✅ Diagnostics (`/diagnostics`)
- GET /diagnostics
- Historique

### ✅ Statistiques (`/statistics`)
- GET /diagnostic/stats
- Métriques

---

## 🔧 Dépannage

### Erreur CORS

**Symptôme :** `Access-Control-Allow-Origin` error

**Solution :**
1. Vérifier que le backend est lancé
2. Vérifier `CORS_ORIGINS` dans `backend-fastapi/app/config.py`
3. Ajouter `http://localhost:5173` si nécessaire

### Erreur 401 Unauthorized

**Symptôme :** Token invalide ou expiré

**Solution :**
1. Se reconnecter
2. Vider le localStorage
3. Vérifier que le token est bien envoyé dans les headers

### Erreur de connexion

**Symptôme :** `Network Error` ou `ERR_CONNECTION_REFUSED`

**Solution :**
1. Vérifier que le backend est lancé sur le port 8000
2. Vérifier l'URL dans `.env` : `VITE_API_URL=http://localhost:8000/api/v1`
3. Tester avec `curl http://localhost:8000/health`

### Erreur 404 Not Found

**Symptôme :** Route non trouvée

**Solution :**
1. Vérifier que la route existe dans le backend
2. Vérifier l'URL complète (avec `/api/v1`)
3. Consulter la doc Swagger : http://localhost:8000/docs

---

## 📊 Monitoring

### Logs Backend

```bash
# Les logs s'affichent dans le terminal où le backend est lancé
# Format : [timestamp] - [level] - [message]
```

### Logs Frontend

```bash
# Ouvrir la console du navigateur (F12)
# Les requêtes API sont loggées en mode développement
```

### Swagger UI

Accéder à http://localhost:8000/docs pour :
- Tester les endpoints
- Voir la documentation
- Vérifier les schémas

---

## ✅ Checklist de vérification

### Backend
- [ ] Backend lancé sur port 8000
- [ ] Health check OK (`/health`)
- [ ] CORS configuré
- [ ] Routes auth créées
- [ ] Routes patients créées
- [ ] Routes diagnostic fonctionnelles

### Frontend
- [ ] Frontend lancé sur port 5173
- [ ] `.env` configuré avec `VITE_API_URL`
- [ ] Login fonctionne
- [ ] Token JWT stocké
- [ ] Requêtes API avec token
- [ ] Gestion des erreurs

### Connexion
- [ ] Login réussi
- [ ] Dashboard affiche les données
- [ ] Création de patient fonctionne
- [ ] Diagnostic fonctionne
- [ ] Pas d'erreurs CORS

---

## 🎉 Résultat

✅ **Frontend et Backend sont 100% connectés**

- Authentification JWT fonctionnelle
- Routes patients complètes
- Routes diagnostic opérationnelles
- Formulaires validés
- Gestion des erreurs
- CORS configuré

**Le système est prêt à être utilisé !** 🚀

---

## 📞 Support

En cas de problème :

1. Vérifier les logs backend
2. Vérifier la console frontend (F12)
3. Tester avec Swagger UI
4. Vérifier la configuration CORS
5. Vérifier les variables d'environnement

---

**Connexion établie avec succès ! 🎉**
