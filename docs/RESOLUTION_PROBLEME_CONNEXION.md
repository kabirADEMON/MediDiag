# Résolution du problème de connexion

## Problème
Le frontend (React) ne peut pas se connecter au backend (FastAPI).
- **Erreur** : `timeout of 30000ms exceeded`
- **Backend** : Fonctionne (http://localhost:8000/docs charge)
- **Frontend** : Envoie la requête mais n'obtient pas de réponse

## Diagnostic

### Étape 1 : Tester l'API directement
1. Aller sur http://localhost:8000/docs
2. Tester POST `/api/v1/auth/login`
3. Body :
```json
{
  "email": "medecin@demo.com",
  "password": "demo123"
}
```

### Étape 2 : Vérifier la configuration

**Frontend (.env)** :
```
VITE_API_URL=http://localhost:8000/api/v1
```

**Backend (CORS)** :
- Doit autoriser `http://localhost:5173`

## Solutions possibles

### Solution 1 : Problème de CORS
Le backend bloque les requêtes du frontend.

**Vérifier** : `backend-fastapi/app/main.py`
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # ← Vérifier cette ligne
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Solution 2 : Problème de port
Le frontend essaie de joindre le mauvais port.

**Vérifier** : 
- Backend écoute sur : `0.0.0.0:8000`
- Frontend appelle : `http://localhost:8000`

### Solution 3 : Firewall/Antivirus
Windows bloque la communication entre les deux serveurs.

**Test** : Désactiver temporairement le pare-feu Windows

### Solution 4 : Redémarrage complet
Parfois un simple redémarrage résout tout.

**Commandes** :
```bash
# Arrêter tout
Ctrl+C dans les deux terminaux

# Relancer backend
cd backend-fastapi
python run.py

# Relancer frontend
cd frontend-react
npm run dev
```

## Test rapide

Dans la console du navigateur (F12), tapez :
```javascript
fetch('http://localhost:8000/api/v1/auth/login', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({email: 'medecin@demo.com', password: 'demo123'})
})
.then(r => r.json())
.then(console.log)
```

Si ça fonctionne → Problème dans le code React
Si ça ne fonctionne pas → Problème CORS ou réseau
