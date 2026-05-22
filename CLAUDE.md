# CLAUDE.md — MediDiag

Règles non-négociables pour ce projet. Toujours respectées, même sans rappel.

---

## Stack

- **Backend** : FastAPI + Python, SQLite (`backend-fastapi/`)
- **Frontend** : React 18 + Vite + Tailwind CSS (`frontend-react/`)
- **ML** : dataset 1000 maladies, rapidfuzz, modèle maison (90.7 % acc.)
- **Comptes démo** : `medecin@demo.com / demo123`

---

## Axios — Double-wrapping

`response.data.data` = les vraies données. **Ne jamais utiliser `response.data` directement** comme données finales.

```js
// ✅
const data = response.data?.data || response.data

// ❌
const data = response.data
```

---

## Téléphone — Format E.164

- Tout numéro de téléphone stocké **doit être en E.164** (`+2250102030405`).
- Utiliser le composant `<PhoneInput>` (`src/components/ui/PhoneInput.jsx`) partout où un champ téléphone apparaît.
- `PhoneInput` utilise `libphonenumber-js` pour valider et formatter.
- La validation Zod accepte `/^\+[1-9]\d{6,14}$/` ou chaîne vide.
- `PatientNew.jsx` utilise `Controller` de react-hook-form pour brancher `PhoneInput`.

---

## Moteur Diagnostic — Règles Top 4

### 1. Anti-ancrage (Anti-anchoring)

- **Max 1 variante par racine pathologique** dans le Top 4 affiché.
- Les variantes (`Aiguë`, `Sévère`, `Chronique`, `Grave`, etc.) sont détectées par `_VARIANT_RE` dans `diagnostic_service.py` → `_disease_root()`.
- La fonction `_apply_anti_anchoring()` s'exécute après le tri par score, avant la réponse finale.
- Au-delà du rang 4, le reste de la liste n'est pas modifié.

### 2. Logique exclusionnelle

- Si un **symptôme clé obligatoire** (IDF > 4.5 = très spécifique à peu de maladies) est **absent** du match patient → `score × 0.1`.
- Calculé dans `matching_service.py` (`key_symptom_absent: bool`) et appliqué dans `diagnostic_service.py` avant le boost clinique.
- Seuil IDF configurable : `KEY_IDF_THRESHOLD = 4.5` dans `matching_service.py`.

### 3. ScoreCliniqueManager

- Fichier : `backend-fastapi/app/services/clinical_scoring_service.py`
- Calcule en arrière-plan les scores validés suivants et booste le score final si élevé :

| Score      | Maladie cible            | Boost si élevé |
|------------|--------------------------|----------------|
| Alvarado   | Appendicite (≥7 = +20, ≥5 = +10) | +10 à +20 |
| Wells TVP  | TVP/Phlébite (≥3 = +15, ≥1 = +7) | +7 à +15  |
| Wells EP   | Embolie pulmonaire (≥5 = +15)     | +7 à +15  |
| Mac Isaac  | Pharyngite/Angine (≥4 = +15)      | +7 à +15  |

- Le boost est capé à 100 : `min(100.0, final_score + boost)`.
- Le boost s'applique **après** le malus exclusionnel, **avant** le tri final.

---

## Ordre des opérations dans `DiagnosticService.perform_diagnostic`

1. `matching_engine.match_diseases()` — filtrage age/sex + score symptômes + IDF
2. Pour chaque maladie : `calculate_final_score()` (symptômes 70%, age 10%, sexe 5%, analyses 15%)
3. **Malus exclusionnel** si `key_symptom_absent == True` → `score × 0.1`
4. **Boost ScoreCliniqueManager** (Alvarado / Wells / Mac Isaac)
5. Tri décroissant par score final
6. **Anti-ancrage** : `_apply_anti_anchoring()` — déduplication Top 4 par racine
7. Seuil de confiance minimum : `MIN_SCORE = 30.0`

---

## Nomenclature métier (noms canoniques)

Toute nouvelle classe Python, table SQL ou composant React **doit** utiliser ces termes exactement (camelCase dans le code JS/React) :

| Concept                | Python / SQL         | React / JS           |
|------------------------|----------------------|----------------------|
| Utilisateur            | `Utilisateur`        | `utilisateur`        |
| Administrateur         | `Admin`              | `admin`              |
| Médecin                | `Medecin`            | `medecin`            |
| Infirmier              | `Infirmier`          | `infirmier`          |
| Patient                | `Patient`            | `patient`            |
| Dossier médical        | `DossierMedical`     | `dossierMedical`     |
| Consultation           | `Consultation`       | `consultation`       |
| Symptôme               | `Symptomes`          | `symptomes`          |
| Analyse biologique     | `Analyse`            | `analyse`            |
| Résultat d'analyse     | `ResultatsAnalyse`   | `resultatsAnalyse`   |
| Système IA             | `SystemeIA`          | `systemeIA`          |
| Diagnostic             | `Diagnostic`         | `diagnostic`         |
| Rapport médical        | `RapportMedecal`     | `rapportMedecal`     |

Méthodes canoniques imposées :
- `gererComptes()` — Admin
- `examinerSymptomes()` — Medecin
- `prendreConstantes()` — Infirmier
- `calculerScores()`, `appliquerFiltreAntiAncrage()` — SystemeIA
- `sauvegarderRapport()` — RapportMedecal

---

## Conventions générales

- Pas de commentaires sauf pour un invariant non-évident.
- Pas de feature flags ni backward-compat shims inutiles.
- Validation uniquement aux frontières système (input utilisateur, API externe).
- Tests : `backend-fastapi/test_phase_b.py` et `test_analyses_scoring.py`.
