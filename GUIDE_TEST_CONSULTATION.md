# 🧪 Guide de Test - Enregistrement de Consultation

## 🚀 Démarrage Rapide

### 1. Démarrer le Backend
```bash
cd backend-fastapi
python run.py
```

✅ Backend disponible sur: http://localhost:8000

### 2. Démarrer le Frontend
```bash
cd frontend-react
npm run dev
```

✅ Frontend disponible sur: http://localhost:5173

---

## 🧪 Test Automatique (Backend)

### Exécuter le script de test
```bash
cd backend-fastapi
python test_consultation_save.py
```

**Ce script teste:**
1. ✅ Connexion médecin
2. ✅ Récupération d'un patient
3. ✅ Diagnostic IA
4. ✅ Sauvegarde de la consultation
5. ✅ Vérification dans la BDD
6. ✅ Historique des consultations

---

## 👨‍⚕️ Test Manuel (Interface Web)

### Étape 1: Connexion
1. Ouvrir http://localhost:5173
2. Se connecter avec:
   - **Email:** `medecin@demo.com`
   - **Mot de passe:** `demo123`

### Étape 2: Créer un Patient (si nécessaire)
1. Aller dans "Patients"
2. Cliquer sur "Nouveau patient"
3. Remplir le formulaire:
   - Nom: Dupont
   - Prénom: Jean
   - Date de naissance: 1990-05-15
   - Sexe: M
   - Téléphone: 0612345678
4. Enregistrer
5. **Noter le code patient** (ex: PAT-20260512-0001)

### Étape 3: Consultation
1. Aller dans "Consultation"
2. **Rechercher le patient:**
   - Entrer le code patient
   - Cliquer sur "Rechercher"
   - ✅ Les infos du patient s'affichent

3. **Ajouter des symptômes:**
   - Taper "Fièvre" → Entrée
   - Taper "Fatigue" → Entrée
   - Taper "Maux de tête" → Entrée
   - Taper "Courbatures" → Entrée

4. **Ajouter des analyses (optionnel):**
   - Sélectionner "Hémoglobine: Diminuée"
   - Sélectionner "Plaquettes: Diminuées"

5. **Lancer le diagnostic:**
   - Cliquer sur "Lancer le diagnostic"
   - ⏳ Attendre les résultats (2-3 secondes)

### Étape 4: Enregistrer la Consultation ⭐
1. **Vérifier les résultats:**
   - Top 10 diagnostics affichés
   - Scores et niveaux d'urgence
   - Examens recommandés

2. **Ajouter des notes:**
   - Dans la section "Enregistrer la consultation"
   - Taper: "Patient présente des symptômes depuis 3 jours. Voyage récent en zone tropicale."

3. **Enregistrer:**
   - Cliquer sur "💾 Enregistrer la consultation"
   - ⏳ Attendre la confirmation
   - ✅ Message de succès s'affiche

### Étape 5: Vérification
1. **Dans l'interface:**
   - Message vert "Consultation enregistrée avec succès !"
   - Nom du patient affiché

2. **Dans la base de données:**
```bash
cd backend-fastapi/data
sqlite3 medical.db

# Voir la dernière consultation
SELECT * FROM consultations ORDER BY id DESC LIMIT 1;

# Voir le diagnostic associé
SELECT * FROM diagnostics ORDER BY id DESC LIMIT 1;

# Quitter
.quit
```

---

## 🔍 Vérifications Détaillées

### Vérifier dans SQLite

#### 1. Voir toutes les consultations
```sql
SELECT 
    c.id,
    c.date_consultation,
    p.nom || ' ' || p.prenom as patient,
    c.diagnostic,
    c.notes
FROM consultations c
JOIN patients p ON c.patient_id = p.id
ORDER BY c.date_consultation DESC;
```

#### 2. Voir les détails d'une consultation
```sql
SELECT 
    c.*,
    p.nom, p.prenom, p.code_patient,
    d.score, d.urgence, d.resultats
FROM consultations c
JOIN patients p ON c.patient_id = p.id
LEFT JOIN diagnostics d ON d.consultation_id = c.id
WHERE c.id = 1;  -- Remplacer par l'ID de la consultation
```

#### 3. Voir l'historique d'un patient
```sql
SELECT 
    c.date_consultation,
    c.diagnostic,
    d.score,
    d.urgence
FROM consultations c
JOIN diagnostics d ON d.consultation_id = c.id
WHERE c.patient_id = 1  -- Remplacer par l'ID du patient
ORDER BY c.date_consultation DESC;
```

---

## 📊 Test avec l'API (Postman/cURL)

### 1. Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "medecin@demo.com",
    "password": "demo123"
  }'
```

**Copier le `access_token` de la réponse**

### 2. Créer une consultation
```bash
curl -X POST http://localhost:8000/api/v1/consultations/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "patient_id": 1,
    "medecin_id": 1,
    "motif": "Consultation médicale",
    "symptomes": ["Fièvre", "Fatigue", "Maux de tête"],
    "analyses": {
      "Hémoglobine: Diminuée": 1
    },
    "diagnostic_results": [
      {
        "maladie": "Paludisme à P. falciparum",
        "score": 95.5,
        "urgence": "modérée",
        "compatibilite_age": true,
        "compatibilite_sexe": true,
        "examens_recommandes": ["TDR Paludisme", "NFS"],
        "arguments": ["Fièvre élevée", "Thrombopénie"]
      }
    ],
    "notes": "Test API"
  }'
```

### 3. Récupérer la consultation
```bash
curl -X GET http://localhost:8000/api/v1/consultations/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## ✅ Checklist de Test

### Fonctionnalités de Base
- [ ] Connexion médecin fonctionne
- [ ] Recherche patient par code fonctionne
- [ ] Auto-remplissage âge/sexe fonctionne
- [ ] Ajout de symptômes fonctionne
- [ ] Ajout d'analyses fonctionne
- [ ] Diagnostic IA retourne des résultats
- [ ] Affichage des résultats correct

### Enregistrement de Consultation
- [ ] Bouton "Enregistrer" apparaît après diagnostic
- [ ] Champ notes fonctionne
- [ ] Enregistrement réussit
- [ ] Message de confirmation s'affiche
- [ ] Consultation visible dans la BDD
- [ ] Diagnostic détaillé sauvegardé
- [ ] Date de dernière visite mise à jour

### Cas d'Erreur
- [ ] Erreur si pas de patient sélectionné
- [ ] Erreur si pas de diagnostic
- [ ] Erreur si médecin non connecté
- [ ] Messages d'erreur clairs

---

## 🐛 Problèmes Courants

### Erreur: "Patient non sélectionné"
**Cause:** Aucun patient recherché  
**Solution:** Rechercher un patient par code avant d'enregistrer

### Erreur: "Aucun diagnostic à enregistrer"
**Cause:** Diagnostic pas lancé  
**Solution:** Cliquer sur "Lancer le diagnostic" avant d'enregistrer

### Erreur: "medecin_id manquant"
**Cause:** Utilisateur non connecté  
**Solution:** Se reconnecter

### Consultation non visible
**Cause:** Erreur lors de la sauvegarde  
**Solution:** Vérifier les logs backend et la console navigateur

### Erreur 500 Backend
**Cause:** Base de données ou erreur serveur  
**Solution:** 
1. Vérifier que le backend tourne
2. Vérifier les logs: `cd backend-fastapi && python run.py`
3. Vérifier la BDD: `ls backend-fastapi/data/medical.db`

---

## 📈 Résultats Attendus

### Après une consultation réussie:

**Dans l'interface:**
```
✅ Consultation enregistrée avec succès !
La consultation a été ajoutée au dossier de Jean Dupont
```

**Dans la base de données:**
```sql
-- Table consultations
id: 1
patient_id: 1
medecin_id: 1
date_consultation: 2026-05-12T10:30:00
diagnostic: Paludisme à P. falciparum
symptomes: ["Fièvre","Fatigue","Maux de tête"]
notes: Patient présente des symptômes depuis 3 jours

-- Table diagnostics
id: 1
consultation_id: 1
patient_id: 1
score: 95.5
urgence: modérée
resultats: [{"maladie":"Paludisme à P. falciparum",...}]
```

**Dans le dossier patient:**
```
derniere_visite: 2026-05-12T10:30:00
```

---

## 🎯 Scénarios de Test Avancés

### Scénario 1: Consultation Simple
- Patient: Homme, 35 ans
- Symptômes: Fièvre, Toux
- Analyses: Aucune
- ✅ Doit enregistrer avec diagnostic

### Scénario 2: Consultation Complète
- Patient: Femme, 28 ans
- Symptômes: Fièvre, Fatigue, Maux de tête, Courbatures
- Analyses: Hémoglobine diminuée, Plaquettes diminuées
- Notes: Voyage récent en zone tropicale
- ✅ Doit enregistrer avec toutes les données

### Scénario 3: Consultation Urgente
- Patient: Enfant, 5 ans
- Symptômes: Fièvre élevée, Convulsions, Raideur nuque
- ✅ Doit marquer urgence "critique"

### Scénario 4: Consultation de Suivi
- Même patient que Scénario 2
- Nouveaux symptômes
- ✅ Doit créer nouvelle consultation
- ✅ Historique doit montrer 2 consultations

---

## 📝 Rapport de Test

### Template de Rapport

```
Date: ___________
Testeur: ___________

✅ Tests Réussis: ___/___
❌ Tests Échoués: ___/___

Détails:
- Connexion: ✅/❌
- Recherche patient: ✅/❌
- Diagnostic IA: ✅/❌
- Enregistrement: ✅/❌
- Vérification BDD: ✅/❌

Problèmes rencontrés:
_______________________
_______________________

Suggestions:
_______________________
_______________________
```

---

## 🎉 Succès !

Si tous les tests passent, vous avez maintenant un système complet de:
- ✅ Diagnostic IA intelligent
- ✅ Enregistrement de consultations
- ✅ Historique patient
- ✅ Traçabilité médicale

**Prêt pour la production !** 🚀
