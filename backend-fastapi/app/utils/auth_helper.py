"""
Auth helper - Extract and verify JWT role from requests
"""
from fastapi import HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
import bcrypt
from app.config import settings


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(plain: str, hashed: str) -> bool:
    """Verify password against bcrypt hash. Falls back to plain-text for legacy accounts."""
    try:
        if hashed.startswith(('$2b$', '$2a$', '$2y$')):
            return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))
        return plain == hashed  # legacy plain-text (will be migrated on next login)
    except Exception:
        return False

security = HTTPBearer(auto_error=False)


def get_role_from_token(credentials: HTTPAuthorizationCredentials) -> str:
    """Extract role from Bearer token. Returns role string or raises 401."""
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token requis")
    try:
        payload = jwt.decode(credentials.credentials, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        role = payload.get("role")
        if not role:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide")
        return role
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expiré")
    except (jwt.PyJWTError, jwt.exceptions.DecodeError, Exception):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide")


def require_role(credentials: HTTPAuthorizationCredentials, allowed_roles: list):
    """Raise 403 if role not in allowed_roles."""
    role = get_role_from_token(credentials)
    if role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Accès refusé. Rôles autorisés: {', '.join(allowed_roles)}"
        )
    return role
