# Migration SQLite vers MySQL

## Pourquoi MySQL ?
- ✅ Plus robuste pour la production
- ✅ Meilleure gestion de la concurrence
- ✅ Performances supérieures avec beaucoup de données
- ✅ Support des transactions complexes

## Étapes de migration

### 1. Installer MySQL

**Windows** :
- Télécharger MySQL Installer : https://dev.mysql.com/downloads/installer/
- Ou utiliser XAMPP/WAMP qui inclut MySQL

**Vérifier l'installation** :
```bash
mysql --version
```

### 2. Créer la base de données

```sql
CREATE DATABASE medical_diagnostic CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'medical_user'@'localhost' IDENTIFIED BY 'medical_password';
GRANT ALL PRIVILEGES ON medical_diagnostic.* TO 'medical_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Installer le driver MySQL pour Python

```bash
cd backend-fastapi
pip install pymysql
```

### 4. Créer le fichier de connexion MySQL

**Fichier** : `backend-fastapi/app/database/mysql_connection.py`

```python
"""
MySQL Database Connection
"""
import pymysql
from pymysql.cursors import DictCursor
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

# Configuration MySQL
MYSQL_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'medical_user',
    'password': 'medical_password',
    'database': 'medical_diagnostic',
    'charset': 'utf8mb4',
    'cursorclass': DictCursor
}


def get_connection():
    """Get MySQL database connection"""
    return pymysql.connect(**MYSQL_CONFIG)


def init_database():
    """Initialize database with tables"""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # Create patients table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS patients (
                id INT AUTO_INCREMENT PRIMARY KEY,
                code_patient VARCHAR(50) UNIQUE NOT NULL,
                nom VARCHAR(100) NOT NULL,
                prenom VARCHAR(100) NOT NULL,
                date_naissance DATE NOT NULL,
                sexe ENUM('M', 'F') NOT NULL,
                telephone VARCHAR(20),
                email VARCHAR(100),
                adresse TEXT,
                antecedents_medicaux TEXT,
                allergies TEXT,
                groupe_sanguin VARCHAR(10),
                created_at DATETIME NOT NULL,
                updated_at DATETIME,
                derniere_visite DATETIME,
                INDEX idx_code_patient (code_patient),
                INDEX idx_nom (nom),
                INDEX idx_email (email)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """)
        
        # Create users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                nom VARCHAR(100) NOT NULL,
                prenom VARCHAR(100) NOT NULL,
                role ENUM('medecin', 'infirmier', 'administrateur') NOT NULL,
                created_at DATETIME NOT NULL,
                updated_at DATETIME,
                INDEX idx_email (email)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """)
        
        # Create consultations table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS consultations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                patient_id INT NOT NULL,
                medecin_id INT NOT NULL,
                date_consultation DATETIME NOT NULL,
                motif TEXT,
                symptomes TEXT,
                diagnostic TEXT,
                traitement TEXT,
                notes TEXT,
                created_at DATETIME NOT NULL,
                FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
                FOREIGN KEY (medecin_id) REFERENCES users(id),
                INDEX idx_patient (patient_id),
                INDEX idx_medecin (medecin_id),
                INDEX idx_date (date_consultation)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """)
        
        # Create diagnostics table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS diagnostics (
                id INT AUTO_INCREMENT PRIMARY KEY,
                consultation_id INT NOT NULL,
                patient_id INT NOT NULL,
                symptomes TEXT NOT NULL,
                analyses TEXT,
                resultats TEXT NOT NULL,
                score DECIMAL(5,2),
                urgence VARCHAR(20),
                created_at DATETIME NOT NULL,
                FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE,
                FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
                INDEX idx_patient (patient_id),
                INDEX idx_consultation (consultation_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """)
        
        conn.commit()
        logger.info("✅ MySQL database initialized")
        
        # Insert demo users if not exist
        cursor.execute("SELECT COUNT(*) as count FROM users")
        if cursor.fetchone()['count'] == 0:
            now = datetime.now()
            
            demo_users = [
                ('medecin@demo.com', 'demo123', 'Dupont', 'Jean', 'medecin', now),
                ('infirmier@demo.com', 'demo123', 'Martin', 'Marie', 'infirmier', now),
                ('admin@demo.com', 'demo123', 'Admin', 'System', 'administrateur', now),
            ]
            
            cursor.executemany("""
                INSERT INTO users (email, password_hash, nom, prenom, role, created_at)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, demo_users)
            
            conn.commit()
            logger.info("✅ Demo users created")
        
    except Exception as e:
        logger.error(f"❌ Database initialization error: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()


def execute_query(query: str, params: tuple = (), fetch_one: bool = False, fetch_all: bool = False):
    """Execute a query and return results"""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute(query, params)
        
        if fetch_one:
            result = cursor.fetchone()
        elif fetch_all:
            result = cursor.fetchall()
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
```

### 5. Mettre à jour les routes

Dans `backend-fastapi/app/routes/patients.py`, remplacer :
```python
from app.database.sqlite_connection import execute_query, get_connection
```

Par :
```python
from app.database.mysql_connection import execute_query, get_connection
```

**Note** : Les requêtes SQL changent légèrement :
- SQLite : `?` pour les paramètres
- MySQL : `%s` pour les paramètres

### 6. Configuration dans .env

**Fichier** : `backend-fastapi/.env`

```env
# Database
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=medical_user
DB_PASSWORD=medical_password
DB_NAME=medical_diagnostic

# API
HOST=0.0.0.0
PORT=8000
DEBUG=True
```

### 7. Redémarrer le backend

```bash
cd backend-fastapi
python run.py
```

## Avantages de MySQL

| Fonctionnalité | SQLite | MySQL |
|----------------|--------|-------|
| Fichier unique | ✅ | ❌ |
| Multi-utilisateurs | ⚠️ Limité | ✅ Excellent |
| Performances | ⚠️ Moyen | ✅ Élevé |
| Transactions | ✅ | ✅ |
| Sauvegardes | ⚠️ Copie fichier | ✅ mysqldump |
| Production | ❌ | ✅ |

## Migration des données existantes

Si vous avez déjà des données dans SQLite :

```bash
# Exporter depuis SQLite
sqlite3 backend-fastapi/data/medical.db .dump > dump.sql

# Adapter le format pour MySQL (remplacer les types)
# Puis importer dans MySQL
mysql -u medical_user -p medical_diagnostic < dump_adapted.sql
```

## Docker Compose avec MySQL

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: medical_diagnostic
      MYSQL_USER: medical_user
      MYSQL_PASSWORD: medical_password
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

  backend:
    build: ./backend-fastapi
    depends_on:
      - mysql
    environment:
      DB_HOST: mysql
      DB_PORT: 3306

volumes:
  mysql_data:
```

## Prochaines étapes

1. ✅ Installer MySQL
2. ✅ Créer la base de données
3. ✅ Installer pymysql
4. ✅ Créer mysql_connection.py
5. ✅ Mettre à jour les imports
6. ✅ Adapter les requêtes SQL (? → %s)
7. ✅ Tester la connexion
8. ✅ Migrer les données si nécessaire
