"""
Authentication routes - User authentication and authorization
"""
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timedelta
import logging
import jwt

from app.config import settings
from app.models.response_models import SuccessResponse
from app.database.mysql_connection import get_connection
from app.utils.auth_helper import hash_password, verify_password

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()


def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


_SUBCLASS_FIELDS = """
    SELECT u.*,
           m.numero_rpps, m.service AS service_dept,
           inf.grade,
           adm.niveau_acces
    FROM users u
    LEFT JOIN medecins       m   ON m.user_id   = u.id
    LEFT JOIN infirmiers     inf ON inf.user_id  = u.id
    LEFT JOIN administrateurs adm ON adm.user_id = u.id
"""


def _get_user_by_email(email: str) -> dict | None:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(_SUBCLASS_FIELDS + " WHERE LOWER(u.email) = ?", (email.lower(),))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def _get_user_by_id(user_id: int) -> dict | None:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(_SUBCLASS_FIELDS + " WHERE u.id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def _insert_subclass(cursor, user_id: int, role: str, data: dict):
    """Insert into the role-specific subclass table after creating a user."""
    if role == "medecin":
        cursor.execute(
            "INSERT INTO medecins (user_id, numero_rpps, service) VALUES (?, ?, ?)",
            (user_id, data.get("numero_rpps"), data.get("service")),
        )
    elif role == "infirmier":
        cursor.execute(
            "INSERT INTO infirmiers (user_id, service, grade) VALUES (?, ?, ?)",
            (user_id, data.get("service"), data.get("grade", "IDE")),
        )
    elif role == "administrateur":
        cursor.execute(
            "INSERT INTO administrateurs (user_id, niveau_acces) VALUES (?, ?)",
            (user_id, data.get("niveau_acces", 1)),
        )


@router.post("/login")
def login(credentials: dict):
    try:
        email = credentials.get('email')
        password = credentials.get('password')

        if not email or not password:
            raise HTTPException(status_code=400, detail="Email et mot de passe requis")

        user = _get_user_by_email(email)
        if not user or not verify_password(password, user['password_hash']):
            raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")

        if not user.get('is_active', 1):
            raise HTTPException(status_code=403, detail="Ce compte est désactivé. Contactez un administrateur.")

        # Auto-migrate plain-text password to bcrypt on successful login
        if not user['password_hash'].startswith(('$2b$', '$2a$', '$2y$')):
            conn_m = get_connection()
            cur_m = conn_m.cursor()
            cur_m.execute("UPDATE users SET password_hash = ? WHERE id = ?",
                          (hash_password(password), user['id']))
            conn_m.commit()
            conn_m.close()

        access_token = create_access_token(
            data={"sub": user['email'], "user_id": user['id'], "role": user['role']}
        )
        refresh_token = create_refresh_token(
            data={"sub": user['email'], "user_id": user['id']}
        )

        user_data = {k: v for k, v in user.items() if k != 'password_hash'}

        return SuccessResponse(
            success=True,
            message="Connexion réussie",
            data={
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer",
                "user": user_data,
            },
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erreur lors de la connexion: {str(e)}")


@router.post("/logout")
def logout():
    return SuccessResponse(success=True, message="Déconnexion réussie", data={})


@router.post("/refresh")
def refresh_token(token_data: dict):
    try:
        token = token_data.get('refresh_token')
        if not token:
            raise HTTPException(status_code=400, detail="Refresh token requis")

        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            user_id = payload.get("user_id")
            if not user_id:
                raise HTTPException(status_code=401, detail="Token invalide")

            user = _get_user_by_id(user_id)
            if not user:
                raise HTTPException(status_code=401, detail="Utilisateur non trouvé")

            access_token = create_access_token(
                data={"sub": user['email'], "user_id": user['id'], "role": user['role']}
            )
            return SuccessResponse(
                success=True,
                message="Token rafraîchi",
                data={"access_token": access_token, "token_type": "bearer"},
            )
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Refresh token expiré")
        except jwt.JWTError:
            raise HTTPException(status_code=401, detail="Token invalide")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Refresh token error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/me")
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        try:
            payload = jwt.decode(credentials.credentials, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            user_id = payload.get("user_id")
            if not user_id:
                raise HTTPException(status_code=401, detail="Token invalide")
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token expiré")
        except jwt.JWTError:
            raise HTTPException(status_code=401, detail="Token invalide")

        user = _get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=401, detail="Utilisateur non trouvé")

        user_data = {k: v for k, v in user.items() if k != 'password_hash'}
        return SuccessResponse(success=True, message="Utilisateur trouvé", data=user_data)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get current user error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/users")
def get_all_users(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("role") != "administrateur":
            raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs")

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, email, nom, prenom, role, specialite, is_active, created_at FROM users ORDER BY id")
        users = [dict(row) for row in cursor.fetchall()]
        conn.close()

        return SuccessResponse(
            success=True,
            message=f"{len(users)} utilisateur(s)",
            data={"users": users, "total": len(users)},
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/users")
def create_user(
    user_data: dict,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """Create a new user — Admin only."""
    try:
        payload = jwt.decode(credentials.credentials, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("role") != "administrateur":
            raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs")

        required = ['email', 'password', 'nom', 'prenom', 'role']
        for field in required:
            if not user_data.get(field):
                raise HTTPException(status_code=400, detail=f"Champ requis: {field}")

        conn = get_connection()
        cursor = conn.cursor()

        email_normalized = user_data['email'].lower()
        cursor.execute("SELECT id FROM users WHERE LOWER(email) = ?", (email_normalized,))
        if cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=400, detail="Email déjà utilisé")

        now = datetime.now().isoformat()
        cursor.execute(
            """INSERT INTO users (email, password_hash, nom, prenom, role, specialite, must_change_password, created_at)
               VALUES (?, ?, ?, ?, ?, ?, 1, ?)""",
            (
                email_normalized,
                hash_password(user_data['password']),
                user_data['nom'],
                user_data['prenom'],
                user_data['role'],
                user_data.get('specialite'),
                now,
            ),
        )
        new_id = cursor.lastrowid
        _insert_subclass(cursor, new_id, user_data['role'], user_data)
        conn.commit()
        conn.close()

        return SuccessResponse(
            success=True,
            message="Utilisateur créé",
            data={
                "id": new_id,
                "email": user_data['email'],
                "nom": user_data['nom'],
                "prenom": user_data['prenom'],
                "role": user_data['role'],
                "specialite": user_data.get('specialite'),
                "created_at": now,
            },
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/users/{user_id}")
def delete_user(user_id: int, credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("role") != "administrateur":
            raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs")
        if payload.get("user_id") == user_id:
            raise HTTPException(status_code=400, detail="Impossible de supprimer votre propre compte")

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE id = ?", (user_id,))
        if not cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

        cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
        conn.commit()
        conn.close()

        return SuccessResponse(success=True, message="Utilisateur supprimé", data={"id": user_id})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/users/{user_id}/toggle-active")
def toggle_user_active(user_id: int, credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("role") != "administrateur":
            raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs")

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, is_active FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

        new_status = 0 if row['is_active'] else 1
        cursor.execute("UPDATE users SET is_active = ? WHERE id = ?", (new_status, user_id))
        conn.commit()
        conn.close()

        action = "activé" if new_status else "désactivé"
        return SuccessResponse(
            success=True,
            message=f"Compte {action} avec succès",
            data={"id": user_id, "is_active": bool(new_status)}
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/me")
def update_profile(
    profile_data: dict,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    try:
        payload = jwt.decode(credentials.credentials, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("user_id")

        current_password = profile_data.get('current_password')
        if not current_password:
            raise HTTPException(status_code=400, detail="Mot de passe requis pour modifier le profil")

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT password_hash FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        if not row or not verify_password(current_password, row['password_hash']):
            conn.close()
            raise HTTPException(status_code=400, detail="Mot de passe incorrect")

        allowed = ['nom', 'prenom', 'specialite']
        updates = {k: v for k, v in profile_data.items() if k in allowed}
        if not updates:
            conn.close()
            raise HTTPException(status_code=400, detail="Aucun champ valide à mettre à jour")

        set_clause = ", ".join(f"{k} = ?" for k in updates)
        values = list(updates.values()) + [user_id]

        cursor.execute(f"UPDATE users SET {set_clause} WHERE id = ?", values)
        conn.commit()

        cursor.execute("SELECT id, email, nom, prenom, role, specialite FROM users WHERE id = ?", (user_id,))
        user = dict(cursor.fetchone())
        conn.close()

        return SuccessResponse(success=True, message="Profil mis à jour", data=user)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/me/password")
def change_password(
    pwd_data: dict,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    try:
        payload = jwt.decode(credentials.credentials, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("user_id")

        current_password = pwd_data.get('current_password', '')
        new_password = pwd_data.get('new_password', '')

        if not current_password or not new_password:
            raise HTTPException(status_code=400, detail="Mot de passe actuel et nouveau requis")
        if len(new_password) < 6:
            raise HTTPException(status_code=400, detail="Le nouveau mot de passe doit faire au moins 6 caractères")

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT password_hash FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        if not row or not verify_password(current_password, row['password_hash']):
            conn.close()
            raise HTTPException(status_code=400, detail="Mot de passe actuel incorrect")

        cursor.execute(
            "UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?",
            (hash_password(new_password), user_id),
        )
        conn.commit()
        conn.close()

        return SuccessResponse(success=True, message="Mot de passe modifié avec succès", data={})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/register")
def register(user_data: dict):
    try:
        required_fields = ['email', 'password', 'nom', 'prenom', 'role']
        for field in required_fields:
            if not user_data.get(field):
                raise HTTPException(status_code=400, detail=f"Champ requis manquant: {field}")

        conn = get_connection()
        cursor = conn.cursor()

        email_normalized = user_data['email'].lower()
        cursor.execute("SELECT id FROM users WHERE LOWER(email) = ?", (email_normalized,))
        if cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=400, detail="Un utilisateur avec cet email existe déjà")

        now = datetime.now().isoformat()
        cursor.execute(
            """INSERT INTO users (email, password_hash, nom, prenom, role, specialite, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (
                email_normalized,
                hash_password(user_data['password']),
                user_data['nom'],
                user_data['prenom'],
                user_data['role'],
                user_data.get('specialite'),
                now,
            ),
        )
        new_id = cursor.lastrowid
        _insert_subclass(cursor, new_id, user_data['role'], user_data)
        conn.commit()
        conn.close()

        access_token = create_access_token(
            data={"sub": email_normalized, "user_id": new_id, "role": user_data['role']}
        )

        return SuccessResponse(
            success=True,
            message="Utilisateur créé avec succès",
            data={
                "access_token": access_token,
                "token_type": "bearer",
                "user": {
                    "id": new_id,
                    "email": email_normalized,
                    "nom": user_data['nom'],
                    "prenom": user_data['prenom'],
                    "role": user_data['role'],
                    "specialite": user_data.get('specialite'),
                },
            },
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'inscription: {str(e)}")
