# 🐳 Déploiement avec Docker

Guide pour déployer le système de diagnostic médical avec Docker et Docker Compose.

---

## 📋 Prérequis

- **Docker** 20.10+
- **Docker Compose** 2.0+

### Vérification

```bash
docker --version
docker-compose --version
```

---

## 🚀 Démarrage rapide

### 1. Cloner le projet

```bash
git clone <url-du-repo>
cd <nom-du-projet>
```

### 2. Entraîner le modèle ML (première fois uniquement)

```bash
cd backend-fastapi
python -m venv venv
.\venv\Scripts\Activate.ps1  # Windows
source venv/bin/activate      # Linux/Mac
pip install -r requirements.txt
python train_ml_model.py
cd ..
```

### 3. Démarrer tous les services

```bash
docker-compose up -d
```

**Services démarrés:**
- ✅ Backend FastAPI: http://localhost:8000
- ✅ Frontend React: http://localhost:3000
- ✅ PostgreSQL: localhost:5432
- ✅ API Docs: http://localhost:8000/docs

---

## 📦 Services

### Backend (FastAPI)
- **Port:** 8000
- **Container:** medical-backend
- **Image:** Python 3.10-slim
- **Volumes:** Code + Modèles ML

### Frontend (React)
- **Port:** 3000
- **Container:** medical-frontend
- **Image:** Node 18 + Nginx
- **Build:** Production optimisé

### Database (PostgreSQL)
- **Port:** 5432
- **Container:** medical-postgres
- **Image:** PostgreSQL 14-alpine
- **Volumes:** Données persistantes

---

## 🛠️ Commandes Docker

### Démarrer les services

```bash
# Démarrer en arrière-plan
docker-compose up -d

# Démarrer avec logs
docker-compose up

# Démarrer un service spécifique
docker-compose up -d backend
```

### Arrêter les services

```bash
# Arrêter tous les services
docker-compose down

# Arrêter et supprimer les volumes
docker-compose down -v
```

### Voir les logs

```bash
# Tous les services
docker-compose logs -f

# Service spécifique
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Redémarrer un service

```bash
docker-compose restart backend
docker-compose restart frontend
```

### Rebuild après modification

```bash
# Rebuild tous les services
docker-compose up -d --build

# Rebuild un service spécifique
docker-compose up -d --build backend
```

### Accéder à un container

```bash
# Backend
docker exec -it medical-backend bash

# Frontend
docker exec -it medical-frontend sh

# PostgreSQL
docker exec -it medical-postgres psql -U medical_user -d medical_diagnostic
```

---

## 🔧 Configuration

### Variables d'environnement

Créer un fichier `.env` à la racine:

```env
# Backend
BACKEND_PORT=8000
ENVIRONMENT=production
SECRET_KEY=votre_cle_secrete_production

# Frontend
FRONTEND_PORT=3000
VITE_API_URL=http://localhost:8000/api/v1

# Database
POSTGRES_USER=medical_user
POSTGRES_PASSWORD=medical_password_secure
POSTGRES_DB=medical_diagnostic
POSTGRES_PORT=5432
```

Modifier `docker-compose.yml` pour utiliser ces variables:

```yaml
environment:
  - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
```

---

## 📊 Vérification du déploiement

### 1. Vérifier les containers

```bash
docker-compose ps
```

**Résultat attendu:**
```
NAME                 STATUS    PORTS
medical-backend      Up        0.0.0.0:8000->8000/tcp
medical-frontend     Up        0.0.0.0:3000->3000/tcp
medical-postgres     Up        0.0.0.0:5432->5432/tcp
```

### 2. Tester le backend

```bash
curl http://localhost:8000/health
```

### 3. Tester le frontend

Ouvrir http://localhost:3000 dans le navigateur

### 4. Tester l'API

```bash
curl -X POST http://localhost:8000/api/v1/diagnostic/ \
  -H "Content-Type: application/json" \
  -d '{
    "age": 35,
    "sexe": "M",
    "symptomes": ["Fièvre", "Maux de tête"]
  }'
```

---

## 🔄 Mise à jour

### 1. Arrêter les services

```bash
docker-compose down
```

### 2. Mettre à jour le code

```bash
git pull origin main
```

### 3. Rebuild et redémarrer

```bash
docker-compose up -d --build
```

---

## 💾 Gestion des données

### Backup de la base de données

```bash
# Créer un backup
docker exec medical-postgres pg_dump -U medical_user medical_diagnostic > backup.sql

# Avec compression
docker exec medical-postgres pg_dump -U medical_user medical_diagnostic | gzip > backup.sql.gz
```

### Restaurer la base de données

```bash
# Depuis un fichier SQL
docker exec -i medical-postgres psql -U medical_user -d medical_diagnostic < backup.sql

# Depuis un fichier compressé
gunzip -c backup.sql.gz | docker exec -i medical-postgres psql -U medical_user -d medical_diagnostic
```

### Sauvegarder les modèles ML

```bash
# Copier depuis le container
docker cp medical-backend:/app/app/ml/models ./ml-models-backup

# Restaurer dans le container
docker cp ./ml-models-backup medical-backend:/app/app/ml/models
```

---

## 🔒 Sécurité en production

### 1. Changer les mots de passe

```env
POSTGRES_PASSWORD=mot_de_passe_tres_securise
SECRET_KEY=cle_secrete_aleatoire_longue
```

### 2. Utiliser HTTPS

Ajouter un reverse proxy (Nginx/Traefik) avec SSL:

```yaml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
```

### 3. Limiter les ports exposés

En production, ne pas exposer PostgreSQL:

```yaml
postgres:
  # Supprimer cette ligne:
  # ports:
  #   - "5432:5432"
```

### 4. Utiliser des secrets Docker

```bash
echo "mot_de_passe" | docker secret create postgres_password -
```

---

## 📈 Monitoring

### Voir l'utilisation des ressources

```bash
docker stats
```

### Voir les logs en temps réel

```bash
docker-compose logs -f --tail=100
```

### Inspecter un container

```bash
docker inspect medical-backend
```

---

## 🐛 Dépannage

### Container ne démarre pas

```bash
# Voir les logs d'erreur
docker-compose logs backend

# Vérifier la configuration
docker-compose config
```

### Port déjà utilisé

```bash
# Changer le port dans docker-compose.yml
ports:
  - "8001:8000"  # Au lieu de 8000:8000
```

### Problème de connexion à la base de données

```bash
# Vérifier que PostgreSQL est démarré
docker-compose ps postgres

# Tester la connexion
docker exec -it medical-postgres psql -U medical_user -d medical_diagnostic
```

### Modèle ML non trouvé

```bash
# Copier le modèle dans le container
docker cp backend-fastapi/app/ml/models medical-backend:/app/app/ml/

# Ou redémarrer avec volume
docker-compose down
docker-compose up -d
```

### Rebuild complet

```bash
# Tout supprimer et recommencer
docker-compose down -v
docker system prune -a
docker-compose up -d --build
```

---

## 🚀 Déploiement en production

### 1. Serveur cloud (AWS, Azure, GCP)

```bash
# Sur le serveur
git clone <url-du-repo>
cd <nom-du-projet>

# Configurer les variables d'environnement
nano .env

# Démarrer
docker-compose -f docker-compose.prod.yml up -d
```

### 2. Avec Docker Swarm

```bash
docker swarm init
docker stack deploy -c docker-compose.yml medical-stack
```

### 3. Avec Kubernetes

Créer les manifests Kubernetes (voir `k8s/` directory)

```bash
kubectl apply -f k8s/
```

---

## 📊 Architecture Docker

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Network                       │
│                   (medical-network)                     │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │   Frontend   │  │   Backend    │  │  PostgreSQL │ │
│  │   (React)    │  │  (FastAPI)   │  │             │ │
│  │              │  │              │  │             │ │
│  │  Port: 3000  │  │  Port: 8000  │  │ Port: 5432  │ │
│  │              │  │              │  │             │ │
│  │  Nginx       │  │  Uvicorn     │  │  PG 14      │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘ │
│         │                 │                  │        │
│         └─────────────────┴──────────────────┘        │
│                                                        │
└────────────────────────────────────────────────────────┘
         │                  │                  │
         ▼                  ▼                  ▼
    Volume:            Volume:            Volume:
    (none)         ml-models/        postgres-data/
```

---

## ✅ Checklist de déploiement

- [ ] Docker et Docker Compose installés
- [ ] Modèle ML entraîné
- [ ] Variables d'environnement configurées
- [ ] Mots de passe changés (production)
- [ ] `docker-compose up -d` exécuté
- [ ] Backend accessible (port 8000)
- [ ] Frontend accessible (port 3000)
- [ ] Base de données initialisée
- [ ] Tests API passent
- [ ] Logs vérifiés
- [ ] Backup configuré (production)
- [ ] Monitoring configuré (production)

---

## 📞 Support

Pour les problèmes Docker:
1. Vérifier les logs: `docker-compose logs`
2. Vérifier la configuration: `docker-compose config`
3. Consulter la documentation Docker
4. Créer une issue GitHub

---

**Déploiement Docker réussi! 🎉**
