"""
Configuration settings for the Medical Diagnostic API
"""
from pydantic import model_validator
from pydantic_settings import BaseSettings
from typing import List
import os

# Valeur d'exemple : acceptée en développement seulement. Quiconque lit ce code la connaît,
# donc elle permettrait de fabriquer un jeton de session valide pour n'importe quel rôle.
DEFAULT_SECRET_KEY = "your-secret-key-change-this-in-production-min-32-characters"
LOCAL_ENVIRONMENTS = {"development", "dev", "local", "test", "testing"}


class Settings(BaseSettings):
    """Application settings"""

    # Application
    APP_NAME: str = "Medical Diagnostic API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"

    # Server
    HOST: str = "127.0.0.1"
    PORT: int = 8000

    # Database
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_NAME: str = "medidag"
    DB_USER: str = "root"
    DB_PASSWORD: str = ""

    # Security
    SECRET_KEY: str = DEFAULT_SECRET_KEY
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]

    # Dataset
    DATASET_PATH: str = "app/datasets/1000_Maladies_Complet_Age_Sexe.csv"

    # Logging
    LOG_LEVEL: str = "INFO"

    @model_validator(mode="after")
    def require_real_secret_outside_dev(self) -> "Settings":
        if self.ENVIRONMENT.lower() not in LOCAL_ENVIRONMENTS:
            if self.SECRET_KEY == DEFAULT_SECRET_KEY or len(self.SECRET_KEY) < 32:
                raise ValueError(
                    "SECRET_KEY doit être définie (32 caractères minimum, différente de l'exemple) "
                    f"quand ENVIRONMENT={self.ENVIRONMENT}. Générez-en une : "
                    "python -c \"import secrets; print(secrets.token_hex(32))\""
                )
        return self

    class Config:
        env_file = ".env"
        case_sensitive = True


# Create settings instance
settings = Settings()
