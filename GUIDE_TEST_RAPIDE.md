# Guide de Test Rapide - 5 Minutes

**🎯 Objectif:** Vérifier rapidement que toutes les corrections fonctionnent

---

## ⚡ DÉMARRAGE RAPIDE

### 1. Démarrer le Backend (Terminal 1)
```bash
cd backend-fastapi
python start_server.py
```

**✅ Vérifier:** Message "Uvicorn running on http://127.0.0.1:8000"

### 2. Démarrer le Frontend (Terminal 2)
```bash
cd frontend-react
npm run dev
```

**✅ Vérifier:** Message "Local: http://localhost:5173/"

### 3. Ouvrir le Navigateur
- Aller sur http://localhost:5173/
- Se connecter avec:
  - Email: `medecin@demo.com`
  - Mot de passe: `demo123`

---

## 🧪 TEST 1: AUTOCOMPLÉTION (30 secondes)

1. Cliquer sur **Consultation** dans le menu
2. Ouvrir la console (F12)
3. Chercher dans les logs:
   ```
   ✅ Loaded symptoms: 822
   ```
4. Dans "Ajouter un symptôme", taper: **fièv**
5. **✅ SUCCÈS:** Liste de suggestions apparaît (Fièvre, Fièvre élevée, etc.)
6. **❌ ÉCHEC:** Aucune suggestion → Copier les logs de la console

---

## 🧪 TEST 2: DIAGNOSTIC SIMPLE (1 minute)

1. Dans la page Consultation:
   - Âge: **25**
   - Sexe: **Masculin**
   - Symptômes: Ajouter **Fièvre** et **Toux**
2. Cliquer sur **Lancer le diagnostic**
3. Regarder la console pour:
   ```
   📤 Sending diagnostic request
   📥 Diagnostic response
   ```
4. **✅ SUCCÈS:** Liste de maladies avec scores apparaît
5. **❌ ÉCHEC:** Seulement l'avertissement → Copier "📥 Diagnostic response:" de la console

---

## 🧪 TEST 3: GÉNÉRATION ANALYSES (2 minutes)

### Étape 1: Diagnostic Initial
1. Même formulaire que Test 2 (Âge: 25, Sexe: M, Symptômes: Fièvre + Toux)
2. **NE PAS ajouter d'analyses**
3. Lancer le diagnostic
4. **✅ SUCCÈS:** Bouton "🔬 Générer les analyses recommandées" visible

### Étape 2: Générer les Analyses
5. Cliquer sur "🔬 Générer les analyses recommandées"
6. Regarder la console:
   ```
   🔬 Generating recommended analyses...
   📊 Request data: {age: 25, sexe: 'M', symptoms: 2}
   ✅ Recommended analyses: X
   ```
7. **✅ SUCCÈS:** Liste d'analyses avec priorités (Haute/Moyenne/Basse)
8. **❌ ÉCHEC:** Erreur ou liste vide → Copier les logs

### Étape 3: Ajouter et Relancer
9. Cliquer sur "Ajouter" pour 2 analyses (ex: Hémoglobine, CRP)
10. Saisir des valeurs:
    - Hémoglobine: **12.5**
    - CRP: **15**
11. Cliquer à nouveau sur "Lancer le diagnostic"
12. **✅ SUCCÈS:** Nouveaux résultats (potentiellement différents)

---

## 🧪 TEST 4: SÉLECTION PATIENT (1 minute)

### Créer un Patient
1. Aller dans **Patients** → **Nouveau patient**
2. Remplir:
   - Nom: **Test**
   - Prénom: **Patient**
   - Date de naissance: **01/01/2000**
   - Sexe: **Masculin**
3. Enregistrer
4. **Noter le code patient** (ex: PAT-20260512-0001)

### Utiliser le Patient
5. Retourner dans **Consultation**
6. Dans "Code patient", entrer le code noté
7. Cliquer sur "Rechercher"
8. **✅ SUCCÈS:**
   - Encadré vert avec infos patient
   - Âge: 26 ans (calculé automatiquement)
   - Sexe: Masculin (rempli automatiquement)
   - Champs désactivés

---

## 📊 RÉSUMÉ DES TESTS

| Test | Durée | Statut | Notes |
|------|-------|--------|-------|
| Autocomplétion | 30s | ⬜ | 822 symptômes chargés ? |
| Diagnostic Simple | 1min | ⬜ | Liste maladies visible ? |
| Génération Analyses | 2min | ⬜ | Workflow complet OK ? |
| Sélection Patient | 1min | ⬜ | Auto-fill fonctionne ? |

**Légende:** ⬜ À tester | ✅ Succès | ❌ Échec

---

## 🐛 EN CAS DE PROBLÈME

### Problème: Autocomplétion ne marche pas
**Copier de la console:**
```
📦 Raw Symptoms Response: {...}
✅ Loaded symptoms: X
```

### Problème: Résultats ne s'affichent pas
**Copier de la console:**
```
📥 Diagnostic response: {...}
Debug: {...}
```

### Problème: Génération analyses échoue
**Copier de la console:**
```
🔬 Generating recommended analyses...
📊 Request data: {...}
📋 Recommended analyses response: {...}
```

### Problème: Backend ne démarre pas
**Vérifier:**
- Python installé ? `python --version`
- Dépendances installées ? `pip install -r requirements.txt`
- Port 8000 libre ? Fermer autres applications

### Problème: Frontend ne démarre pas
**Vérifier:**
- Node.js installé ? `node --version`
- Dépendances installées ? `npm install`
- Port 5173 libre ?

---

## ✅ TOUS LES TESTS PASSENT ?

**Félicitations ! Le système fonctionne correctement.**

### Prochaines étapes:
1. Tester avec des cas réels
2. Vérifier la précision des diagnostics
3. Améliorer l'UX si nécessaire
4. Ajouter des fonctionnalités supplémentaires

---

## ❌ UN TEST ÉCHOUE ?

**Fournir ces informations:**

1. **Quel test échoue ?** (Numéro du test)
2. **Logs de la console** (Copier tous les logs 🔄, 📡, ✅, ❌, 📤, 📥)
3. **Logs du backend** (Terminal où tourne start_server.py)
4. **Capture d'écran** si possible
5. **Étape exacte** où ça bloque

---

**Temps total:** ~5 minutes  
**Dernière mise à jour:** 12 mai 2026
