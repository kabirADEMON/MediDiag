# 🏥 Fonctionnalité : Consultation avec Sélection de Patient

## 📋 Description

La page de consultation permet maintenant de sélectionner un patient existant par son code unique. Lorsqu'un patient est sélectionné, ses informations (âge et sexe) sont automatiquement remplies dans le formulaire de diagnostic.

## ✨ Fonctionnalités

### 1. Recherche de Patient par Code
- **Champ de saisie** : Code patient (format: `PAT-YYYYMMDD-XXXX`)
- **Bouton de recherche** : Recherche le patient dans la base de données
- **Validation** : Affiche une erreur si le patient n'est pas trouvé

### 2. Affichage des Informations Patient
Lorsqu'un patient est trouvé, une carte verte affiche :
- ✅ Nom complet (Prénom + Nom)
- ✅ Code patient
- ✅ Âge calculé automatiquement
- ✅ Sexe (Masculin/Féminin)
- ✅ Antécédents médicaux (si disponibles)
- ⚠️ Allergies (affichées en rouge si présentes)

### 3. Remplissage Automatique
- **Âge** : Calculé à partir de la date de naissance
- **Sexe** : Pré-sélectionné (M ou F)
- **Champs désactivés** : Les champs âge et sexe sont désactivés quand un patient est sélectionné

### 4. Changement de Patient
- Bouton "Changer" pour réinitialiser la sélection
- Permet de saisir un nouveau code patient
- Réactive les champs âge et sexe pour saisie manuelle

## 🔧 Implémentation Technique

### Backend
**Route** : `GET /api/v1/patients/code/{code}`

**Exemple de requête** :
```bash
GET http://127.0.0.1:8000/api/v1/patients/code/PAT-20260510-0001
```

**Réponse** :
```json
{
  "success": true,
  "message": "Patient trouvé",
  "data": {
    "id": 1,
    "code_patient": "PAT-20260510-0001",
    "nom": "Ali",
    "prenom": "Dja",
    "date_naissance": "2011-06-10",
    "sexe": "F",
    "telephone": "",
    "email": "",
    "adresse": "",
    "antecedents_medicaux": "Diabète",
    "allergies": "Arachide",
    "groupe_sanguin": "A-",
    "created_at": "2026-05-10T14:16:18.178881"
  }
}
```

### Frontend

**Fichiers modifiés** :
- `frontend-react/src/pages/Consultation.jsx` : Ajout de la sélection patient
- `frontend-react/src/api/patientApi.js` : Ajout de `getPatientByCode()`

**Fonctions principales** :
```javascript
// Recherche patient par code
const searchPatientByCode = async () => {
  const response = await patientApi.getPatientByCode(patientCode)
  if (response.success) {
    setSelectedPatient(response.data.data)
    setValue('age', calculateAge(patient.date_naissance))
    setValue('sexe', patient.sexe)
  }
}

// Réinitialisation
const clearPatientSelection = () => {
  setPatientCode('')
  setSelectedPatient(null)
  setValue('age', '')
  setValue('sexe', 'M')
}
```

## 📱 Interface Utilisateur

### Carte de Sélection Patient
```
┌─────────────────────────────────────────┐
│ Sélection du patient                    │
├─────────────────────────────────────────┤
│ Code patient: [PAT-20260510-0001] [🔍] │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ✅ Dja Ali                          │ │
│ │ Code: PAT-20260510-0001             │ │
│ │ Âge: 15 ans • Sexe: Féminin         │ │
│ │ Antécédents: Diabète                │ │
│ │ ⚠️ Allergies: Arachide              │ │
│ │                          [Changer]  │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Formulaire Patient (avec patient sélectionné)
```
┌─────────────────────────────────────────┐
│ Informations patient                    │
├─────────────────────────────────────────┤
│ Âge: [15] (désactivé)                   │
│ Sexe: ⦿ Masculin ◯ Féminin (désactivé) │
│                                         │
│ ℹ️ Les informations du patient sont    │
│    remplies automatiquement             │
└─────────────────────────────────────────┘
```

## 🎯 Cas d'Usage

### Scénario 1 : Consultation avec Patient Existant
1. Médecin ouvre la page Consultation
2. Saisit le code patient : `PAT-20260510-0001`
3. Clique sur "Rechercher"
4. Les informations du patient s'affichent
5. Âge et sexe sont remplis automatiquement
6. Médecin ajoute les symptômes et lance le diagnostic

### Scénario 2 : Consultation sans Patient Enregistré
1. Médecin ouvre la page Consultation
2. Laisse le champ code patient vide
3. Saisit manuellement l'âge et le sexe
4. Ajoute les symptômes et lance le diagnostic

### Scénario 3 : Changement de Patient
1. Patient sélectionné : Ali Dja
2. Médecin clique sur "Changer"
3. Saisit un nouveau code : `PAT-20260510-0002`
4. Les informations du nouveau patient s'affichent

## ⚠️ Gestion des Erreurs

### Patient Non Trouvé
```
❌ Patient non trouvé avec ce code
```

### Code Vide
```
❌ Veuillez entrer un code patient
```

### Erreur Serveur
```
❌ Patient non trouvé ou erreur lors de la recherche
```

## 🔐 Sécurité

- ✅ Validation du code patient côté backend
- ✅ Gestion des erreurs 404 (patient non trouvé)
- ✅ Timeout de 5 secondes sur les requêtes
- ✅ Désactivation des champs pour éviter la modification accidentelle

## 📊 Avantages

1. **Gain de temps** : Pas besoin de ressaisir âge et sexe
2. **Précision** : Âge calculé automatiquement (pas d'erreur de calcul)
3. **Traçabilité** : Lien direct avec le dossier patient
4. **Sécurité** : Affichage des allergies et antécédents
5. **Flexibilité** : Possibilité de saisie manuelle si patient non enregistré

## 🚀 Améliorations Futures

- [ ] Autocomplétion des codes patients
- [ ] Recherche par nom/prénom
- [ ] Affichage de l'historique des consultations
- [ ] Suggestion de diagnostics basée sur l'historique
- [ ] Enregistrement automatique de la consultation dans le dossier patient
- [ ] Export PDF du diagnostic avec informations patient

## 📝 Notes

- Le calcul de l'âge est fait en temps réel (pas stocké en base)
- Les allergies sont affichées en rouge pour attirer l'attention
- Les champs sont désactivés (pas cachés) pour montrer qu'ils sont remplis automatiquement
- Le bouton "Changer" permet de revenir à la saisie manuelle
