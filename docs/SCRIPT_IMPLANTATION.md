# Script d'implantation de la base de données

> **SGBD :** MySQL 8.x &nbsp;·&nbsp; **Base :** `medidag` &nbsp;·&nbsp; **Encodage :** utf8mb4

---

```sql
-- ============================================================
-- MediDiag — Script d'implantation complet (15 tables)
-- Exécuter dans phpMyAdmin sur la base "medidag"
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS administrateurs;
DROP TABLE IF EXISTS infirmiers;
DROP TABLE IF EXISTS medecins;
DROP TABLE IF EXISTS diagnostic_feedback;
DROP TABLE IF EXISTS diagnostic_resultats;
DROP TABLE IF EXISTS rapports_medicaux;
DROP TABLE IF EXISTS vitals;
DROP TABLE IF EXISTS diagnostics;
DROP TABLE IF EXISTS resultats_analyses;
DROP TABLE IF EXISTS analyses;
DROP TABLE IF EXISTS symptomes;
DROP TABLE IF EXISTS consultations;
DROP TABLE IF EXISTS dossiers_medicaux;
DROP TABLE IF EXISTS patients;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;


-- ─── 1. Utilisateurs ─────────────────────────────────────────────────────────
CREATE TABLE users (
    id_user       INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
    email         VARCHAR(255)  UNIQUE NOT NULL,
    password_hash VARCHAR(255)  NOT NULL,
    nom           VARCHAR(100)  NOT NULL,
    prenom        VARCHAR(100)  NOT NULL,
    role          ENUM('medecin','infirmier','administrateur') NOT NULL,
    specialite    VARCHAR(100),
    is_active     TINYINT(1)    NOT NULL DEFAULT 1,
    created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME      ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ─── 2. Patients ─────────────────────────────────────────────────────────────
CREATE TABLE patients (
    id_patient           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code_patient         VARCHAR(20)  UNIQUE NOT NULL,
    nom                  VARCHAR(100) NOT NULL,
    prenom               VARCHAR(100) NOT NULL,
    date_naissance       VARCHAR(20)  NOT NULL,
    sexe                 VARCHAR(5)   NOT NULL,
    telephone            VARCHAR(20),
    email                VARCHAR(255),
    adresse              TEXT,
    antecedents_medicaux TEXT,
    allergies            TEXT,
    groupe_sanguin       VARCHAR(5),
    derniere_visite      VARCHAR(30),
    created_at           VARCHAR(30)  NOT NULL,
    updated_at           VARCHAR(30)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ─── 3. Dossiers médicaux (1 par patient) ────────────────────────────────────
CREATE TABLE dossiers_medicaux (
    id_dossier             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    patient_id             INT UNSIGNED UNIQUE NOT NULL,
    numero_dossier         VARCHAR(20)  UNIQUE NOT NULL,
    medecin_referent_id    INT UNSIGNED,
    observations_generales TEXT,
    created_at             DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at             DATETIME     ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_dm_patient  FOREIGN KEY (patient_id)          REFERENCES patients(id_patient) ON DELETE CASCADE,
    CONSTRAINT fk_dm_medecin  FOREIGN KEY (medecin_referent_id) REFERENCES users(id_user)       ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ─── 4. Consultations ────────────────────────────────────────────────────────
CREATE TABLE consultations (
    id_consultation   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    patient_id        INT UNSIGNED NOT NULL,
    medecin_id        INT UNSIGNED NOT NULL,
    date_consultation VARCHAR(30)  NOT NULL,
    motif             TEXT,
    symptomes         TEXT,
    diagnostic        TEXT,
    traitement        TEXT,
    notes             TEXT,
    created_at        VARCHAR(30)  NOT NULL,
    CONSTRAINT fk_cons_patient FOREIGN KEY (patient_id) REFERENCES patients(id_patient) ON DELETE RESTRICT,
    CONSTRAINT fk_cons_medecin FOREIGN KEY (medecin_id) REFERENCES users(id_user)       ON DELETE RESTRICT,
    INDEX idx_cons_patient (patient_id),
    INDEX idx_cons_date    (date_consultation(20))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ─── 5. Symptômes ────────────────────────────────────────────────────────────
CREATE TABLE symptomes (
    id_symptome      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    consultation_id  INT UNSIGNED NOT NULL,
    nom              VARCHAR(200) NOT NULL,
    intensite        ENUM('faible','modéré','sévère') DEFAULT 'modéré',
    CONSTRAINT fk_sym_cons FOREIGN KEY (consultation_id) REFERENCES consultations(id_consultation) ON DELETE CASCADE,
    INDEX idx_sym_cons (consultation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ─── 6. Catalogue des analyses biologiques ───────────────────────────────────
CREATE TABLE analyses (
    id_analyse    INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
    nom           VARCHAR(200)  UNIQUE NOT NULL,
    unite_normale VARCHAR(50),
    valeur_min    DECIMAL(10,3),
    valeur_max    DECIMAL(10,3),
    description   TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ─── 7. Résultats d'analyses par consultation ────────────────────────────────
CREATE TABLE resultats_analyses (
    id_resAnalyse    INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
    consultation_id  INT UNSIGNED  NOT NULL,
    analyse_id       INT UNSIGNED,
    analyse_nom      VARCHAR(200)  NOT NULL,
    valeur_num       DECIMAL(10,3),
    valeur_texte     VARCHAR(50),
    unite            VARCHAR(20),
    anormal          TINYINT(1)    NOT NULL DEFAULT 0,
    CONSTRAINT fk_ra_cons    FOREIGN KEY (consultation_id) REFERENCES consultations(id_consultation) ON DELETE CASCADE,
    CONSTRAINT fk_ra_analyse FOREIGN KEY (analyse_id)      REFERENCES analyses(id_analyse)           ON DELETE SET NULL,
    INDEX idx_ra_cons (consultation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ─── 8. Diagnostics IA ───────────────────────────────────────────────────────
CREATE TABLE diagnostics (
    id_diagnostic    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    consultation_id  INT UNSIGNED NOT NULL,
    patient_id       INT UNSIGNED NOT NULL,
    symptomes        TEXT         NOT NULL,
    analyses         TEXT,
    resultats        TEXT         NOT NULL,
    score            DECIMAL(5,2),
    urgence          VARCHAR(20),
    created_at       VARCHAR(30)  NOT NULL,
    CONSTRAINT fk_diag_cons    FOREIGN KEY (consultation_id) REFERENCES consultations(id_consultation) ON DELETE CASCADE,
    CONSTRAINT fk_diag_patient FOREIGN KEY (patient_id)      REFERENCES patients(id_patient)           ON DELETE RESTRICT,
    INDEX idx_diag_cons    (consultation_id),
    INDEX idx_diag_patient (patient_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ─── 9. Résultats individuels du moteur IA (Top 4) ───────────────────────────
CREATE TABLE diagnostic_resultats (
    id_diagnosticResul   INT UNSIGNED     AUTO_INCREMENT PRIMARY KEY,
    diagnostic_id        INT UNSIGNED     NOT NULL,
    rang                 TINYINT UNSIGNED NOT NULL,
    maladie              VARCHAR(200)     NOT NULL,
    score                DECIMAL(5,2)     NOT NULL,
    urgence              VARCHAR(20),
    compatibilite_age    TINYINT(1),
    compatibilite_sexe   TINYINT(1),
    CONSTRAINT fk_res_diag FOREIGN KEY (diagnostic_id) REFERENCES diagnostics(id_diagnostic) ON DELETE CASCADE,
    INDEX idx_res_diag (diagnostic_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ─── 10. Constantes vitales ──────────────────────────────────────────────────
CREATE TABLE vitals (
    id_vital      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    patient_id    INT UNSIGNED NOT NULL,
    infirmier_id  INT UNSIGNED,
    temperature   VARCHAR(20),
    pression      VARCHAR(20),
    pouls         VARCHAR(20),
    spo2          VARCHAR(20),
    poids         VARCHAR(20),
    taille        VARCHAR(20),
    observations  TEXT,
    created_at    VARCHAR(30)  NOT NULL,
    CONSTRAINT fk_vit_patient   FOREIGN KEY (patient_id)   REFERENCES patients(id_patient) ON DELETE RESTRICT,
    CONSTRAINT fk_vit_infirmier FOREIGN KEY (infirmier_id) REFERENCES users(id_user)       ON DELETE SET NULL,
    INDEX idx_vit_patient (patient_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ─── 11. Rapports médicaux ───────────────────────────────────────────────────
CREATE TABLE rapports_medicaux (
    id_rapport       INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
    consultation_id  INT UNSIGNED  NOT NULL,
    medecin_id       INT UNSIGNED  NOT NULL,
    patient_id       INT UNSIGNED  NOT NULL,
    titre            VARCHAR(200)  NOT NULL,
    contenu          TEXT,
    type_rapport     ENUM('diagnostic','suivi','sortie') NOT NULL DEFAULT 'diagnostic',
    created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rap_cons    FOREIGN KEY (consultation_id) REFERENCES consultations(id_consultation) ON DELETE CASCADE,
    CONSTRAINT fk_rap_medecin FOREIGN KEY (medecin_id)      REFERENCES users(id_user)                 ON DELETE RESTRICT,
    CONSTRAINT fk_rap_patient FOREIGN KEY (patient_id)      REFERENCES patients(id_patient)           ON DELETE RESTRICT,
    INDEX idx_rap_cons    (consultation_id),
    INDEX idx_rap_patient (patient_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ─── 12. Retour médecin sur le diagnostic IA ─────────────────────────────────
CREATE TABLE diagnostic_feedback (
    id_feed          INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
    consultation_id  INT UNSIGNED  NOT NULL,
    patient_id       INT UNSIGNED  NOT NULL,
    medecin_id       INT UNSIGNED  NOT NULL,
    diagnostic_ia    VARCHAR(200)  NOT NULL,
    score_ia         DECIMAL(5,2),
    valide           TINYINT(1)    NOT NULL DEFAULT 0,
    diagnostic_final VARCHAR(200),
    score_final      DECIMAL(5,2),
    commentaire      TEXT,
    created_at       VARCHAR(30)   NOT NULL,
    CONSTRAINT fk_fb_cons    FOREIGN KEY (consultation_id) REFERENCES consultations(id_consultation) ON DELETE CASCADE,
    CONSTRAINT fk_fb_patient FOREIGN KEY (patient_id)      REFERENCES patients(id_patient)           ON DELETE RESTRICT,
    CONSTRAINT fk_fb_medecin FOREIGN KEY (medecin_id)      REFERENCES users(id_user)                 ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ─── 13. Spécialisation Médecin ──────────────────────────────────────────────
CREATE TABLE medecins (
    id_medecin   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id      INT UNSIGNED NOT NULL,
    numero_rpps  VARCHAR(20),
    service      VARCHAR(100),
    CONSTRAINT fk_med_user FOREIGN KEY (user_id) REFERENCES users(id_user) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ─── 14. Spécialisation Infirmier ────────────────────────────────────────────
CREATE TABLE infirmiers (
    id_infirmier INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id      INT UNSIGNED NOT NULL,
    service      VARCHAR(100),
    grade        ENUM('IDE','IADE','IBODE','cadre') DEFAULT 'IDE',
    CONSTRAINT fk_inf_user FOREIGN KEY (user_id) REFERENCES users(id_user) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ─── 15. Spécialisation Administrateur ───────────────────────────────────────
CREATE TABLE administrateurs (
    id_admin      INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id       INT UNSIGNED NOT NULL,
    niveau_acces  TINYINT UNSIGNED NOT NULL DEFAULT 1,
    CONSTRAINT fk_adm_user FOREIGN KEY (user_id) REFERENCES users(id_user) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ─── Données initiales de démonstration ──────────────────────────────────────
INSERT INTO users (email, password_hash, nom, prenom, role, specialite, is_active) VALUES
  ('medecin@demo.com',   '$2b$12$demo_hash_medecin',   'Dupont', 'Jean',   'medecin',        'Médecine générale', 1),
  ('infirmier@demo.com', '$2b$12$demo_hash_infirmier',  'Martin', 'Marie',  'infirmier',       NULL,               1),
  ('admin@demo.com',     '$2b$12$demo_hash_admin',      'Admin',  'System', 'administrateur',  NULL,               1);

INSERT INTO medecins (user_id, numero_rpps, service) VALUES
  (1, 'RPPS-001', 'Médecine interne');

INSERT INTO infirmiers (user_id, service, grade) VALUES
  (2, 'Urgences', 'IDE');

INSERT INTO administrateurs (user_id, niveau_acces) VALUES
  (3, 1);
```

---

> **Note :** Les mots de passe de démonstration (`demo123`) sont hachés en bcrypt lors de la première connexion via l'auto-migration implémentée dans la route `/auth/login`.
