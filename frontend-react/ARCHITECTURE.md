# 🏗️ Architecture Frontend - MediDiag

## Vue d'ensemble

Application React moderne suivant les principes **SOLID** et les **bonnes pratiques** de développement.

---

## 📐 Principes architecturaux

### 1. Séparation des responsabilités

```
┌─────────────────────────────────────────┐
│           Présentation (UI)             │
│  Components, Pages, Layouts             │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│        Logique métier (Services)        │
│  Context, Hooks, Utils                  │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         Couche données (API)            │
│  Axios, API calls, Data fetching        │
└─────────────────────────────────────────┘
```

### 2. Flux de données unidirectionnel

```
User Action → Component → Service → API → Backend
                ↑                            │
                └────────── Response ────────┘
```

---

## 📁 Structure détaillée

### `/src/api` - Couche API

**Responsabilité** : Communication avec le backend

```javascript
// axios.js - Configuration centralisée
- Instance Axios configurée
- Intercepteurs (request/response)
- Gestion automatique du token JWT
- Gestion des erreurs globales
- Refresh token automatique

// *Api.js - Modules API spécifiques
- authApi.js      → Authentification
- patientApi.js   → Gestion patients
- diagnosticApi.js → Diagnostics IA
- consultationApi.js → Consultations
```

**Avantages** :
- ✅ Centralisation des appels API
- ✅ Réutilisabilité
- ✅ Testabilité
- ✅ Maintenance facilitée

### `/src/components` - Composants réutilisables

#### `/ui` - Composants UI de base

```javascript
Button.jsx    → Bouton avec variants (primary, secondary, danger...)
Input.jsx     → Input avec validation et erreurs
Card.jsx      → Carte conteneur
Alert.jsx     → Messages d'alerte
Badge.jsx     → Badge de statut
Loading.jsx   → Indicateurs de chargement
```

**Principe** : Composants **atomiques** et **réutilisables**

#### `/dashboard` - Composants métier

```javascript
Sidebar.jsx   → Navigation latérale
Navbar.jsx    → Barre de navigation supérieure
```

#### Composants transversaux

```javascript
ProtectedRoute.jsx → Protection des routes authentifiées
```

### `/src/pages` - Pages de l'application

**Responsabilité** : Orchestration des composants

```javascript
Login.jsx          → Authentification
Dashboard.jsx      → Tableau de bord
Patients.jsx       → Liste patients
PatientDetails.jsx → Détails patient
Consultation.jsx   → ⭐ Page principale - Diagnostic IA
Diagnostics.jsx    → Historique diagnostics
Statistics.jsx     → Statistiques
Settings.jsx       → Paramètres
```

**Principe** : Pages = **Containers** qui composent les composants UI

### `/src/layouts` - Layouts

```javascript
DashboardLayout.jsx → Layout principal (Sidebar + Navbar + Content)
AuthLayout.jsx      → Layout authentification (centré, simple)
```

**Principe** : **DRY** - Ne pas répéter la structure

### `/src/context` - Context API

```javascript
AuthContext.jsx → État global authentification
  - user
  - isAuthenticated
  - login()
  - logout()
  - hasRole()
  - hasPermission()
```

**Principe** : État global pour données partagées

### `/src/routes` - Configuration routing

```javascript
AppRoutes.jsx → Configuration centralisée des routes
  - Routes publiques (login)
  - Routes protégées (dashboard, patients...)
  - Redirections
```

### `/src/utils` - Utilitaires

```javascript
constants.js  → Constantes de l'application
helpers.js    → Fonctions utilitaires
validators.js → Schémas de validation Zod
```

**Principe** : **Réutilisabilité** et **maintenabilité**

### `/src/styles` - Styles globaux

```javascript
globals.css → TailwindCSS + classes personnalisées
```

---

## 🔄 Flux de données

### Exemple : Effectuer un diagnostic

```
1. User remplit le formulaire (Consultation.jsx)
   ↓
2. Validation avec Zod (validators.js)
   ↓
3. Appel API via diagnosticApi.performDiagnostic()
   ↓
4. Axios interceptor ajoute le token JWT
   ↓
5. Requête POST vers FastAPI backend
   ↓
6. Backend traite avec IA (ML + Fuzzy)
   ↓
7. Réponse JSON avec diagnostics
   ↓
8. Axios interceptor gère les erreurs
   ↓
9. Mise à jour de l'état local (useState)
   ↓
10. Re-render avec résultats affichés
```

---

## 🔐 Gestion de l'authentification

### Flux d'authentification

```
1. User entre email/password (Login.jsx)
   ↓
2. Validation Zod (loginSchema)
   ↓
3. authApi.login() → POST /auth/login
   ↓
4. Backend retourne { access_token, refresh_token, user }
   ↓
5. Stockage dans localStorage
   ↓
6. Mise à jour AuthContext
   ↓
7. Redirection vers /dashboard
```

### Protection des routes

```javascript
<Route element={
  <ProtectedRoute requiredRole="medecin">
    <Dashboard />
  </ProtectedRoute>
}>
```

**Vérifications** :
1. Token JWT présent ?
2. Token valide ?
3. Rôle autorisé ?
4. Permission accordée ?

### Refresh token automatique

```javascript
// Axios interceptor
if (error.status === 401) {
  // Token expiré
  const newToken = await refreshToken()
  // Retry la requête avec nouveau token
  return axios(originalRequest)
}
```

---

## 📝 Validation des données

### Schémas Zod

```javascript
// validators.js
export const diagnosticSchema = z.object({
  age: z.number().min(0).max(150),
  sexe: z.enum(['M', 'F']),
  symptomes: z.array(z.string()).min(1).max(20),
  analyses: z.record(z.number()).optional()
})
```

### Utilisation avec React Hook Form

```javascript
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(diagnosticSchema)
})
```

**Avantages** :
- ✅ Validation côté client
- ✅ Messages d'erreur automatiques
- ✅ Type-safety
- ✅ Réutilisabilité

---

## 🎨 Système de design

### TailwindCSS + Classes personnalisées

```css
/* Composants */
.btn-primary
.card
.input
.badge

/* États */
.urgence-critique
.urgence-elevee
.urgence-moderee
.urgence-faible
```

### Palette de couleurs

```javascript
primary: {
  50: '#f0f9ff',
  600: '#0ea5e9',  // Couleur principale
  700: '#0369a1',
}

medical: {
  blue: '#0ea5e9',
  green: '#10b981',
  red: '#ef4444',
  orange: '#f59e0b',
}
```

---

## 🧩 Patterns utilisés

### 1. Container/Presentational Pattern

```javascript
// Container (Page)
function Patients() {
  const [patients, setPatients] = useState([])
  // Logique métier
  
  return <PatientList patients={patients} />
}

// Presentational (Component)
function PatientList({ patients }) {
  // Uniquement UI
  return <div>...</div>
}
```

### 2. Custom Hooks Pattern

```javascript
// useAuth.js
export function useAuth() {
  const context = useContext(AuthContext)
  return context
}

// Utilisation
const { user, login } = useAuth()
```

### 3. Compound Components Pattern

```javascript
<Card>
  <CardHeader>
    <CardTitle>Titre</CardTitle>
  </CardHeader>
  <CardContent>
    Contenu
  </CardContent>
</Card>
```

### 4. Render Props Pattern

```javascript
<ProtectedRoute requiredRole="medecin">
  <Dashboard />
</ProtectedRoute>
```

---

## 🚀 Performance

### Optimisations

1. **Lazy Loading**
```javascript
const Dashboard = lazy(() => import('./pages/Dashboard'))
```

2. **Memoization**
```javascript
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b])
```

3. **Debouncing**
```javascript
const debouncedSearch = debounce(handleSearch, 300)
```

4. **Code Splitting**
```javascript
// Vite fait automatiquement
```

---

## 🧪 Testabilité

### Structure testable

```javascript
// Service (testable indépendamment)
export async function performDiagnostic(data) {
  return await diagnosticApi.performDiagnostic(data)
}

// Component (testable avec mocks)
function Consultation() {
  const result = await performDiagnostic(data)
}
```

### Tests recommandés

```javascript
// Unit tests
- Fonctions utilitaires (helpers.js)
- Schémas de validation (validators.js)
- Services API (mocked)

// Integration tests
- Flux d'authentification
- Flux de diagnostic
- Navigation

// E2E tests
- Parcours utilisateur complet
```

---

## 🔧 Extensibilité

### Ajouter une nouvelle page

1. Créer `/src/pages/NewPage.jsx`
2. Ajouter la route dans `/src/routes/AppRoutes.jsx`
3. Ajouter le lien dans `/src/components/dashboard/Sidebar.jsx`

### Ajouter un nouveau module API

1. Créer `/src/api/newApi.js`
2. Exporter les fonctions
3. Utiliser dans les pages/services

### Ajouter un nouveau composant UI

1. Créer `/src/components/ui/NewComponent.jsx`
2. Suivre le pattern des composants existants
3. Utiliser TailwindCSS + cn()

---

## 📊 Métriques de qualité

### Code Quality

- ✅ Séparation des responsabilités
- ✅ Composants réutilisables
- ✅ Validation des données
- ✅ Gestion des erreurs
- ✅ Loading states
- ✅ Responsive design

### Performance

- ✅ Build optimisé (Vite)
- ✅ Code splitting
- ✅ Lazy loading
- ✅ Memoization

### Sécurité

- ✅ Routes protégées
- ✅ Token JWT sécurisé
- ✅ Validation côté client
- ✅ Sanitization des inputs
- ✅ HTTPS en production

---

## 🎯 Bonnes pratiques respectées

### React

- ✅ Composants fonctionnels avec hooks
- ✅ Props destructuring
- ✅ Key prop dans les listes
- ✅ useEffect avec dépendances
- ✅ Éviter les re-renders inutiles

### JavaScript

- ✅ ES6+ moderne
- ✅ Async/await
- ✅ Destructuring
- ✅ Arrow functions
- ✅ Template literals

### CSS

- ✅ TailwindCSS utility-first
- ✅ Responsive design
- ✅ Classes réutilisables
- ✅ Animations fluides

### Architecture

- ✅ SOLID principles
- ✅ DRY (Don't Repeat Yourself)
- ✅ KISS (Keep It Simple, Stupid)
- ✅ Separation of Concerns
- ✅ Single Responsibility

---

## 📚 Ressources

### Documentation

- [React](https://react.dev)
- [Vite](https://vitejs.dev)
- [TailwindCSS](https://tailwindcss.com)
- [React Hook Form](https://react-hook-form.com)
- [Zod](https://zod.dev)
- [Axios](https://axios-http.com)

### Patterns

- [React Patterns](https://reactpatterns.com)
- [JavaScript Patterns](https://www.patterns.dev)

---

## ✅ Checklist qualité

Avant chaque commit :

- [ ] Code formaté et propre
- [ ] Pas de console.log en production
- [ ] Validation des formulaires
- [ ] Gestion des erreurs
- [ ] Loading states
- [ ] Responsive design testé
- [ ] Pas de warnings React
- [ ] Build réussi

---

**Architecture conçue pour être scalable, maintenable et performante** 🚀
