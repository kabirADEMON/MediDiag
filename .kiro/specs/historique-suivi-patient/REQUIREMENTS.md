# Requirements : Historique et Suivi Patient

## 🎯 Vue d'ensemble

Cette fonctionnalité permet aux médecins de consulter l'historique médical complet d'un patient, incluant toutes ses consultations, diagnostics, et statistiques de santé.

---

## 👥 User Stories

### US-1 : Consulter le profil complet d'un patient
**En tant que** médecin  
**Je veux** accéder au profil détaillé d'un patient depuis la liste  
**Afin de** voir toutes ses informations médicales en un seul endroit

**Critères d'acceptation** :
- [ ] Clic sur un patient dans la liste ouvre sa page détail
- [ ] Page affiche : nom, âge, code patient, groupe sanguin, contacts
- [ ] Affiche le nombre total de consultations
- [ ] Affiche la date de dernière visite
- [ ] Bouton "Nouvelle consultation" visible et fonctionnel

**Priorité** : Haute  
**Estimation** : 1 jour

---

### US-2 : Visualiser l'historique des consultations
**En tant que** médecin  
**Je veux** voir la liste chronologique de toutes les consultations d'un patient  
**Afin de** comprendre son parcours médical

**Critères d'acceptation** :
- [ ] Timeline affiche les consultations du plus récent au plus ancien
- [ ] Chaque consultation affiche : date, médecin, symptômes, diagnostic, urgence
- [ ] Pagination fonctionnelle (10 consultations par page)
- [ ] Chargement rapide (< 2 secondes)

**Priorité** : Haute  
**Estimation** : 2 jours

---

### US-3 : Filtrer les consultations
**En tant que** médecin  
**Je veux** filtrer les consultations par période, médecin ou diagnostic  
**Afin de** trouver rapidement une information spécifique

**Critères d'acceptation** :
- [ ] Filtre par période : 7j, 30j, 6 mois, 1 an, tout
- [ ] Filtre par diagnostic (dropdown)
- [ ] Recherche textuelle dans les symptômes/notes
- [ ] Filtres combinables
- [ ] Résultats mis à jour en temps réel

**Priorité** : Moyenne  
**Estimation** : 1 jour

---

### US-4 : Consulter le détail d'une consultation
**En tant que** médecin  
**Je veux** voir tous les détails d'une consultation passée  
**Afin de** comprendre le contexte du diagnostic

**Critères d'acceptation** :
- [ ] Clic sur une consultation ouvre la vue détaillée
- [ ] Affiche tous les symptômes saisis
- [ ] Affiche toutes les analyses biologiques
- [ ] Affiche le top 10 des diagnostics avec scores
- [ ] Affiche les examens recommandés
- [ ] Affiche les notes complètes du médecin
- [ ] Bouton retour vers l'historique

**Priorité** : Haute  
**Estimation** : 1 jour

---

### US-5 : Visualiser les statistiques de santé
**En tant que** médecin  
**Je veux** voir des graphiques et statistiques sur la santé du patient  
**Afin de** identifier des patterns et tendances

**Critères d'acceptation** :
- [ ] Graphique : Nombre de consultations par mois
- [ ] Graphique : Diagnostics les plus fréquents (camembert)
- [ ] Liste : Symptômes récurrents avec fréquence
- [ ] Indicateurs : Total consultations, urgences élevées
- [ ] Alertes : Maladies récurrentes détectées
- [ ] Sélection de période (6 mois, 1 an, tout)

**Priorité** : Moyenne  
**Estimation** : 2 jours

---

### US-6 : Exporter une consultation en PDF
**En tant que** médecin  
**Je veux** exporter une consultation en PDF  
**Afin de** l'imprimer ou la partager avec le patient

**Critères d'acceptation** :
- [ ] Bouton "Exporter PDF" visible sur le détail consultation
- [ ] PDF contient toutes les informations de la consultation
- [ ] PDF bien formaté et lisible
- [ ] Nom du fichier : "Consultation_NomPatient_Date.pdf"
- [ ] Téléchargement automatique

**Priorité** : Basse  
**Estimation** : 1 jour

---

### US-7 : Exporter le dossier complet en PDF
**En tant que** médecin  
**Je veux** exporter tout l'historique d'un patient en PDF  
**Afin de** créer un dossier médical complet

**Critères d'acceptation** :
- [ ] Bouton "Exporter dossier complet" sur la page patient
- [ ] PDF contient : infos patient + toutes les consultations
- [ ] PDF paginé et structuré
- [ ] Table des matières
- [ ] Nom du fichier : "Dossier_NomPatient_Date.pdf"

**Priorité** : Basse  
**Estimation** : 1 jour

---

### US-8 : Navigation intuitive
**En tant que** médecin  
**Je veux** naviguer facilement entre les différentes sections  
**Afin de** gagner du temps dans ma consultation

**Critères d'acceptation** :
- [ ] Onglets : Informations, Historique, Statistiques
- [ ] Changement d'onglet sans rechargement de page
- [ ] Breadcrumb : Patients > Jean Dupont > Historique
- [ ] Bouton retour vers la liste des patients
- [ ] Navigation au clavier fonctionnelle

**Priorité** : Moyenne  
**Estimation** : 0.5 jour

---

## 📋 Exigences Fonctionnelles

### EF-1 : Affichage des données
- Toutes les consultations d'un patient doivent être affichées
- Les données doivent être à jour (pas de cache obsolète)
- Les dates doivent être au format français (DD/MM/YYYY)
- Les scores doivent être affichés avec 1 décimale

### EF-2 : Performance
- Chargement de la page < 2 secondes
- Filtres appliqués en < 500ms
- Pagination fluide
- Pas de lag lors du scroll

### EF-3 : Filtres et recherche
- Filtres doivent être persistants (mémorisés)
- Recherche insensible à la casse
- Recherche dans symptômes, diagnostics, notes
- Combinaison de plusieurs filtres possible

### EF-4 : Graphiques
- Graphiques interactifs (hover pour détails)
- Responsive (adaptation mobile/tablette)
- Couleurs cohérentes avec la charte
- Légendes claires

### EF-5 : Export PDF
- PDF conforme aux standards médicaux
- Logo de l'application
- Mentions légales
- Date de génération
- Signature numérique (optionnel)

---

## 📋 Exigences Non-Fonctionnelles

### ENF-1 : Sécurité
- Authentification JWT obligatoire
- Vérification des droits d'accès au patient
- Logs d'accès aux dossiers médicaux
- Pas de données sensibles dans les URLs
- Export PDF sécurisé (pas de cache navigateur)

### ENF-2 : Performance
- API : Temps de réponse < 500ms
- Frontend : First Contentful Paint < 1.5s
- Pagination côté serveur pour grandes listes
- Lazy loading des graphiques

### ENF-3 : Accessibilité
- Conformité WCAG 2.1 niveau AA
- Navigation au clavier complète
- Lecteurs d'écran compatibles
- Contraste des couleurs suffisant
- Textes alternatifs pour graphiques

### ENF-4 : Responsive Design
- Mobile : Vue simplifiée, timeline verticale
- Tablette : Layout adapté
- Desktop : Vue complète
- Breakpoints : 640px, 768px, 1024px, 1280px

### ENF-5 : Compatibilité
- Navigateurs : Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- Pas de support IE11
- Backend : Python 3.9+
- Frontend : React 18+

### ENF-6 : Maintenabilité
- Code documenté (docstrings Python, JSDoc)
- Tests unitaires > 80% couverture
- Architecture modulaire
- Logs structurés

---

## 🔧 Contraintes Techniques

### Backend
- Utiliser FastAPI pour les nouveaux endpoints
- Respecter la structure existante des routes
- Utiliser SQLite pour le développement
- Pydantic pour validation des données
- Logs avec module logging Python

### Frontend
- React 18 avec hooks
- TailwindCSS pour le styling
- Recharts pour les graphiques
- Axios pour les appels API
- React Router pour la navigation

### Base de données
- Pas de modification du schéma existant
- Utiliser les tables : patients, consultations, diagnostics, users
- Requêtes optimisées avec index
- Transactions pour cohérence des données

---

## 📊 Dépendances

### Dépendances Externes
- **Backend** : `reportlab` ou `weasyprint` pour PDF
- **Frontend** : `recharts` pour graphiques, `date-fns` pour dates

### Dépendances Internes
- Système d'authentification existant
- API patients existante
- API consultations existante
- Base de données SQLite

---

## 🧪 Critères de Test

### Tests Unitaires
- [ ] Backend : Tous les endpoints testés
- [ ] Backend : Services testés avec mocks
- [ ] Frontend : Composants testés avec React Testing Library
- [ ] Frontend : Hooks testés

### Tests d'Intégration
- [ ] Flux complet : Liste patients → Détail → Historique
- [ ] Filtres fonctionnent avec vraies données
- [ ] Export PDF génère un fichier valide
- [ ] Graphiques affichent les bonnes données

### Tests End-to-End
- [ ] Scénario complet utilisateur
- [ ] Navigation entre pages
- [ ] Performance mesurée
- [ ] Responsive testé sur différents devices

---

## 📈 Métriques de Succès

### Métriques Quantitatives
- Temps de chargement < 2 secondes
- Taux d'erreur < 1%
- Couverture de tests > 80%
- Score Lighthouse > 90

### Métriques Qualitatives
- Satisfaction médecins (enquête)
- Facilité d'utilisation (SUS score > 70)
- Réduction du temps de consultation de l'historique
- Nombre d'exports PDF générés

---

## 🚫 Hors Scope (Version 1.0)

Les éléments suivants ne sont **pas** inclus dans cette version :

- ❌ Comparaison de consultations côte à côte
- ❌ Alertes automatiques en temps réel
- ❌ Prédiction de risques par IA
- ❌ Partage avec autres médecins
- ❌ Annotations sur les consultations
- ❌ Pièces jointes (images, documents)
- ❌ Téléconsultation
- ❌ Intégration appareils médicaux
- ❌ Export en format Word/Excel
- ❌ Envoi automatique par email

Ces fonctionnalités pourront être ajoutées dans les versions futures.

---

## 📅 Planning

### Sprint 1 (5 jours)
- Backend : Endpoints historique et statistiques
- Frontend : Structure de base et navigation

### Sprint 2 (4 jours)
- Frontend : Timeline et filtres
- Frontend : Détail consultation

### Sprint 3 (3 jours)
- Frontend : Statistiques et graphiques
- Export PDF

### Sprint 4 (1 jour)
- Tests et corrections
- Documentation

**Total : 13 jours**

---

## ✅ Validation

Cette spécification doit être validée par :
- [ ] Product Owner
- [ ] Tech Lead
- [ ] Designer UI/UX
- [ ] Médecin référent (utilisateur final)
- [ ] Équipe de développement

---

**Date de création** : 2026-05-12  
**Auteur** : Équipe MediDiag  
**Version** : 1.0.0
