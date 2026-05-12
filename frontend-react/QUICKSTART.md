# ⚡ Guide de démarrage rapide - Frontend React

## 🚀 Installation en 5 minutes

### Étape 1 : Prérequis

Vérifiez que vous avez :
```bash
node --version  # v16 ou supérieur
npm --version   # v8 ou supérieur
```

### Étape 2 : Installation

```bash
cd frontend-react

# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env
```

### Étape 3 : Configuration

Éditez `.env` :
```env
VITE_API_URL=http://localhost:8000/api/v1
```

### Étape 4 : Lancement

```bash
npm run dev
```

✅ **Application disponible sur** : http://localhost:5173

---

## 🎯 Premiers pas

### 1. Connexion

Utilisez un compte de démonstration :

```
Email: medecin@demo.com
Password: demo123
```

### 2. Explorer le dashboard

- Vue d'ensemble de l'activité
- Statistiques rapides
- Actions rapides

### 3. Effectuer un diagnostic

1. Aller sur **Consultation**
2. Remplir les informations patient
3. Ajouter des symptômes
4. (Optionnel) Ajouter des analyses biologiques
5. Cliquer sur **Lancer le diagnostic**
6. Voir les résultats avec scores et recommandations

---

## 📁 Structure rapide

```
src/
├── api/          → Appels API
├── components/   → Composants réutilisables
├── pages/        → Pages de l'application
├── context/      → État global (Auth)
├── utils/        → Utilitaires
└── styles/       → Styles globaux
```

---

## 🔑 Fonctionnalités principales

### ✅ Authentification
- Login/Logout
- Routes protégées
- Gestion des rôles

### ✅ Gestion des patients
- Liste des patients
- Recherche et filtres
- Détails patient
- Historique

### ✅ Diagnostic IA
- Saisie des symptômes
- Analyses biologiques
- Résultats en temps réel
- Scores de probabilité
- Recommandations d'examens
- Niveaux d'urgence

### ✅ Statistiques
- Métriques d'activité
- Graphiques
- Analyses

---

## 🛠️ Commandes utiles

```bash
# Développement
npm run dev

# Build production
npm run build

# Preview production
npm run preview

# Linter
npm run lint
```

---

## 🔧 Configuration API

### Backend local

```env
VITE_API_URL=http://localhost:8000/api/v1
```

### Backend distant

```env
VITE_API_URL=https://api.medidiag.com/api/v1
```

---

## 📝 Exemple d'utilisation

### Effectuer un diagnostic

```javascript
import * as diagnosticApi from '@/api/diagnosticApi'

const response = await diagnosticApi.performDiagnostic({
  age: 28,
  sexe: 'F',
  symptomes: ['Fièvre', 'Fatigue', 'Maux de tête'],
  analyses: {
    hemoglobine: 12.5,
    leucocytes: 7000
  }
})

if (response.success) {
  console.log(response.data.diagnostics)
}
```

---

## 🎨 Personnalisation

### Modifier les couleurs

Éditez `tailwind.config.js` :

```javascript
colors: {
  primary: {
    600: '#0ea5e9', // Votre couleur
  }
}
```

### Ajouter une page

1. Créer `src/pages/MaPage.jsx`
2. Ajouter la route dans `src/routes/AppRoutes.jsx`
3. Ajouter le lien dans `src/components/dashboard/Sidebar.jsx`

---

## 🐛 Dépannage

### Port déjà utilisé

```bash
# Changer le port dans vite.config.js
server: {
  port: 3000
}
```

### Erreur de connexion API

1. Vérifier que le backend est lancé
2. Vérifier l'URL dans `.env`
3. Vérifier les CORS sur le backend

### Erreur d'authentification

1. Vérifier les credentials
2. Vérifier le token JWT
3. Vider le localStorage

---

## 📚 Documentation complète

- [README.md](README.md) - Documentation complète
- [ARCHITECTURE.md](ARCHITECTURE.md) - Architecture détaillée
- [API Backend](http://localhost:8000/docs) - Documentation API

---

## 🎯 Prochaines étapes

1. ✅ Explorer toutes les pages
2. ✅ Tester le diagnostic IA
3. ✅ Ajouter des patients
4. ✅ Consulter les statistiques
5. ✅ Personnaliser l'interface

---

## 💡 Astuces

### Raccourcis clavier

- `Ctrl + K` - Recherche rapide (à implémenter)
- `Ctrl + /` - Aide (à implémenter)

### Mode développement

- Hot reload automatique
- Logs dans la console
- React DevTools recommandé

### Performance

- Build optimisé avec Vite
- Code splitting automatique
- Lazy loading des pages

---

## ⚠️ Important

Cette application est un **outil d'aide à la décision médicale**.

**Ne remplace pas** :
- Une consultation médicale
- Un diagnostic professionnel
- Un traitement médical

**Toujours consulter un professionnel de santé qualifié.**

---

## 🤝 Support

Besoin d'aide ?

1. Consulter la [documentation](README.md)
2. Vérifier les [issues GitHub](../../issues)
3. Créer une nouvelle issue

---

**Bon développement ! 🚀**
