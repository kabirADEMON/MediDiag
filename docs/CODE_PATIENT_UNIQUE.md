# 🔢 Code Patient Unique - Système de génération automatique

## ✅ Fonctionnalité implémentée

Chaque patient reçoit automatiquement un **code unique** lors de son enregistrement.

---

## 📋 Format du code

### Format principal : `PAT-YYYYMMDD-XXXX`

**Exemple :** `PAT-20240510-0001`

**Composition :**
- `PAT` : Préfixe pour "Patient"
- `YYYYMMDD` : Date de création (Année-Mois-Jour)
- `XXXX` : Numéro séquentiel sur 4 chiffres

---

## 🎯 Avantages

✅ **Unique** : Chaque patient a un code différent  
✅ **Traçable** : La date de création est visible  
✅ **Lisible** : Format clair et professionnel  
✅ **Séquentiel** : Numérotation ordonnée  
✅ **Recherchable** : Facile à retrouver  

---

## 🔧 Implémentation Backend

### Fichier créé : `app/utils/patient_code_generator.py`

#### Fonctions disponibles :

```python
# 1. Format standard (recommandé)
generate_patient_code(patient_id)
# Retourne: PAT-20240510-0001

# 2. Format avec initiales
generate_patient_code_with_initials(nom, prenom, patient_id)
# Retourne: PAT-JD-20240510-0001 (Jean Dupont)

# 3. Format simple
generate_simple_patient_code(patient_id)
# Retourne: PAT-000001

# 4. Format aléatoire
generate_random_patient_code(length=8)
# Retourne: PAT-A3B7C9D2

# 5. Validation
validate_patient_code(code)
# Retourne: True/False

# 6. Extraction ID
extract_patient_id_from_code(code)
# Retourne: 1 (depuis PAT-20240510-0001)
```

### Génération automatique

Le code est généré automatiquement lors de la création d'un patient :

```python
# backend-fastapi/app/routes/patients.py

from app.utils.patient_code_generator import generate_patient_code

new_patient = {
    'id': patient_id_counter,
    'code_patient': generate_patient_code(patient_id_counter),  # ✅ Généré automatiquement
    'nom': patient_data['nom'],
    'prenom': patient_data['prenom'],
    ...
}
```

---

## 🔌 Endpoints Backend

### 1. Créer un patient (génère le code)

```http
POST /api/v1/patients
Content-Type: application/json

{
  "nom": "Dupont",
  "prenom": "Jean",
  "date_naissance": "1990-05-15",
  "sexe": "M"
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "Patient créé avec succès",
  "data": {
    "id": 1,
    "code_patient": "PAT-20240510-0001",  ← Code généré
    "nom": "Dupont",
    "prenom": "Jean",
    ...
  }
}
```

### 2. Rechercher par code

```http
GET /api/v1/patients/code/PAT-20240510-0001
```

**Réponse :**
```json
{
  "success": true,
  "message": "Patient trouvé",
  "data": {
    "id": 1,
    "code_patient": "PAT-20240510-0001",
    "nom": "Dupont",
    "prenom": "Jean",
    ...
  }
}
```

---

## 🎨 Affichage Frontend

### 1. Lors de la création

Après avoir créé un patient, le code s'affiche dans une alerte de succès :

```
┌─────────────────────────────────────────┐
│ ✅ Patient créé avec succès !           │
│                                         │
│ Code patient : PAT-20240510-0001        │
│                                         │
│ Redirection...                          │
└─────────────────────────────────────────┘
```

### 2. Dans la liste des patients

Le code apparaît dans une colonne dédiée :

```
┌──────────────────┬─────────────────┬─────┬──────┐
│ Code             │ Patient         │ Âge │ Sexe │
├──────────────────┼─────────────────┼─────┼──────┤
│ PAT-20240510-0001│ Jean Dupont     │ 34  │ M    │
│ PAT-20240510-0002│ Marie Martin    │ 28  │ F    │
│ PAT-20240510-0003│ Pierre Durand   │ 45  │ M    │
└──────────────────┴─────────────────┴─────┴──────┘
```

### 3. Dans les détails du patient

Le code s'affiche comme un badge à côté du nom :

```
┌─────────────────────────────────────────┐
│ Jean Dupont  [PAT-20240510-0001]        │
│ Dossier patient                         │
└─────────────────────────────────────────┘
```

---

## 💡 Exemples de codes générés

| Patient ID | Date | Code généré |
|------------|------|-------------|
| 1 | 10/05/2024 | `PAT-20240510-0001` |
| 2 | 10/05/2024 | `PAT-20240510-0002` |
| 15 | 10/05/2024 | `PAT-20240510-0015` |
| 100 | 10/05/2024 | `PAT-20240510-0100` |
| 1 | 15/06/2024 | `PAT-20240615-0001` |

---

## 🔄 Flux complet

```
1. User remplit le formulaire patient
   ↓
2. Frontend envoie POST /patients
   ↓
3. Backend reçoit les données
   ↓
4. Backend génère le code unique
   code = generate_patient_code(patient_id)
   ↓
5. Backend crée le patient avec le code
   ↓
6. Backend retourne le patient + code
   ↓
7. Frontend affiche le code dans l'alerte
   "Code patient : PAT-20240510-0001"
   ↓
8. Code visible dans la liste et détails
```

---

## 🎯 Cas d'usage

### 1. Recherche rapide

Un médecin peut retrouver un patient rapidement avec son code :

```
Recherche : PAT-20240510-0001
→ Jean Dupont trouvé
```

### 2. Référence dans les documents

Le code peut être utilisé dans :
- Ordonnances
- Résultats d'analyses
- Comptes rendus
- Factures

### 3. Communication

Entre professionnels de santé :
```
"Pouvez-vous consulter le dossier du patient PAT-20240510-0001 ?"
```

### 4. Archivage

Organisation des dossiers :
```
/archives/2024/05/PAT-20240510-0001/
```

---

## 🔧 Personnalisation

### Changer le format

Pour utiliser un format différent, modifier dans `patients.py` :

```python
# Format avec initiales
from app.utils.patient_code_generator import generate_patient_code_with_initials

new_patient = {
    'code_patient': generate_patient_code_with_initials(
        patient_data['nom'],
        patient_data['prenom'],
        patient_id_counter
    ),
    ...
}
# Résultat : PAT-JD-20240510-0001
```

### Format simple

```python
from app.utils.patient_code_generator import generate_simple_patient_code

new_patient = {
    'code_patient': generate_simple_patient_code(patient_id_counter),
    ...
}
# Résultat : PAT-000001
```

---

## 🧪 Tests

### Test de génération

```python
from app.utils.patient_code_generator import generate_patient_code

code = generate_patient_code(1)
print(code)  # PAT-20240510-0001
```

### Test de validation

```python
from app.utils.patient_code_generator import validate_patient_code

is_valid = validate_patient_code("PAT-20240510-0001")
print(is_valid)  # True

is_valid = validate_patient_code("INVALID")
print(is_valid)  # False
```

### Test API

```bash
# Créer un patient
curl -X POST http://localhost:8000/api/v1/patients \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Dupont",
    "prenom": "Jean",
    "date_naissance": "1990-05-15",
    "sexe": "M"
  }'

# Réponse avec code
{
  "success": true,
  "data": {
    "code_patient": "PAT-20240510-0001",
    ...
  }
}

# Rechercher par code
curl http://localhost:8000/api/v1/patients/code/PAT-20240510-0001
```

---

## 📊 Statistiques

Avec ce système, vous pouvez facilement :

- **Compter les patients par jour** : Tous les codes commençant par `PAT-20240510-`
- **Identifier les périodes d'affluence** : Analyser les dates dans les codes
- **Tracer l'historique** : Ordre chronologique des enregistrements

---

## 🚀 Améliorations futures

### Possibles

- [ ] QR Code avec le code patient
- [ ] Code-barres pour scan rapide
- [ ] Intégration avec carte patient
- [ ] Export du code en PDF
- [ ] Historique des codes générés
- [ ] Statistiques par période
- [ ] Vérification d'unicité en base de données
- [ ] Génération de codes par établissement (PAT-HOSP1-...)

---

## ✅ Résumé

### Backend
- ✅ Générateur de codes créé
- ✅ 4 formats disponibles
- ✅ Validation et extraction
- ✅ Génération automatique à la création
- ✅ Endpoint de recherche par code

### Frontend
- ✅ Affichage du code après création
- ✅ Colonne "Code" dans la liste
- ✅ Badge dans les détails
- ✅ Style professionnel (font-mono)

### Résultat
- ✅ **Code unique automatique** pour chaque patient
- ✅ **Format professionnel** et traçable
- ✅ **Recherche facilitée**
- ✅ **Intégration complète** frontend/backend

---

**Système de code patient unique implémenté avec succès ! 🎉**
