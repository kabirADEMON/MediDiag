# 🏥 MediDiag Frontend - React Application

Application React moderne pour le système de diagnostic médical intelligent.

## 🚀 Technologies

- **React 18** - Framework UI
- **Vite** - Build tool ultra-rapide
- **React Router DOM** - Routing
- **Axios** - Client HTTP
- **React Hook Form** - Gestion des formulaires
- **Zod** - Validation de schémas
- **TailwindCSS** - Styling moderne
- **Lucide React** - Icônes
- **date-fns** - Manipulation de dates

## 📦 Installation

### Prérequis

- Node.js 16+ 
- npm ou yarn

### Étapes d'installation

```bash
# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env

# Configurer l'URL de l'API dans .env
VITE_API_URL=http://localhost:8000/api/v1
```

## 🏃 Lancement

### Mode développement

```bash
npm run dev
```

L'application sera disponible sur : **http://localhost:5173**

### Build production

```bash
npm run build
```

### Preview production

```bash
npm run preview
```

## 📁 Structure du projet

```
frontend-react/
├── src/
│   ├── api/                    # Couche API (Axios)
│   │   ├── axios.js            # Configuration Axios
│   │   ├── authApi.js          # API authentification
│   │   ├── patientApi.js       # API patients
│   │   ├── diagnosticApi.js    # API diagnostics
│   │   └── consultationApi.js  # API consultations
│   │
│   ├── components/             # Composants réutilisables
│   │   ├── ui/                 # Composants UI de base
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Alert.jsx
│   │   │   ├── Badge.jsx
│   │   │   └── Loading.jsx
│   │   ├── dashboard/          # Composants dashboard
│   │   │   ├── Sidebar.jsx
│   │   │   └── Navbar.jsx
│   │   └── ProtectedRoute.jsx  # Route protégée
│   │
│   ├── pages/                  # Pages principales
│   │   ├── Login.jsx           # Page de connexion
│   │   ├── Dashboard.jsx       # Tableau de bord
│   │   ├── Patients.jsx        # Liste patients
│   │   ├── PatientDetails.jsx  # Détails patient
│   │   ├── Consultation.jsx    # Consultation médicale
│   │   ├── Diagnostics.jsx     # Historique diagnostics
│   │   ├── Statistics.jsx      # Statistiques
│   │   └── Settings.jsx        # Paramètres
│   │
│   ├── layouts/                # Layouts
│   │   ├── DashboardLayout.jsx # Layout principal
│   │   └── AuthLayout.jsx      # Layout authentification
│   │
│   ├── context/                # Context API
│   │   └── AuthContext.jsx     # Contexte authentification
│   │
│   ├── routes/                 # Configuration routes
│   │   └── AppRoutes.jsx       # Routes de l'application
│   │
│   ├── utils/                  # Utilitaires
│   │   ├── constants.js        # Constantes
│   │   ├── helpers.js          # Fonctions utilitaires
│   │   └── validators.js       # Schémas de validation Zod
│   │
│   ├── styles/                 # Styles globaux
│   │   └── globals.css         # CSS global + Tailwind
│   │
│   ├── App.jsx                 # Composant racine
│   └── main.jsx                # Point d'entrée
│
├── public/                     # Fichiers statiques
├── index.html                  # HTML principal
├── vite.config.js              # Configuration Vite
├── tailwind.config.js          # Configuration Tailwind
├── postcss.config.js           # Configuration PostCSS
├── jsconfig.json               # Configuration JS (alias @/)
├── package.json                # Dépendances
└── README.md                   # Ce fichier
```

## 🎨 Architecture

### Couche API (Axios)

Toutes les requêtes HTTP passent par la couche API centralisée :

```javascript
import * as diagnosticApi from '@/api/diagnosticApi'

const response = await diagnosticApi.performDiagnostic(data)
```

**Fonctionnalités :**
- Intercepteurs pour ajouter le token JWT automatiquement
- Gestion centralisée des erreurs
- Refresh token automatique
- Logging en développement

### Authentification (Context API)

```javascript
import { useAuth } from '@/context/AuthContext'

const { user, login, logout, isAuthenticated } = useAuth()
```

**Fonctionnalités :**
- Gestion de l'état utilisateur
- Stockage sécurisé du token JWT
- Vérification des rôles et permissions
- Routes protégées

### Validation (Zod + React Hook Form)

```javascript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema } from '@/utils/validators'

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(loginSchema)
})
```

### Composants UI réutilisables

```javascript
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'

<Button variant="primary" loading={loading}>
  Enregistrer
</Button>
```

## 🔐 Authentification

### Connexion

```javascript
const { login } = useAuth()

const result = await login({
  email: 'medecin@example.com',
  password: 'password123'
})

if (result.success) {
  navigate('/dashboard')
}
```

### Routes protégées

```javascript
<Route
  element={
    <ProtectedRoute requiredRole="medecin">
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

## 📡 Connexion avec l'API Backend

### Configuration

L'URL de l'API est configurée dans `.env` :

```env
VITE_API_URL=http://localhost:8000/api/v1
```

### Exemple d'appel API

```javascript
// Effectuer un diagnostic
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

## 🎯 Pages principales

### 1. Dashboard (`/dashboard`)
- Vue d'ensemble de l'activité
- Statistiques rapides
- Actions rapides
- État du système

### 2. Patients (`/patients`)
- Liste des patients
- Recherche et filtres
- Ajout/modification/suppression
- Pagination

### 3. Consultation (`/consultation`)
- **Page principale du système**
- Saisie des symptômes
- Saisie des analyses biologiques
- Lancement du diagnostic IA
- Affichage des résultats
- Scores de probabilité
- Recommandations d'examens
- Niveaux d'urgence

### 4. Diagnostics (`/diagnostics`)
- Historique des diagnostics
- Détails des résultats
- Filtres et recherche

### 5. Statistiques (`/statistics`)
- Graphiques d'activité
- Métriques de performance
- Analyses avancées

### 6. Paramètres (`/settings`)
- Profil utilisateur
- Notifications
- Sécurité
- Informations système

## 🎨 Styling (TailwindCSS)

### Classes utilitaires personnalisées

```css
/* Boutons */
.btn-primary
.btn-secondary
.btn-danger
.btn-success

/* Cartes */
.card
.card-hover

/* Inputs */
.input
.input-error

/* Badges */
.badge
.badge-success
.badge-warning
.badge-danger

/* Urgence médicale */
.urgence-critique
.urgence-elevee
.urgence-moderee
.urgence-faible
```

### Palette de couleurs

```javascript
primary: '#0ea5e9'  // Bleu médical
success: '#10b981'  // Vert
warning: '#f59e0b'  // Orange
danger: '#ef4444'   // Rouge
```

## 🔧 Utilitaires

### Helpers

```javascript
import { formatDate, calculateAge, getUrgencyColor } from '@/utils/helpers'

formatDate('2024-01-15')           // "15/01/2024"
calculateAge('1990-05-20')         // 34
getUrgencyColor('critique')        // "bg-red-100 text-red-800..."
```

### Constantes

```javascript
import { USER_ROLES, URGENCY_LEVELS, API_CONFIG } from '@/utils/constants'

USER_ROLES.DOCTOR      // "medecin"
URGENCY_LEVELS.ELEVEE  // "élevée"
API_CONFIG.BASE_URL    // "http://localhost:8000/api/v1"
```

## 🧪 Comptes de démonstration

```
👨‍⚕️ Médecin
Email: medecin@demo.com
Password: demo123

👩‍⚕️ Infirmier
Email: infirmier@demo.com
Password: demo123

👨‍💼 Administrateur
Email: admin@demo.com
Password: demo123
```

## 📝 Bonnes pratiques

### 1. Composants

- Composants fonctionnels avec hooks
- Props typées avec PropTypes ou TypeScript
- Composants réutilisables dans `/components/ui`
- Séparation logique/présentation

### 2. État

- Context API pour l'état global
- useState pour l'état local
- useEffect pour les effets de bord
- Custom hooks pour la logique réutilisable

### 3. API

- Toujours passer par la couche API
- Gestion des erreurs avec try/catch
- Loading states pour UX
- Messages d'erreur utilisateur-friendly

### 4. Sécurité

- Routes protégées
- Validation côté client (Zod)
- Sanitization des inputs
- Token JWT sécurisé
- HTTPS en production

## 🚀 Déploiement

### Build

```bash
npm run build
```

Les fichiers de production seront dans `/dist`

### Variables d'environnement production

```env
VITE_API_URL=https://api.medidiag.com/api/v1
VITE_ENV=production
```

## 📚 Documentation API

La documentation complète de l'API backend est disponible sur :
- **Swagger UI** : http://localhost:8000/docs
- **ReDoc** : http://localhost:8000/redoc

## ⚠️ Avertissement médical

Cette application est un **outil d'aide à la décision médicale** et ne remplace pas :
- Une consultation médicale professionnelle
- Un diagnostic médical
- Un traitement médical

**Toujours consulter un professionnel de santé qualifié.**

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Projet académique - Mémoire universitaire

## 👨‍💻 Support

Pour toute question ou problème :
1. Consulter la documentation
2. Vérifier les issues GitHub
3. Créer une nouvelle issue

---

**Développé avec React et ❤️ pour améliorer le diagnostic médical**
