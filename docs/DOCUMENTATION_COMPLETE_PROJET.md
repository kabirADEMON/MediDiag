#  DOCUMENTATION COMPLÈTE DU PROJET
# Système de Diagnostic Médical Intelligent

---

##  TABLE DES MATIÈRES

1. [Vue d'ensemble du projet](#vue-densemble)
2. [Architecture globale](#architecture-globale)
3. [Backend FastAPI](#backend-fastapi)
4. [Frontend React](#frontend-react)
5. [Base de données](#base-de-données)
6. [Machine Learning](#machine-learning)
7. [API Documentation](#api-documentation)
8. [Déploiement](#déploiement)
9. [Guide de développement](#guide-de-développement)

---

##  VUE D'ENSEMBLE

### Description du Projet

**MediDiag** est une application web de diagnostic médical intelligent qui combine :
- **Intelligence Artificielle** (Machine Learning - Random Forest)
- **Fuzzy Matching** (RapidFuzz)
- **Base de données médicale** (1000 maladies)

### Objectifs

1. Aider les professionnels de santé dans le diagnostic
2. Fournir des recommandations d'examens complémentaires
3. Calculer des scores de probabilité pour chaque maladie
4. Gérer les dossiers patients de manière sécurisée

### Technologies Utilisées

#### Backend
- **FastAPI** 0.104+ - Framework web moderne et rapide
- **Python** 3.9+ - Langage de programmation
- **SQLite** - Base de données locale
- **Pandas** - Manipulation de données
- **Scikit-learn** - Machine Learning
- **RapidFuzz** - Matching textuel
- **PyJWT** - Authentification JWT

#### Frontend
- **React** 18+ - Bibliothèque UI
- **Vite** - Build tool moderne
- **TailwindCSS** - Framework CSS utility-first
- **React Hook Form** - Gestion des formulaires
- **Zod** - Validation de schémas
- **Axios** - Client HTTP
- **Lucide React** - Icônes

#### DevOps
- **Docker** - Conteneurisation
- **Docker Compose** - Orchestration
- **Nginx** - Serveur web (production)

---

##  ARCHITECTURE GLOBALE

### Schéma d'Architecture

\\\

                      UTILISATEUR                             
                    (Médecin/Infirmier)                       

                         
                         

                   FRONTEND REACT                             
            
     Pages          Components       Services         
   - Login         - UI Kit        - API Client       
   - Dashboard     - Forms         - Auth             
   - Patients      - Tables        - Validation       
   - Consult              
                                             

                          HTTP/REST API
                         

                   BACKEND FASTAPI                            
            
     Routes          Services        Models           
   - Auth          - Diagnostic    - Request          
   - Patients      - Matching      - Response         
   - Diagnostic    - Scoring       - Database         
   - Metadata      - ML                 
                             

                         
         
                                       
    
   SQLite         Dataset       ML Models  
  Database       (1000         - Random    
 - Patients      maladies)       Forest    
 - Users                       - TF-IDF    
 - Consult                     - Encoders  
    
\\\

### Flux de Données

1. **Authentification**
   - User  Frontend  Backend (JWT)
   - Token stocké dans localStorage
   - Refresh token pour renouvellement

2. **Diagnostic**
   - Symptômes  Preprocessing  Fuzzy Matching (30%)
   - Symptômes  ML Model  Predictions (70%)
   - Hybrid Score  Top 10 maladies  Frontend

3. **Gestion Patients**
   - CRUD Operations  SQLite
   - Code unique auto-généré
   - Historique consultations

---

