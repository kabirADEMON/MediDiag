# 📋 Enregistrement des Consultations - Documentation

## ✅ Fonctionnalité Implémentée

Le système permet maintenant d'**enregistrer une consultation complète** avec son diagnostic dans la base de données après avoir effectué un diagnostic IA.

---

## 🎯 Flux Complet

### 1. **Sélection du Patient**
- Recherche par code patient (ex: `PAT-20260510-0001`)
- Auto-remplissage de l'âge et du sexe
- Affichage des antécédents médicaux et allergies

### 2. **Saisie des Symptômes**
- Autocomplétion des symptômes depuis la base de données
- Ajout/suppression dynamique des symptômes

### 3. **Saisie des Analyses Biologiques (Optionnel)**
- Autocomplétion des analyses avec résultats attendus
- Format: "Analyse: Résultat"

### 4. **Lancement du Diagnostic IA**
- Système hybride: 70% ML + 30% Fuzzy Matching
- Retourne le top 10 des diagnostics possibles
- Scores, urgence, examens recommandés

### 5. **Enregistrement de la Consultation** ⭐ NOUVEAU
- Bouton "Enregistrer la consultation" après les résultats
- Champ pour notes complémentaires
- Sauvegarde dans la base de données SQLite

---

## 🗄️ Structure de la Base de Données

### Table `consultations`
```sql
CREATE TABLE consultations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    medecin_id INTEGER NOT NULL,
    date_consultation TEXT NOT NULL,
    motif TEXT,
    symptomes TEXT,              -- JSON array
    diagnostic TEXT,             -- Top diagnostic
    traitement TEXT,
    notes TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (patient_id) REFERENCES patients (id),
    FOREIGN KEY (medecin_id) REFERENCES users (id)
)
```

### Table `diagnostics`
```sql
CREATE TABLE diagnostics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    consultation_id INTEGER NOT NULL,
    patient_id INTEGER NOT NULL,
    symptomes TEXT NOT NULL,     -- JSON array
    analyses TEXT,               -- JSON object
    resultats TEXT NOT NULL,     -- JSON array (tous les diagnostics)
    score REAL,                  -- Score du top diagnostic
    urgence TEXT,                -- Niveau d'urgence
    created_at TEXT NOT NULL,
    FOREIGN KEY (consultation_id) REFERENCES consultations (id),
    FOREIGN KEY (patient_id) REFERENCES patients (id)
)
```

---

## 🔌 API Backend

### Endpoint: `POST /api/v1/consultations/`

**Request Body:**
```json
{
  "patient_id": 1,
  "medecin_id": 1,
  "motif": "Consultation médicale",
  "symptomes": ["Fièvre", "Fatigue", "Maux de tête"],
  "analyses": {
    "Hémoglobine: Diminuée": 1,
    "Plaquettes: Diminuées": 1
  },
  "diagnostic_results": [
    {
      "maladie": "Paludisme à P. falciparum",
      "score": 95.5,
      "urgence": "modérée",
      "compatibilite_age": true,
      "compatibilite_sexe": true,
      "examens_recommandes": ["TDR Paludisme", "NFS", "CRP"],
      "arguments": ["Fièvre élevée", "Thrombopénie"]
    }
  ],
  "notes": "Patient présente des symptômes depuis 3 jours"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Consultation enregistrée avec succès",
  "data": {
    "consultation_id": 1,
    "consultation": {
      "id": 1,
      "patient_id": 1,
      "medecin_id": 1,
      "date_consultation": "2026-05-12T10:30:00",
      "diagnostic": "Paludisme à P. falciparum",
      "nom": "Dupont",
      "prenom": "Jean",
      "code_patient": "PAT-20260510-0001"
    }
  }
}
```

### Autres Endpoints

- `GET /api/v1/consultations/` - Liste toutes les consultations
- `GET /api/v1/consultations/{id}` - Détails d'une consultation
- `GET /api/v1/consultations/patient/{patient_id}` - Consultations d'un patient
- `DELETE /api/v1/consultations/{id}` - Supprimer une consultation

---

## 💻 Frontend (React)

### Composant: `Consultation.jsx`

**Nouvelles fonctionnalités:**

1. **Import du contexte Auth**
```javascript
import { useAuth } from '@/context/AuthContext'
const { user } = useAuth()
```

2. **État pour la sauvegarde**
```javascript
const [savingConsultation, setSavingConsultation] = useState(false)
const [consultationSaved, setConsultationSaved] = useState(false)
const [consultationNotes, setConsultationNotes] = useState('')
```

3. **Fonction de sauvegarde**
```javascript
const saveConsultation = async () => {
  const consultationData = {
    patient_id: selectedPatient.id,
    medecin_id: user?.id || 1,
    motif: 'Consultation médicale',
    symptomes: symptoms,
    analyses: analyses,
    diagnostic_results: results.diagnostics,
    notes: consultationNotes
  }
  
  const response = await consultationApi.createConsultation(consultationData)
  // ...
}
```

4. **Interface utilisateur**
- Section "Enregistrer la consultation" après les résultats
- Champ de texte pour notes complémentaires
- Bouton avec état de chargement
- Message de confirmation après sauvegarde

---

## 🎨 Interface Utilisateur

### Avant l'enregistrement
```
┌─────────────────────────────────────────┐
│ 💾 Enregistrer la consultation          │
├─────────────────────────────────────────┤
│ Notes complémentaires (optionnel)       │
│ ┌─────────────────────────────────────┐ │
│ │ [Textarea pour notes]               │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [💾 Enregistrer la consultation]        │
│                                         │
│ La consultation sera enregistrée dans   │
│ le dossier du patient                   │
└─────────────────────────────────────────┘
```

### Après l'enregistrement
```
┌─────────────────────────────────────────┐
│ ✅ Consultation enregistrée avec succès!│
│                                         │
│ La consultation a été ajoutée au        │
│ dossier de Jean Dupont                  │
└─────────────────────────────────────────┘
```

---

## 🔄 Workflow Complet

```
1. Médecin se connecte
   ↓
2. Sélectionne un patient (par code)
   ↓
3. Saisit les symptômes
   ↓
4. (Optionnel) Saisit les analyses biologiques
   ↓
5. Lance le diagnostic IA
   ↓
6. Système retourne les résultats
   ↓
7. Médecin ajoute des notes complémentaires
   ↓
8. Clique sur "Enregistrer la consultation"
   ↓
9. Consultation enregistrée dans la BDD
   ↓
10. Mise à jour de la dernière visite du patient
```

---

## 📊 Données Enregistrées

Pour chaque consultation, le système enregistre:

### Dans `consultations`:
- ✅ ID du patient
- ✅ ID du médecin
- ✅ Date et heure de la consultation
- ✅ Motif de consultation
- ✅ Liste des symptômes (JSON)
- ✅ Diagnostic principal (top 1)
- ✅ Notes du médecin

### Dans `diagnostics`:
- ✅ Lien vers la consultation
- ✅ Symptômes détaillés (JSON)
- ✅ Analyses biologiques (JSON)
- ✅ **Tous les résultats du diagnostic IA** (JSON)
- ✅ Score du diagnostic principal
- ✅ Niveau d'urgence

### Mise à jour `patients`:
- ✅ Date de dernière visite

---

## 🧪 Test de la Fonctionnalité

### 1. Démarrer le backend
```bash
cd backend-fastapi
python run.py
```

### 2. Démarrer le frontend
```bash
cd frontend-react
npm run dev
```

### 3. Tester le flux
1. Se connecter avec `medecin@demo.com` / `demo123`
2. Aller sur "Consultation"
3. Créer un patient ou utiliser un existant
4. Rechercher le patient par code
5. Ajouter des symptômes (ex: Fièvre, Fatigue, Maux de tête)
6. (Optionnel) Ajouter des analyses
7. Lancer le diagnostic
8. Vérifier les résultats
9. Ajouter des notes
10. Cliquer sur "Enregistrer la consultation"
11. Vérifier le message de succès

### 4. Vérifier dans la base de données
```bash
cd backend-fastapi/data
sqlite3 medical.db

# Voir les consultations
SELECT * FROM consultations;

# Voir les diagnostics
SELECT * FROM diagnostics;

# Voir les consultations d'un patient
SELECT c.*, p.nom, p.prenom 
FROM consultations c 
JOIN patients p ON c.patient_id = p.id 
WHERE p.code_patient = 'PAT-20260510-0001';
```

---

## 🔐 Sécurité

- ✅ Authentification requise (JWT)
- ✅ ID du médecin récupéré depuis le contexte Auth
- ✅ Validation des données côté backend
- ✅ Foreign keys pour intégrité référentielle
- ✅ Transactions SQL pour cohérence des données

---

## 📈 Améliorations Futures

### Court terme
- [ ] Ajouter un champ "Traitement prescrit"
- [ ] Permettre de modifier une consultation
- [ ] Exporter la consultation en PDF
- [ ] Envoyer par email au patient

### Moyen terme
- [ ] Historique des consultations dans le dossier patient
- [ ] Statistiques par médecin
- [ ] Graphiques d'évolution des symptômes
- [ ] Alertes pour suivi patient

### Long terme
- [ ] Signature électronique
- [ ] Intégration avec système de facturation
- [ ] Téléconsultation
- [ ] IA pour suggestions de traitement

---

## 🐛 Dépannage

### Erreur: "Patient non sélectionné"
**Solution:** Rechercher et sélectionner un patient avant d'enregistrer

### Erreur: "Aucun diagnostic à enregistrer"
**Solution:** Lancer le diagnostic IA avant d'enregistrer

### Erreur: "medecin_id manquant"
**Solution:** Vérifier que l'utilisateur est bien connecté

### Consultation non visible
**Solution:** Vérifier les logs backend et la base de données SQLite

---

## 📚 Fichiers Modifiés

### Backend
- ✅ `backend-fastapi/app/routes/consultations.py` - Routes API
- ✅ `backend-fastapi/app/main.py` - Inclusion du router
- ✅ `backend-fastapi/app/database/sqlite_connection.py` - Tables déjà créées

### Frontend
- ✅ `frontend-react/src/pages/Consultation.jsx` - Interface utilisateur
- ✅ `frontend-react/src/api/consultationApi.js` - Déjà existant

---

## ✅ Résumé

La fonctionnalité d'**enregistrement des consultations** est maintenant **complète et opérationnelle** ! 

Le médecin peut:
1. ✅ Sélectionner un patient
2. ✅ Saisir symptômes et analyses
3. ✅ Lancer le diagnostic IA
4. ✅ **Enregistrer la consultation dans la base de données**
5. ✅ Ajouter des notes complémentaires
6. ✅ Voir la confirmation d'enregistrement

Toutes les données sont persistées dans SQLite et peuvent être consultées ultérieurement.

---

**Développé avec ❤️ pour améliorer le suivi médical des patients**
