"""
MySQL connection — drop-in replacement for sqlite_connection.py

Differences handled transparently:
  - ? placeholders → %s
  - rows returned as _Row (dict + integer-index support, like sqlite3.Row)

Usage: change import only, no query changes needed.
"""
import mysql.connector
from mysql.connector import pooling
import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

_pool: Optional[pooling.MySQLConnectionPool] = None


def _get_pool() -> pooling.MySQLConnectionPool:
    global _pool
    if _pool is None:
        _pool = pooling.MySQLConnectionPool(
            pool_name="medidag_pool",
            pool_size=5,
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", "3306")),
            database=os.getenv("DB_NAME", "medidag"),
            user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASSWORD", ""),
            charset="utf8mb4",
            use_unicode=True,
            autocommit=False,
        )
        logger.info("MySQL connection pool created (medidag@%s)", os.getenv("DB_HOST", "localhost"))
    return _pool


# ── Compatibility layer ───────────────────────────────────────

class _Row(dict):
    """Dict that also supports integer indexing — mimics sqlite3.Row."""
    def __getitem__(self, key):
        if isinstance(key, int):
            return list(self.values())[key]
        return super().__getitem__(key)


class _Cursor:
    """Wraps MySQLCursorDict: converts ? → %s, returns _Row objects."""

    def __init__(self, cursor):
        self._c = cursor

    def execute(self, query: str, params: tuple = ()):
        self._c.execute(query.replace("?", "%s"), params)

    def executemany(self, query: str, params_list):
        self._c.executemany(query.replace("?", "%s"), params_list)

    def fetchone(self):
        row = self._c.fetchone()
        return _Row(row) if row else None

    def fetchall(self):
        return [_Row(r) for r in (self._c.fetchall() or [])]

    @property
    def lastrowid(self):
        return self._c.lastrowid

    @property
    def rowcount(self):
        return self._c.rowcount


class _Connection:
    """Wraps a MySQL connection with sqlite3-compatible API."""

    def __init__(self, conn):
        self._conn = conn

    def cursor(self):
        return _Cursor(self._conn.cursor(dictionary=True))

    def commit(self):
        self._conn.commit()

    def rollback(self):
        self._conn.rollback()

    def close(self):
        self._conn.close()


# ── Public API (same as sqlite_connection.py) ─────────────────

def get_connection() -> _Connection:
    """Get a connection from the pool (behaves like sqlite3.connect)."""
    return _Connection(_get_pool().get_connection())


def execute_query(
    query: str,
    params: tuple = (),
    fetch_one: bool = False,
    fetch_all: bool = False,
):
    """Execute a query and optionally return results as dicts."""
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
    except Exception as exc:
        conn.rollback()
        logger.error("MySQL error: %s | query: %.120s", exc, query)
        raise
    finally:
        conn.close()


def dict_from_row(row) -> dict:
    if row is None:
        return None
    return dict(row)


# ── Schema init (called on first import) ──────────────────────

def init_database():
    """Verify connection and insert demo users if the table is empty."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        # Just verify the connection and seed demo data if needed
        cursor.execute("SELECT COUNT(*) as n FROM users")
        row = cursor.fetchone()
        if row and row["n"] == 0:
            from datetime import datetime
            from app.utils.auth_helper import hash_password
            now = datetime.now().isoformat()
            cursor.execute(
                "INSERT INTO users (email, password_hash, nom, prenom, role, specialite, created_at) "
                "VALUES (%s,%s,%s,%s,%s,%s,%s)",
                ("medecin@demo.com", hash_password("demo123"), "Dupont", "Jean", "medecin", "Médecine générale", now),
            )
            med_id = cursor.lastrowid
            cursor.execute("INSERT INTO medecins (user_id, numero_rpps, service) VALUES (%s,%s,%s)",
                           (med_id, "RPPS-001", "Médecine interne"))
            cursor.execute(
                "INSERT INTO users (email, password_hash, nom, prenom, role, created_at) VALUES (%s,%s,%s,%s,%s,%s)",
                ("infirmier@demo.com", hash_password("demo123"), "Martin", "Marie", "infirmier", now),
            )
            inf_id = cursor.lastrowid
            cursor.execute("INSERT INTO infirmiers (user_id, service, grade) VALUES (%s,%s,%s)",
                           (inf_id, "Urgences", "IDE"))
            cursor.execute(
                "INSERT INTO users (email, password_hash, nom, prenom, role, created_at) VALUES (%s,%s,%s,%s,%s,%s)",
                ("admin@demo.com", hash_password("demo123"), "Admin", "System", "administrateur", now),
            )
            adm_id = cursor.lastrowid
            cursor.execute("INSERT INTO administrateurs (user_id, niveau_acces) VALUES (%s,%s)", (adm_id, 1))
            conn.commit()
            logger.info("Demo users seeded.")
        logger.info("MySQL connection OK — %d user(s) in DB", row["n"] if row else 0)
    except Exception as e:
        conn.rollback()
        raise
    finally:
        conn.close()


# Run on import — only verifies connection, never drops tables
try:
    init_database()
except Exception as e:
    logger.warning("MySQL init skipped: %s", e)
