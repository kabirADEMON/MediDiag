"""
Configuration settings for the Medical Diagnostic API
"""
from pydantic_settings import BaseSettings
from typing import List
import os


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
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/medical_diagnostic"
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_NAME: str = "medical_diagnostic"
    DB_USER: str = "postgres"
    DB_PASSWORD: str = "password"
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-this-in-production-min-32-characters"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]
    
    # Dataset
    DATASET_PATH: str = "app/datasets/1000_Maladies_Complet_Age_Sexe.csv"
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Create settings instance
settings = Settings()