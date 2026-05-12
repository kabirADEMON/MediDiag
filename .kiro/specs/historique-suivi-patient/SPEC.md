# Spécification : Historique et Suivi Patient

## 📋 Métadonnées

- **Nom de la fonctionnalité** : Historique et Suivi Patient
- **Version** : 1.0.0
- **Date de création** : 2026-05-12
- **Statut** : En conception
- **Priorité** : Haute
- **Complexité estimée** : Moyenne

---

## 🎯 Objectif

Créer une interface complète permettant aux médecins de consulter l'historique médical complet d'un patient, incluant toutes ses consultations passées, diagnostics, évolution des symptômes, et statistiques de santé.

---

## 📊 Contexte

### État Actuel
- ✅ Système de création de patients fonctionnel
- ✅ Enregistrement des consultations avec diagnostics
- ✅ Base de données SQLite avec tables `patients`, `consultations`, `diagnostics`
- ✅ API REST pour patients et consultations
- ❌ Pas de page dédiée pour visualiser l'historique complet
- ❌ Pas de vue chronologique des consultations
- ❌ Pas de statistiques sur l'évolution du patient

### Besoin Métier
Les médecins ont besoin de :
1. Voir rapidement l'historique complet d'un patient
2. Identifier les patterns de maladies récurrentes
3. Suivre l'évolution des symptômes dans le temps
4. Accéder aux diagnostics précédents pour comparaison
5. Visualiser les statistiques de santé du patient

---

## 👥 Utilisateurs Cibles

- **Médecins** : Consultation de l'historique pour diagnostic
- **Infirmiers** : Suivi des patients et préparation des consultations
- **Administrateurs** : Vue d'ensemble pour gestion

---

## ✨ Fonctionnalités Principales

### 1. Page Détail Patient
**Description** : Page dédiée affichant toutes les informations d'un patient

**Composants** :
- En-tête avec informations patient (nom, âge, code, groupe sanguin)
- Onglets de navigation (Informations, Historique, Statistiques)
- Boutons d'action (Nouvelle consultation, Modifier, Exporter)

### 2. Historique des Consultations
**Description** : Liste chronologique de toutes les consultations

**Affichage** :
- Timeline verticale avec dates
- Pour chaque consultation :
  - Date et heure
  - Médecin traitant
  - Symptômes principaux
  - Diagnostic principal
  - Score de confiance
  - Niveau d'urgence
  - Notes du médecin
- Filtres par date, médecin, diagnostic
- Recherche dans l'historique

### 3. Détail d'une Consultation
**Description** : Vue détaillée d'une consultation spécifique

**Contenu** :
- Informations complètes de la consultation
- Tous les symptômes saisis
- Analyses biologiques effectuées
- Top 10 des diagnostics avec scores
- Examens recommandés
- Notes complètes du médecin
- Bouton pour imprimer/exporter en PDF

### 4. Statistiques Patient
**Description** : Visualisation des données de santé

**Graphiques** :
- Nombre de consultations par mois (graphique en barres)
- Diagnostics les plus fréquents (camembert)
- Évolution des symptômes récurrents (ligne temporelle)
- Taux d'urgence des consultations (jauge)

**Indicateurs** :
- Nombre total de consultations
- Dernière visite
- Maladies récurrentes
- Allergies et antécédents

### 5. Recherche et Filtres
**Description** : Outils de recherche avancée

**Filtres** :
- Par période (7 jours, 30 jours, 6 mois, 1 an, tout)
- Par type de diagnostic
- Par médecin
- Par niveau d'urgence
- Par présence de symptômes spécifiques

### 6. Export et Impression
**Description** : Génération de documents

**Formats** :
- PDF : Dossier médical complet
- PDF : Consultation individuelle
- CSV : Export des données pour analyse

---

## 🎨 Interface Utilisateur

### Wireframe - Page Détail Patient

```
┌─────────────────────────────────────────────────────────────────┐
│ ← Retour aux patients                    [Nouvelle consultation] │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  👤 Jean DUPONT                                    PAT-20260510-1│
│  35 ans • Homme • Groupe O+                                      │
│  📞 0612345678 • ✉️ jean.dupont@email.com                        │
│                                                                   │
│  🏥 Dernière visite: 10 mai 2026                                 │
│  📊 12 consultations • 🩺 5 diagnostics différents               │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│  [Informations] [Historique] [Statistiques]                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  📋 HISTORIQUE DES CONSULTATIONS                                 │
│                                                                   │
│  Filtres: [Période ▼] [Médecin ▼] [Diagnostic ▼] [🔍 Recherche]│
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 🔵 10 Mai 2026 - 14:30                                    │  │
│  │    Dr. Martin BERNARD                                     │  │
│  │    Symptômes: Fièvre, Fatigue, Maux de tête              │  │
│  │    Diagnostic: Paludisme à P. falciparum (95.5%)         │  │
│  │    Urgence: 🟡 Modérée                                    │  │
│  │    [Voir détails] [Imprimer]                              │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 🔵 05 Mai 2026 - 10:15                                    │  │
│  │    Dr. Sophie MARTIN                                      │  │
│  │    Symptômes: Toux, Douleur thoracique                   │  │
│  │    Diagnostic: Pneumonie bactérienne (88.2%)             │  │
│  │    Urgence: 🔴 Élevée                                     │  │
│  │    [Voir détails] [Imprimer]                              │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  [Charger plus...]                                               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Wireframe - Détail Consultation

```
┌─────────────────────────────────────────────────────────────────┐
│ ← Retour à l'historique              [Imprimer] [Exporter PDF]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  📋 CONSULTATION DU 10 MAI 2026 - 14:30                          │
│                                                                   │
│  Patient: Jean DUPONT (35 ans, Homme)                            │
│  Médecin: Dr. Martin BERNARD                                     │
│  Code consultation: CONS-20260510-0001                           │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  🩺 SYMPTÔMES RAPPORTÉS                                          │
│  • Fièvre (39°C)                                                 │
│  • Fatigue intense                                               │
│  • Maux de tête                                                  │
│  • Douleurs musculaires                                          │
│                                                                   │
│  🔬 ANALYSES BIOLOGIQUES                                         │
│  • Hémoglobine: Diminuée                                         │
│  • Plaquettes: Diminuées                                         │
│  • CRP: Élevée                                                   │
│                                                                   │
│  🎯 DIAGNOSTIC IA                                                │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 1. Paludisme à P. falciparum          95.5% 🟡 Modérée │    │
│  │ 2. Dengue                              87.3% 🔴 Élevée  │    │
│  │ 3. Grippe sévère                       76.8% 🟢 Faible  │    │
│  │ ... (voir les 10 résultats)                             │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  🔍 EXAMENS RECOMMANDÉS                                          │
│  • TDR Paludisme (urgent)                                        │
│  • NFS complète                                                  │
│  • Frottis sanguin                                               │
│                                                                   │
│  📝 NOTES DU MÉDECIN                                             │
│  Patient présente des symptômes depuis 3 jours. Retour de       │
│  voyage en zone endémique il y a 2 semaines. TDR prescrit       │
│  en urgence. Traitement antipaludéen à débuter si positif.      │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Wireframe - Statistiques

```
┌─────────────────────────────────────────────────────────────────┐
│  📊 STATISTIQUES DE SANTÉ - Jean DUPONT                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Période: [7 jours] [30 jours] [6 mois] [1 an] [Tout]          │
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │ 📈 Consultations │  │ 🩺 Diagnostics   │  │ 🚨 Urgences   │ │
│  │      12          │  │       5          │  │      3        │ │
│  │  Total           │  │  Différents      │  │  Élevées      │ │
│  └──────────────────┘  └──────────────────┘  └───────────────┘ │
│                                                                   │
│  📊 CONSULTATIONS PAR MOIS                                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │     ▂▄▆█▅▃▂▁                                            │    │
│  │ Jan Feb Mar Avr Mai Jun Jul Aoû Sep Oct Nov Déc        │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  🥧 DIAGNOSTICS LES PLUS FRÉQUENTS                               │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │        ╱───╲                                            │    │
│  │       │  🔵 │  Paludisme (4x)                           │    │
│  │       │  🟢 │  Grippe (3x)                              │    │
│  │        ╲───╱   Pneumonie (2x)                           │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  📈 SYMPTÔMES RÉCURRENTS                                         │
│  • Fièvre (8 fois)                                               │
│  • Fatigue (6 fois)                                              │
│  • Maux de tête (5 fois)                                         │
│  • Toux (4 fois)                                                 │
│                                                                   │
│  ⚠️ ALERTES                                                      │
│  • 3 consultations avec urgence élevée dans les 6 derniers mois │
│  • Paludisme récurrent (4 épisodes) - Suivi recommandé          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Architecture Technique

### Backend (FastAPI)

#### Nouveaux Endpoints

```python
# GET /api/v1/patients/{patient_id}/history
# Récupère l'historique complet d'un patient
Response: {
  "patient": {...},
  "consultations": [...],
  "statistics": {...}
}

# GET /api/v1/patients/{patient_id}/consultations
# Liste des consultations avec pagination et filtres
Query params: skip, limit, start_date, end_date, medecin_id, urgence

# GET /api/v1/patients/{patient_id}/statistics
# Statistiques du patient
Response: {
  "total_consultations": 12,
  "diagnostics_frequency": {...},
  "symptoms_frequency": {...},
  "urgency_distribution": {...},
  "consultations_by_month": [...]
}

# GET /api/v1/consultations/{consultation_id}/export
# Export PDF d'une consultation
Response: PDF file

# GET /api/v1/patients/{patient_id}/export
# Export PDF du dossier complet
Response: PDF file
```

#### Services à Créer

```python
# app/services/patient_history_service.py
- get_patient_history()
- get_patient_statistics()
- get_consultations_timeline()
- filter_consultations()

# app/services/export_service.py
- export_consultation_pdf()
- export_patient_dossier_pdf()
- export_consultations_csv()
```

### Frontend (React)

#### Nouvelles Pages

```javascript
// src/pages/PatientDetail.jsx
// Page principale du détail patient avec onglets

// src/pages/PatientHistory.jsx
// Historique des consultations

// src/pages/PatientStatistics.jsx
// Statistiques et graphiques

// src/pages/ConsultationDetail.jsx
// Détail d'une consultation
```

#### Nouveaux Composants

```javascript
// src/components/patient/PatientHeader.jsx
// En-tête avec infos patient

// src/components/patient/ConsultationCard.jsx
// Card pour une consultation dans la timeline

// src/components/patient/ConsultationTimeline.jsx
// Timeline des consultations

// src/components/patient/StatisticsCharts.jsx
// Graphiques statistiques

// src/components/patient/ConsultationFilters.jsx
// Filtres de recherche

// src/components/patient/ExportButtons.jsx
// Boutons d'export PDF/CSV
```

#### Nouvelles API

```javascript
// src/api/patientHistoryApi.js
- getPatientHistory(patientId)
- getPatientStatistics(patientId, period)
- getConsultationDetail(consultationId)
- exportConsultationPDF(consultationId)
- exportPatientDossier(patientId)
```

### Bibliothèques Nécessaires

**Backend** :
- `reportlab` ou `weasyprint` : Génération PDF
- `matplotlib` ou `plotly` : Graphiques (optionnel)

**Frontend** :
- `recharts` : Graphiques React
- `date-fns` : Manipulation de dates
- `react-to-print` : Impression
- `jspdf` : Génération PDF côté client (optionnel)

---

## 📊 Modèle de Données

### Pas de modification de schéma nécessaire

Les tables existantes suffisent :
- ✅ `patients` : Informations patient
- ✅ `consultations` : Consultations avec notes
- ✅ `diagnostics` : Résultats diagnostics IA
- ✅ `users` : Médecins

### Requêtes SQL Principales

```sql
-- Historique complet d'un patient
SELECT c.*, d.*, u.nom as medecin_nom, u.prenom as medecin_prenom
FROM consultations c
LEFT JOIN diagnostics d ON c.id = d.consultation_id
LEFT JOIN users u ON c.medecin_id = u.id
WHERE c.patient_id = ?
ORDER BY c.date_consultation DESC;

-- Statistiques diagnostics
SELECT 
  c.diagnostic,
  COUNT(*) as frequency
FROM consultations c
WHERE c.patient_id = ?
GROUP BY c.diagnostic
ORDER BY frequency DESC;

-- Symptômes récurrents
SELECT 
  symptome,
  COUNT(*) as frequency
FROM (
  SELECT json_each.value as symptome
  FROM consultations c, json_each(c.symptomes)
  WHERE c.patient_id = ?
)
GROUP BY symptome
ORDER BY frequency DESC;
```

---

## 🧪 Tests

### Tests Backend

```python
# tests/test_patient_history.py
- test_get_patient_history()
- test_get_patient_statistics()
- test_filter_consultations_by_date()
- test_export_consultation_pdf()
- test_export_patient_dossier()

# tests/test_patient_history_edge_cases.py
- test_patient_without_consultations()
- test_invalid_patient_id()
- test_date_range_filters()
```

### Tests Frontend

```javascript
// tests/PatientDetail.test.jsx
- renders patient information correctly
- switches between tabs
- loads consultation history

// tests/ConsultationTimeline.test.jsx
- displays consultations in chronological order
- filters work correctly
- pagination works
```

---

## 📈 Métriques de Succès

### Critères d'Acceptation

- [ ] Page détail patient accessible depuis la liste
- [ ] Historique affiche toutes les consultations
- [ ] Filtres fonctionnent correctement
- [ ] Détail consultation affiche toutes les informations
- [ ] Statistiques affichent les graphiques
- [ ] Export PDF fonctionne
- [ ] Performance : chargement < 2 secondes
- [ ] Responsive sur mobile et tablette

### KPIs

- Temps moyen de consultation de l'historique
- Nombre d'exports PDF générés
- Taux d'utilisation des filtres
- Satisfaction utilisateur (feedback médecins)

---

## 🚀 Plan de Développement

### Phase 1 : Backend (Estimation : 2-3 jours)
1. Créer les endpoints d'historique
2. Implémenter les statistiques
3. Ajouter les filtres de recherche
4. Tests unitaires backend

### Phase 2 : Frontend - Structure (Estimation : 2 jours)
1. Créer la page PatientDetail
2. Implémenter la navigation par onglets
3. Créer les composants de base
4. Intégration API

### Phase 3 : Frontend - Historique (Estimation : 2 jours)
1. Timeline des consultations
2. Filtres et recherche
3. Détail consultation
4. Pagination

### Phase 4 : Frontend - Statistiques (Estimation : 2 jours)
1. Intégrer Recharts
2. Créer les graphiques
3. Calculer les indicateurs
4. Responsive design

### Phase 5 : Export PDF (Estimation : 2 jours)
1. Backend : génération PDF
2. Frontend : boutons export
3. Templates PDF
4. Tests d'export

### Phase 6 : Tests et Polish (Estimation : 1 jour)
1. Tests end-to-end
2. Corrections bugs
3. Optimisations performance
4. Documentation

**Durée totale estimée : 11-12 jours**

---

## 🔒 Sécurité

- ✅ Authentification JWT requise
- ✅ Vérifier que l'utilisateur a accès au patient
- ✅ Logs d'accès aux dossiers médicaux
- ✅ Pas de données sensibles dans les URLs
- ✅ Export PDF sécurisé (pas de cache)

---

## ♿ Accessibilité

- Navigation au clavier
- Lecteurs d'écran compatibles
- Contraste des couleurs WCAG AA
- Textes alternatifs pour graphiques
- Focus visible sur les éléments interactifs

---

## 📱 Responsive Design

- Mobile : Vue simplifiée, timeline verticale
- Tablette : Layout adapté, graphiques redimensionnés
- Desktop : Vue complète avec sidebar

---

## 🔄 Évolutions Futures

### Version 2.0
- [ ] Comparaison de consultations côte à côte
- [ ] Alertes automatiques (symptômes récurrents)
- [ ] Prédiction de risques basée sur l'historique
- [ ] Partage sécurisé avec autres médecins
- [ ] Annotations sur les consultations
- [ ] Pièces jointes (images, documents)

### Version 3.0
- [ ] IA pour détection de patterns
- [ ] Recommandations de suivi personnalisées
- [ ] Intégration avec appareils médicaux
- [ ] Téléconsultation intégrée

---

## 📚 Documentation

### À Créer
- [ ] Guide utilisateur : Consultation de l'historique
- [ ] Guide développeur : Architecture historique
- [ ] API Documentation : Nouveaux endpoints
- [ ] Guide d'export PDF

---

## ✅ Checklist de Validation

### Avant de commencer
- [ ] Spec validée par l'équipe
- [ ] Design UI/UX approuvé
- [ ] Environnement de dev prêt
- [ ] Bibliothèques identifiées

### Pendant le développement
- [ ] Code review à chaque PR
- [ ] Tests unitaires écrits
- [ ] Documentation à jour
- [ ] Performance vérifiée

### Avant la mise en production
- [ ] Tests end-to-end passés
- [ ] Validation par les médecins
- [ ] Documentation complète
- [ ] Migration de données testée
- [ ] Rollback plan préparé

---

## 📞 Contacts

- **Product Owner** : À définir
- **Tech Lead** : À définir
- **Designer** : À définir
- **QA** : À définir

---

**Créé le** : 2026-05-12  
**Dernière mise à jour** : 2026-05-12  
**Version** : 1.0.0
