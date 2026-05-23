# 🔍 Système d'Autocomplétion - Symptômes et Analyses

## 📋 Vue d'ensemble

Le système d'autocomplétion permet aux médecins de saisir rapidement les symptômes et analyses biologiques en proposant des suggestions basées sur le dataset de 1000 maladies.

## ✨ Fonctionnalités

### 1. Autocomplétion des Symptômes
- **822 symptômes uniques** extraits du dataset
- **Recherche en temps réel** : filtrage instantané pendant la saisie
- **Navigation clavier** : flèches haut/bas, Entrée, Échap
- **Ajout personnalisé** : possibilité d'ajouter un symptôme non listé
- **Affichage visuel** : badges cliquables pour retirer un symptôme

### 2. Autocomplétion des Analyses
- **Analyses biologiques** avec unités et valeurs normales
- **Métadonnées enrichies** : unité de mesure, plage normale
- **Saisie de valeurs** : champ numérique pour chaque analyse
- **Analyses populaires** : suggestions basées sur la fréquence

## 🔧 Architecture Technique

### Backend - Endpoints API

#### 1. GET /api/v1/metadata/symptoms
Retourne tous les symptômes uniques du dataset.

**Paramètres** :
- `search` (optionnel) : filtre les symptômes

**Réponse** :
```json
{
  "success": true,
  "message": "822 symptôme(s) trouvé(s)",
  "data": {
    "symptoms": [
      "Fièvre",
      "Toux",
      "Douleur abdominale",
      ...
    ],
    "total": 822
  }
}
```

#### 2. GET /api/v1/metadata/symptoms/popular
Retourne les symptômes les plus fréquents.

**Paramètres** :
- `limit` (défaut: 20) : nombre de symptômes à retourner

**Réponse** :
```json
{
  "success": true,
  "data": {
    "symptoms": [
      {"name": "Fièvre", "count": 450},
      {"name": "Toux", "count": 380},
      ...
    ]
  }
}
```

#### 3. GET /api/v1/metadata/analyses
Retourne toutes les analyses biologiques.

**Réponse** :
```json
{
  "success": true,
  "data": {
    "analyses": [
      {
        "name": "Hémoglobine",
        "unit": "g/dL",
        "normal_range": "12-16"
      },
      {
        "name": "Glycémie",
        "unit": "g/L",
        "normal_range": "0.7-1.1"
      },
      ...
    ]
  }
}
```

#### 4. GET /api/v1/metadata/analyses/popular
Retourne les analyses les plus fréquentes.

### Frontend - Composants

#### Composant Autocomplete
**Fichier** : `frontend-react/src/components/ui/Autocomplete.jsx`

**Props** :
```javascript
{
  label: string,              // Label du champ
  placeholder: string,        // Texte placeholder
  suggestions: string[],      // Liste des suggestions
  onSelect: (value) => void,  // Callback lors de la sélection
  loading: boolean,           // État de chargement
  error: string,              // Message d'erreur
  helperText: string,         // Texte d'aide
  required: boolean           // Champ requis
}
```

**Fonctionnalités** :
- ✅ Filtrage en temps réel (case-insensitive)
- ✅ Navigation clavier (↑↓ Enter Esc)
- ✅ Clic en dehors pour fermer
- ✅ Ajout de valeur personnalisée (Enter sans sélection)
- ✅ Bouton de réinitialisation (X)
- ✅ Indicateur de chargement
- ✅ Message "Aucune suggestion"

#### Intégration dans Consultation.jsx

**Chargement des suggestions** :
```javascript
const loadSuggestions = async () => {
  const [symptomsResponse, analysesResponse] = await Promise.all([
    metadataApi.getSymptoms(),
    metadataApi.getAnalyses(),
  ])

  if (symptomsResponse.success && symptomsResponse.data) {
    const symptoms = symptomsResponse.data.data.symptoms || []
    setSymptomsSuggestions(symptoms)
  }

  if (analysesResponse.success && analysesResponse.data) {
    const analyses = analysesResponse.data.data.analyses || []
    const analysesNames = analyses.map(a => a.name)
    setAnalysesSuggestions(analysesNames)
  }
}
```

**Gestion des symptômes** :
```javascript
const addSymptom = (symptom) => {
  if (symptom && !symptoms.includes(symptom)) {
    const newSymptoms = [...symptoms, symptom]
    setSymptoms(newSymptoms)
    setValue('symptomes', newSymptoms)
  }
}

const removeSymptom = (symptom) => {
  const newSymptoms = symptoms.filter((s) => s !== symptom)
  setSymptoms(newSymptoms)
  setValue('symptomes', newSymptoms)
}
```

**Gestion des analyses** :
```javascript
const addAnalysis = (analysisName) => {
  if (analysisName && !analyses[analysisName]) {
    setAnalyses({ ...analyses, [analysisName]: '' })
  }
}

const updateAnalysisValue = (analysisName, value) => {
  const newAnalyses = { ...analyses, [analysisName]: parseFloat(value) || 0 }
  setAnalyses(newAnalyses)
  setValue('analyses', newAnalyses)
}

const removeAnalysis = (analysisName) => {
  const newAnalyses = { ...analyses }
  delete newAnalyses[analysisName]
  setAnalyses(newAnalyses)
  setValue('analyses', newAnalyses)
}
```

## 📊 Extraction des Données

### Processus d'Extraction (Backend)

**Fichier** : `backend-fastapi/app/routes/metadata.py`

**Symptômes** :
```python
# Colonnes de symptômes dans le dataset
symptom_columns = ['Symptôme_1', 'Symptôme_2', ..., 'Symptôme_9']

# Extraction
all_symptoms = set()
for col in symptom_columns:
    symptoms = dataset_loader.df[col].dropna().unique()
    all_symptoms.update(symptoms)

symptoms_list = sorted(list(all_symptoms))
```

**Analyses** :
```python
# Colonnes d'analyses dans le dataset
analysis_columns = ['Analyse_1', 'Analyse_2', ..., 'Analyse_9']

# Extraction avec métadonnées
common_analyses = {
    'Hémoglobine': {'unit': 'g/dL', 'normal_range': '12-16'},
    'Glycémie': {'unit': 'g/L', 'normal_range': '0.7-1.1'},
    ...
}
```

## 🎨 Interface Utilisateur

### Champ Symptômes
```
┌─────────────────────────────────────────┐
│ Ajouter un symptôme                     │
│ [🔍 Rechercher un symptôme...      [X]] │
│ ┌─────────────────────────────────────┐ │
│ │ Fièvre                              │ │
│ │ Fièvre élevée                       │ │
│ │ Fièvre modérée                      │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Fièvre ×] [Toux ×] [Douleur ×]        │
└─────────────────────────────────────────┘
```

### Champ Analyses
```
┌─────────────────────────────────────────┐
│ Ajouter une analyse                     │
│ [🔍 Rechercher une analyse...      [X]] │
│                                         │
│ Hémoglobine                             │
│ [12.5] g/dL (Normal: 12-16)        [×] │
│                                         │
│ Glycémie                                │
│ [1.2] g/L (Normal: 0.7-1.1)        [×] │
└─────────────────────────────────────────┘
```

## 🔑 Navigation Clavier

| Touche | Action |
|--------|--------|
| **↓** | Suggestion suivante |
| **↑** | Suggestion précédente |
| **Enter** | Sélectionner la suggestion active ou ajouter la valeur saisie |
| **Esc** | Fermer les suggestions |
| **Tab** | Passer au champ suivant |

## 🐛 Résolution de Problèmes

### Problème : Aucune suggestion n'apparaît

**Causes possibles** :
1. ❌ Backend non démarré
2. ❌ Erreur de structure de réponse
3. ❌ CORS bloqué

**Solution** :
```javascript
// Vérifier dans la console du navigateur (F12)
console.log('Symptoms Response:', symptomsResponse)
console.log('Loaded symptoms:', symptoms.length)

// Devrait afficher :
// ✅ Loaded symptoms: 822
```

### Problème : Suggestions incorrectes

**Cause** : Structure de réponse axios

**Solution** :
```javascript
// ❌ Incorrect
const symptoms = symptomsResponse.data.symptoms

// ✅ Correct
const backendData = symptomsResponse.data.data
const symptoms = backendData.symptoms
```

### Problème : Recherche lente

**Optimisation** :
- Utiliser `useMemo` pour filtrer les suggestions
- Limiter le nombre de suggestions affichées
- Ajouter un debounce sur la saisie

## 📈 Statistiques

### Dataset
- **822 symptômes uniques**
- **~150 analyses biologiques**
- **1000 maladies**
- **9 colonnes de symptômes par maladie**
- **9 colonnes d'analyses par maladie**

### Performance
- **Temps de chargement** : < 1 seconde
- **Filtrage** : Instantané (< 50ms)
- **Taille des données** : ~200 KB (symptômes + analyses)

## 🚀 Améliorations Futures

- [ ] **Cache côté client** : localStorage pour éviter de recharger
- [ ] **Recherche floue** : tolérance aux fautes de frappe
- [ ] **Synonymes** : "température" → "fièvre"
- [ ] **Catégories** : grouper les symptômes par système
- [ ] **Historique** : suggestions basées sur l'historique du médecin
- [ ] **Traduction** : support multilingue
- [ ] **API de recherche** : endpoint dédié avec pagination
- [ ] **Debounce** : optimiser les requêtes de recherche

## 📝 Notes Techniques

### Encodage
- Les données du dataset sont en UTF-8
- Attention aux caractères accentués (è, é, à, etc.)
- Le backend retourne du JSON UTF-8

### Validation
- Les symptômes peuvent être ajoutés même s'ils ne sont pas dans la liste
- Les analyses nécessitent une valeur numérique
- Validation côté client avec Zod

### Sécurité
- Pas de limite de taux (rate limiting) pour l'instant
- Authentification requise (JWT)
- Validation des entrées côté backend

## 🔗 Fichiers Concernés

### Backend
- `backend-fastapi/app/routes/metadata.py` - Routes API
- `backend-fastapi/app/services/preprocessing_service.py` - Chargement dataset
- `backend-fastapi/test_metadata.py` - Tests

### Frontend
- `frontend-react/src/components/ui/Autocomplete.jsx` - Composant
- `frontend-react/src/api/metadataApi.js` - API client
- `frontend-react/src/pages/Consultation.jsx` - Utilisation
- `frontend-react/src/pages/PatientNew.jsx` - Utilisation (groupe sanguin)

## ✅ Checklist de Vérification

- [x] Backend retourne les symptômes (822)
- [x] Backend retourne les analyses
- [x] Frontend charge les suggestions au démarrage
- [x] Autocomplétion fonctionne en temps réel
- [x] Navigation clavier opérationnelle
- [x] Ajout de valeurs personnalisées possible
- [x] Suppression de symptômes/analyses fonctionne
- [x] Validation des données avant envoi
- [x] Gestion des erreurs
- [x] Indicateurs de chargement
