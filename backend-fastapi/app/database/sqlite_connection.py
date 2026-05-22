"""
SQLite Database Connection
Simple local database for development
"""
import sqlite3
from pathlib import Path
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Database file path
DB_PATH = Path(__file__).parent.parent.parent / "data" / "medical.db"
DB_PATH.parent.mkdir(exist_ok=True)


def get_connection():
    """Get SQLite database connection"""
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row  # Return rows as dictionaries
    return conn


def init_database():
    """Initialize database with tables"""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # Create patients table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS patients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code_patient TEXT UNIQUE NOT NULL,
                nom TEXT NOT NULL,
                prenom TEXT NOT NULL,
                date_naissance TEXT NOT NULL,
                sexe TEXT NOT NULL,
                telephone TEXT,
                email TEXT,
                adresse TEXT,
                antecedents_medicaux TEXT,
                allergies TEXT,
                groupe_sanguin TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT,
                derniere_visite TEXT
            )
        """)
        
        # Create users table for authentication
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                nom TEXT NOT NULL,
                prenom TEXT NOT NULL,
                role TEXT NOT NULL,
                specialite TEXT,
                is_active INTEGER NOT NULL DEFAULT 1,
                must_change_password INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT
            )
        """)
        
        # Create consultations table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS consultations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id INTEGER NOT NULL,
                medecin_id INTEGER NOT NULL,
                date_consultation TEXT NOT NULL,
                motif TEXT,
                symptomes TEXT,
                diagnostic TEXT,
                traitement TEXT,
                notes TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (patient_id) REFERENCES patients (id),
                FOREIGN KEY (medecin_id) REFERENCES users (id)
            )
        """)
        
        # Create diagnostics table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS diagnostics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                consultation_id INTEGER NOT NULL,
                patient_id INTEGER NOT NULL,
                symptomes TEXT NOT NULL,
                analyses TEXT,
                resultats TEXT NOT NULL,
                score REAL,
                urgence TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (consultation_id) REFERENCES consultations (id),
                FOREIGN KEY (patient_id) REFERENCES patients (id)
            )
        """)

        # Create vitals table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS vitals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id INTEGER NOT NULL,
                infirmier_id INTEGER,
                temperature TEXT,
                pression TEXT,
                pouls TEXT,
                spo2 TEXT,
                poids TEXT,
                taille TEXT,
                observations TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (patient_id) REFERENCES patients (id),
                FOREIGN KEY (infirmier_id) REFERENCES users (id)
            )
        """)

        # Create diagnostic_feedback table (for model retraining)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS diagnostic_feedback (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                consultation_id INTEGER NOT NULL,
                patient_id INTEGER NOT NULL,
                medecin_id INTEGER NOT NULL,
                diagnostic_ia TEXT NOT NULL,
                score_ia REAL,
                valide INTEGER NOT NULL DEFAULT 0,
                diagnostic_final TEXT,
                score_final REAL,
                commentaire TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (consultation_id) REFERENCES consultations (id),
                FOREIGN KEY (patient_id) REFERENCES patients (id),
                FOREIGN KEY (medecin_id) REFERENCES users (id)
            )
        """)

        # Migrations — add columns if missing
        for migration in [
            "ALTER TABLE users ADD COLUMN specialite TEXT",
            "ALTER TABLE users ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1",
            "ALTER TABLE users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0",
        ]:
            try:
                cursor.execute(migration)
            except Exception:
                pass

        conn.commit()
        logger.info(f"✅ Database initialized at {DB_PATH}")
        
        # Insert demo users if not exist
        cursor.execute("SELECT COUNT(*) FROM users")
        if cursor.fetchone()[0] == 0:
            from datetime import datetime
            now = datetime.now().isoformat()
            
            demo_users = [
                ('medecin@demo.com', 'demo123', 'Dupont', 'Jean', 'medecin', now),
                ('infirmier@demo.com', 'demo123', 'Martin', 'Marie', 'infirmier', now),
                ('admin@demo.com', 'demo123', 'Admin', 'System', 'administrateur', now),
            ]
            
            cursor.executemany("""
                INSERT INTO users (email, password_hash, nom, prenom, role, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, demo_users)
            
            conn.commit()
            logger.info("✅ Demo users created")
        
    except Exception as e:
        logger.error(f"❌ Database initialization error: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()


def dict_from_row(row) -> dict:
    """Convert SQLite Row to dictionary"""
    if row is None:
        return None
    return dict(row)


def execute_query(query: str, params: tuple = (), fetch_one: bool = False, fetch_all: bool = False):
    """Execute a query and return results"""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute(query, params)
        
        if fetch_one:
            result = dict_from_row(cursor.fetchone())
        elif fetch_all:
            result = [dict_from_row(row) for row in cursor.fetchall()]
        else:
            result = cursor.lastrowid
        
        conn.commit()
        return result
    except Exception as e:
        conn.rollback()
        logger.error(f"Query error: {e}")
        raise
    finally:
        conn.close()


# Initialize database on module import
init_database()
