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

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()

# Mock users database (à remplacer par une vraie base de données)
users_db = [
    {
        "id": 1,
        "email": "medecin@demo.com",
        "password": "demo123",  # En production, utiliser bcrypt
        "nom": "Dupont",
        "prenom": "Jean",
        "role": "medecin",
        "specialite": "Médecine générale"
    },
    {
        "id": 2,
        "email": "infirmier@demo.com",
        "password": "demo123",
        "nom": "Martin",
        "prenom": "Marie",
        "role": "infirmier",
        "specialite": None
    },
    {
        "id": 3,
        "email": "admin@demo.com",
        "password": "demo123",
        "nom": "Admin",
        "prenom": "Super",
        "role": "administrateur",
        "specialite": None
    }
]


def create_access_token(data: dict, expires_delta: timedelta = None):
    """Create JWT access token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    return encoded_jwt


def create_refresh_token(data: dict):
    """Create JWT refresh token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


@router.post("/login")
async def login(credentials: dict):
    """
    User login
    
    **Request Body:**
    - email: User email
    - password: User password
    
    **Returns:**
    - access_token: JWT access token
    - refresh_token: JWT refresh token
    - user: User information
    """
    try:
        email = credentials.get('email')
        password = credentials.get('password')
        
        if not email or not password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email et mot de passe requis"
            )
        
        # Find user
        user = next((u for u in users_db if u['email'] == email), None)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou mot de passe incorrect"
            )
        
        # Verify password (en production, utiliser bcrypt)
        if user['password'] != password:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou mot de passe incorrect"
            )
        
        # Create tokens
        access_token = create_access_token(
            data={"sub": user['email'], "user_id": user['id'], "role": user['role']}
        )
        refresh_token = create_refresh_token(
            data={"sub": user['email'], "user_id": user['id']}
        )
        
        # Remove password from response
        user_data = {k: v for k, v in user.items() if k != 'password'}
        
        return SuccessResponse(
            success=True,
            message="Connexion réussie",
            data={
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer",
                "user": user_data
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la connexion: {str(e)}"
        )


@router.post("/logout")
async def logout():
    """
    User logout
    
    **Returns:**
    - Success message
    """
    return SuccessResponse(
        success=True,
        message="Déconnexion réussie",
        data={}
    )


@router.post("/refresh")
async def refresh_token(token_data: dict):
    """
    Refresh access token
    
    **Request Body:**
    - refresh_token: JWT refresh token
    
    **Returns:**
    - access_token: New JWT access token
    """
    try:
        refresh_token = token_data.get('refresh_token')
        
        if not refresh_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Refresh token requis"
            )
        
        # Verify refresh token
        try:
            payload = jwt.decode(
                refresh_token,
                settings.SECRET_KEY,
                algorithms=[settings.ALGORITHM]
            )
            email = payload.get("sub")
            user_id = payload.get("user_id")
            
            if not email or not user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token invalide"
                )
            
            # Find user
            user = next((u for u in users_db if u['id'] == user_id), None)
            
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Utilisateur non trouvé"
                )
            
            # Create new access token
            access_token = create_access_token(
                data={"sub": user['email'], "user_id": user['id'], "role": user['role']}
            )
            
            return SuccessResponse(
                success=True,
                message="Token rafraîchi",
                data={
                    "access_token": access_token,
                    "token_type": "bearer"
                }
            )
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token expiré"
            )
        except jwt.JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token invalide"
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Refresh token error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors du rafraîchissement du token: {str(e)}"
        )


@router.get("/me")
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Get current user information
    
    **Headers:**
    - Authorization: Bearer {access_token}
    
    **Returns:**
    - User information
    """
    try:
        token = credentials.credentials
        
        # Verify token
        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.ALGORITHM]
            )
            user_id = payload.get("user_id")
            
            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token invalide"
                )
            
            # Find user
            user = next((u for u in users_db if u['id'] == user_id), None)
            
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Utilisateur non trouvé"
                )
            
            # Remove password from response
            user_data = {k: v for k, v in user.items() if k != 'password'}
            
            return SuccessResponse(
                success=True,
                message="Utilisateur trouvé",
                data=user_data
            )
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token expiré"
            )
        except jwt.JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token invalide"
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get current user error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération de l'utilisateur: {str(e)}"
        )


@router.post("/register")
async def register(user_data: dict):
    """
    Register new user
    
    **Request Body:**
    - email: User email
    - password: User password
    - nom: Last name
    - prenom: First name
    - role: User role (medecin, infirmier, administrateur)
    
    **Returns:**
    - Created user with tokens
    """
    try:
        # Validate required fields
        required_fields = ['email', 'password', 'nom', 'prenom', 'role']
        for field in required_fields:
            if field not in user_data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Champ requis manquant: {field}"
                )
        
        # Check if user already exists
        existing_user = next((u for u in users_db if u['email'] == user_data['email']), None)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Un utilisateur avec cet email existe déjà"
            )
        
        # Create new user
        new_user = {
            "id": len(users_db) + 1,
            "email": user_data['email'],
            "password": user_data['password'],  # En production, hasher avec bcrypt
            "nom": user_data['nom'],
            "prenom": user_data['prenom'],
            "role": user_data['role'],
            "specialite": user_data.get('specialite'),
            "created_at": datetime.now().isoformat()
        }
        
        users_db.append(new_user)
        
        # Create tokens
        access_token = create_access_token(
            data={"sub": new_user['email'], "user_id": new_user['id'], "role": new_user['role']}
        )
        
        # Remove password from response
        user_response = {k: v for k, v in new_user.items() if k != 'password'}
        
        return SuccessResponse(
            success=True,
            message="Utilisateur créé avec succès",
            data={
                "access_token": access_token,
                "token_type": "bearer",
                "user": user_response
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de l'inscription: {str(e)}"
        )
