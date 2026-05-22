-- ============================================================
-- MediDiag — Schéma MySQL complet (12 tables)
-- Exécuter dans phpMyAdmin sur la base "medidag"
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS diagnostic_feedback;
DROP TABLE IF EXISTS diagnostic_resultats;
DROP TABLE IF EXISTS rapports_medicaux;
DROP TABLE IF EXISTS dossiers_medicaux;
DROP TABLE IF EXISTS resultats_analyses;
DROP TABLE IF EXISTS analyses;
DROP TABLE IF EXISTS symptomes;
DROP TABLE IF EXISTS diagnostics;
DROP TABLE IF EXISTS vitals;
DROP TABLE IF EXISTS consultations;
DROP TABLE IF EXISTS patients;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- ─── 1. Utilisateurs ─────────────────────────────────────────
CREATE TABLE users (
    id            INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
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

-- ─── 2. Patients ─────────────────────────────────────────────
CREATE TABLE patients (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code_patient         VARCHAR(20)  UNIQUE NOT NULL,
    nom                  VARCHAR(100) NOT NULL,
    prenom               VARCHAR(100) NOT NULL,
    date_naissance       VARCHAR(20)  NOT NULL,
    sexe                 VARCHAR(5)   NOT NULL,
    telephone            VARCHAR(20),               -- format E.164
    email                VARCHAR(255),
    adresse              TEXT,
    antecedents_medicaux TEXT,
    allergies            TEXT,
    groupe_sanguin       VARCHAR(5),
    derniere_visite      VARCHAR(30),
    created_at           VARCHAR(30)  NOT NULL,
    updated_at           VARCHAR(30)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── 3. Dossiers médicaux (1 par patient) ────────────────────
CREATE TABLE dossiers_medicaux (
    id                    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    patient_id            INT UNSIGNED UNIQUE NOT NULL,
    numero_dossier        VARCHAR(20)  UNIQUE NOT NULL,
    medecin_referent_id   INT UNSIGNED,
    observations_generales TEXT,
    created_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            DATETIME     ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_dm_patient  FOREIGN KEY (patient_id)          REFERENCES patients(id) ON DELETE CASCADE,
    CONSTRAINT fk_dm_medecin  FOREIGN KEY (medecin_referent_id) REFERENCES users(id)    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── 4. Consultations ────────────────────────────────────────
CREATE TABLE consultations (
    id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    patient_id        INT UNSIGNED NOT NULL,
    medecin_id        INT UNSIGNED NOT NULL,
    date_consultation VARCHAR(30)  NOT NULL,
    motif             TEXT,
    symptomes         TEXT,                         -- JSON list (compatibilité routes)
    diagnostic        TEXT,                         -- mis à jour par diagnostic_feedback
    traitement        TEXT,
    notes             TEXT,
    created_at        VARCHAR(30)  NOT NULL,
    CONSTRAINT fk_cons_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT,
    CONSTRAINT fk_cons_medecin FOREIGN KEY (medecin_id) REFERENCES users(id)    ON DELETE RESTRICT,
    INDEX idx_cons_patient (patient_id),
    INDEX idx_cons_date    (date_consultation(20))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── 5. Symptômes (un par ligne) ─────────────────────────────
CREATE TABLE symptomes (
    id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    consultation_id  INT UNSIGNED NOT NULL,
    nom              VARCHAR(200) NOT NULL,
    intensite        ENUM('faible','modéré','sévère') DEFAULT 'modéré',
    CONSTRAINT fk_sym_cons FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE,
    INDEX idx_sym_cons (consultation_id),
    INDEX idx_sym_nom  (nom)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── 6. Catalogue des analyses biologiques ───────────────────
CREATE TABLE analyses (
    id            INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
    nom           VARCHAR(200)  UNIQUE NOT NULL,    -- ex: "Bilirubine", "NFS"
    unite_normale VARCHAR(50),                      -- ex: "mg/dL"
    valeur_min    DECIMAL(10,3),                    -- norme basse
    valeur_max    DECIMAL(10,3),                    -- norme haute
    description   TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── 7. Résultats d'analyses par consultation ────────────────
CREATE TABLE resultats_analyses (
    id               INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
    consultation_id  INT UNSIGNED  NOT NULL,
    analyse_id       INT UNSIGNED,                  -- NULL si analyse hors catalogue
    analyse_nom      VARCHAR(200)  NOT NULL,
    valeur_num       DECIMAL(10,3),
    valeur_texte     VARCHAR(50),                   -- "Positif" / "Négatif"
    unite            VARCHAR(20),
    anormal          TINYINT(1)    NOT NULL DEFAULT 0,
    CONSTRAINT fk_ra_cons    FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE,
    CONSTRAINT fk_ra_analyse FOREIGN KEY (analyse_id)      REFERENCES analyses(id)      ON DELETE SET NULL,
    INDEX idx_ra_cons (consultation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── 8. Diagnostics IA (run ML par consultation) ─────────────
CREATE TABLE diagnostics (
    id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    consultation_id  INT UNSIGNED NOT NULL,
    patient_id       INT UNSIGNED NOT NULL,
    symptomes        TEXT         NOT NULL,          -- JSON list (compatibilité)
    analyses         TEXT,                           -- JSON dict (compatibilité)
    resultats        TEXT         NOT NULL,          -- JSON array résultats ML
    score            DECIMAL(5,2),
    urgence          VARCHAR(20),
    created_at       VARCHAR(30)  NOT NULL,
    CONSTRAINT fk_diag_cons    FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE,
    CONSTRAINT fk_diag_patient FOREIGN KEY (patient_id)      REFERENCES patients(id)      ON DELETE RESTRICT,
    INDEX idx_diag_cons    (consultation_id),
    INDEX idx_diag_patient (patient_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── 9. Résultats individuels du moteur IA (Top 4) ───────────
CREATE TABLE diagnostic_resultats (
    id                  INT UNSIGNED   AUTO_INCREMENT PRIMARY KEY,
    diagnostic_id       INT UNSIGNED   NOT NULL,
    rang                TINYINT UNSIGNED NOT NULL,  -- 1=principal, 2-4=alternatifs
    maladie             VARCHAR(200)   NOT NULL,
    score               DECIMAL(5,2)   NOT NULL,
    urgence             VARCHAR(20),
    compatibilite_age   TINYINT(1),
    compatibilite_sexe  TINYINT(1),
    CONSTRAINT fk_res_diag FOREIGN KEY (diagnostic_id) REFERENCES diagnostics(id) ON DELETE CASCADE,
    INDEX idx_res_diag (diagnostic_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── 10. Constantes vitales ──────────────────────────────────
CREATE TABLE vitals (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    patient_id    INT UNSIGNED NOT NULL,
    infirmier_id  INT UNSIGNED,
    temperature   VARCHAR(20),                       -- "37.5"
    pression      VARCHAR(20),                       -- "120/80"
    pouls         VARCHAR(20),                       -- "72"
    spo2          VARCHAR(20),                       -- "98"
    poids         VARCHAR(20),                       -- "70.5"
    taille        VARCHAR(20),                       -- "175"
    observations  TEXT,
    created_at    VARCHAR(30)  NOT NULL,
    CONSTRAINT fk_vit_patient   FOREIGN KEY (patient_id)   REFERENCES patients(id) ON DELETE RESTRICT,
    CONSTRAINT fk_vit_infirmier FOREIGN KEY (infirmier_id) REFERENCES users(id)    ON DELETE SET NULL,
    INDEX idx_vit_patient (patient_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── 11. Rapports médicaux ───────────────────────────────────
CREATE TABLE rapports_medicaux (
    id               INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
    consultation_id  INT UNSIGNED  NOT NULL,
    medecin_id       INT UNSIGNED  NOT NULL,
    patient_id       INT UNSIGNED  NOT NULL,
    titre            VARCHAR(200)  NOT NULL,
    contenu          TEXT,
    type_rapport     ENUM('diagnostic','suivi','sortie') NOT NULL DEFAULT 'diagnostic',
    created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rap_cons    FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE,
    CONSTRAINT fk_rap_medecin FOREIGN KEY (medecin_id)      REFERENCES users(id)         ON DELETE RESTRICT,
    CONSTRAINT fk_rap_patient FOREIGN KEY (patient_id)      REFERENCES patients(id)      ON DELETE RESTRICT,
    INDEX idx_rap_cons    (consultation_id),
    INDEX idx_rap_patient (patient_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── 12. Retour médecin sur le diagnostic IA ─────────────────
CREATE TABLE diagnostic_feedback (
    id               INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
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
    CONSTRAINT fk_fb_cons    FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE,
    CONSTRAINT fk_fb_patient FOREIGN KEY (patient_id)      REFERENCES patients(id)      ON DELETE RESTRICT,
    CONSTRAINT fk_fb_medecin FOREIGN KEY (medecin_id)      REFERENCES users(id)         ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ─── 13. Spécialisation Médecin (héritage users) ─────────────
CREATE TABLE medecins (
    user_id      INT UNSIGNED PRIMARY KEY,
    numero_rpps  VARCHAR(20),               -- identifiant national professionnel
    service      VARCHAR(100),              -- service hospitalier
    CONSTRAINT fk_med_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── 14. Spécialisation Infirmier (héritage users) ────────────
CREATE TABLE infirmiers (
    user_id  INT UNSIGNED PRIMARY KEY,
    service  VARCHAR(100),
    grade    ENUM('IDE','IADE','IBODE','cadre') DEFAULT 'IDE',
    CONSTRAINT fk_inf_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── 15. Spécialisation Administrateur (héritage users) ───────
CREATE TABLE administrateurs (
    user_id       INT UNSIGNED PRIMARY KEY,
    niveau_acces  TINYINT UNSIGNED NOT NULL DEFAULT 1,
    CONSTRAINT fk_adm_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ─── Données de démonstration ────────────────────────────────
INSERT INTO users (email, password_hash, nom, prenom, role, specialite) VALUES
  ('medecin@demo.com',   'demo123', 'Dupont', 'Jean',   'medecin',        'Médecine générale'),
  ('infirmier@demo.com', 'demo123', 'Martin', 'Marie',  'infirmier',       NULL),
  ('admin@demo.com',     'demo123', 'Admin',  'System', 'administrateur',  NULL);

INSERT INTO medecins (user_id, numero_rpps, service) VALUES
  (1, 'RPPS-001', 'Médecine interne');

INSERT INTO infirmiers (user_id, service, grade) VALUES
  (2, 'Urgences', 'IDE');

INSERT INTO administrateurs (user_id, niveau_acces) VALUES
  (3, 1);
