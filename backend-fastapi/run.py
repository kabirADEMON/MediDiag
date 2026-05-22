"""
Run script for the Medical Diagnostic API
"""
import uvicorn
from app.config import settings

if __name__ == "__main__":
    print("=" * 60)
    print(f"[MediDiag] {settings.APP_NAME} v{settings.APP_VERSION}")
    print("=" * 60)
    print(f"Environment: {settings.ENVIRONMENT}")
    print(f"Host: {settings.HOST}:{settings.PORT}")
    print(f"Debug: {settings.DEBUG}")
    print(f"Docs: http://{settings.HOST}:{settings.PORT}/docs")
    print("=" * 60)
    
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=False,  # Disabled reload for Windows compatibility
        log_level=settings.LOG_LEVEL.lower()
    )
