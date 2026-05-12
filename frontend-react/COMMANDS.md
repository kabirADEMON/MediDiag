# 📝 Commandes essentielles - Frontend React

## 🚀 Installation

```bash
# Se placer dans le dossier frontend
cd frontend-react

# Installer toutes les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env
```

---

## 🏃 Développement

```bash
# Lancer le serveur de développement
npm run dev

# L'application sera disponible sur :
# http://localhost:5173
```

**Features en mode dev :**
- ✅ Hot reload automatique
- ✅ Fast refresh
- ✅ Source maps
- ✅ Logs détaillés

---

## 🏗️ Build

```bash
# Build pour la production
npm run build

# Les fichiers seront dans /dist
```

**Optimisations automatiques :**
- ✅ Minification
- ✅ Tree shaking
- ✅ Code splitting
- ✅ Asset optimization

---

## 👀 Preview

```bash
# Prévisualiser le build de production
npm run preview

# Serveur de preview sur :
# http://localhost:4173
```

---

## 🧹 Linting

```bash
# Vérifier le code avec ESLint
npm run lint

# Fix automatique des erreurs
npm run lint -- --fix
```

---

## 📦 Gestion des dépendances

```bash
# Installer une nouvelle dépendance
npm install <package-name>

# Installer une dépendance de développement
npm install -D <package-name>

# Mettre à jour les dépendances
npm update

# Vérifier les dépendances obsolètes
npm outdated

# Nettoyer node_modules et réinstaller
rm -rf node_modules package-lock.json
npm install
```

---

## 🔧 Configuration

### Variables d'environnement

Éditer `.env` :

```env
# API Backend
VITE_API_URL=http://localhost:8000/api/v1

# Environment
VITE_ENV=development

# Application
VITE_APP_NAME=MediDiag
VITE_APP_VERSION=1.0.0
```

### Changer le port

Éditer `vite.config.js` :

```javascript
server: {
  port: 3000, // Votre port
  host: true,
}
```

---

## 🐛 Dépannage

### Erreur : Port déjà utilisé

```bash
# Tuer le processus sur le port 5173
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5173 | xargs kill -9
```

### Erreur : Module non trouvé

```bash
# Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install
```

### Erreur : Build échoue

```bash
# Nettoyer le cache
rm -rf dist .vite node_modules/.vite
npm run build
```

### Erreur : Connexion API

1. Vérifier que le backend est lancé
2. Vérifier l'URL dans `.env`
3. Vérifier les CORS sur le backend
4. Vérifier le réseau (firewall, proxy)

---

## 🧪 Tests (à implémenter)

```bash
# Lancer les tests unitaires
npm run test

# Tests en mode watch
npm run test:watch

# Coverage
npm run test:coverage

# Tests E2E
npm run test:e2e
```

---

## 📊 Analyse du bundle

```bash
# Analyser la taille du bundle
npm run build
npx vite-bundle-visualizer
```

---

## 🚀 Déploiement

### Build production

```bash
npm run build
```

### Déployer sur Vercel

```bash
npm install -g vercel
vercel
```

### Déployer sur Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod
```

### Déployer avec Docker

```bash
# Build l'image
docker build -t medidiag-frontend .

# Lancer le conteneur
docker run -p 3000:3000 medidiag-frontend
```

---

## 🔄 Git

```bash
# Initialiser git (si pas déjà fait)
git init

# Ajouter tous les fichiers
git add .

# Commit
git commit -m "feat: refonte complète du frontend React"

# Push
git push origin main
```

---

## 📝 Scripts personnalisés

Ajouter dans `package.json` :

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext js,jsx",
    "lint:fix": "eslint . --ext js,jsx --fix",
    "format": "prettier --write \"src/**/*.{js,jsx,json,css,md}\"",
    "clean": "rm -rf dist node_modules/.vite",
    "reinstall": "rm -rf node_modules package-lock.json && npm install"
  }
}
```

---

## 🎯 Workflow recommandé

### Développement quotidien

```bash
# 1. Mettre à jour le code
git pull

# 2. Installer les nouvelles dépendances (si nécessaire)
npm install

# 3. Lancer le serveur de développement
npm run dev

# 4. Développer...

# 5. Vérifier le code
npm run lint

# 6. Commit et push
git add .
git commit -m "feat: nouvelle fonctionnalité"
git push
```

### Avant un déploiement

```bash
# 1. Vérifier le code
npm run lint

# 2. Build production
npm run build

# 3. Tester le build
npm run preview

# 4. Si OK, déployer
# (commandes selon votre plateforme)
```

---

## 🔑 Raccourcis utiles

### Terminal

```bash
# Ctrl + C : Arrêter le serveur
# Ctrl + L : Nettoyer le terminal
# Ctrl + R : Rechercher dans l'historique
```

### VS Code

```bash
# Ctrl + ` : Ouvrir/fermer le terminal
# Ctrl + P : Recherche rapide de fichiers
# Ctrl + Shift + P : Palette de commandes
# Ctrl + B : Toggle sidebar
```

---

## 📚 Ressources

### Documentation

- [Vite](https://vitejs.dev)
- [React](https://react.dev)
- [TailwindCSS](https://tailwindcss.com)
- [React Router](https://reactrouter.com)
- [Axios](https://axios-http.com)

### Outils recommandés

- **VS Code** - Éditeur
- **React DevTools** - Extension Chrome
- **Postman** - Test API
- **Git** - Versioning

---

## ⚡ Commandes rapides

```bash
# Installation complète
npm install

# Développement
npm run dev

# Build
npm run build

# Preview
npm run preview

# Lint
npm run lint
```

---

## 🎉 C'est tout !

Vous êtes prêt à développer ! 🚀

Pour plus d'informations, consultez :
- [README.md](README.md)
- [QUICKSTART.md](QUICKSTART.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
