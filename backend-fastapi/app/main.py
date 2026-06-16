"""
FastAPI Main Application - Medical Diagnostic API
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import logging
import time

from app.config import settings
from app.routes import diagnostic, maladies, patients, auth, metadata, consultations
from app.routes import diagnostics_history, vitals, feedback, admin
from app.services.preprocessing_service import get_dataset_loader
from app.services.exam_classifier_service import get_exam_classifier
from app.services.symptom_normalizer_service import get_symptom_normalizer
from app.ml.predictor import get_ml_predictor
from app.database.mysql_connection import get_connection as _db_get_connection

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
    ## 🏥 Medical Diagnostic API
    
    API intelligente d'aide au diagnostic médical basée sur l'analyse des symptômes.
    
    ### Fonctionnalités principales:
    
    * **Diagnostic intelligent** - Analyse des symptômes et correspondance avec 1000 maladies
    * **Scoring avancé** - Calcul de scores de probabilité et niveaux d'urgence
    * **Recommandations** - Suggestions d'examens complémentaires
    * **Filtrage** - Par âge, sexe et symptômes
    * **Base de données** - 1000 maladies avec symptômes et analyses détaillés
    
    ### Technologies:
    
    * FastAPI
    * Pandas & NumPy
    * RapidFuzz (matching textuel)
    * scikit-learn
    
    ### ⚠️ Avertissement médical:
    
    Cette API est un **outil d'aide à la décision** et ne remplace pas une consultation médicale.
    Toujours consulter un professionnel de santé qualifié.
    """,
    docs_url="/docs",
    redoc_url="/redoc",
    debug=settings.DEBUG
)


@app.on_event("startup")
async def startup_event():
    """
    Startup event - Load dataset
    """
    logger.info("🚀 Starting Medical Diagnostic API...")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    
    # Load dataset
    try:
        dataset_loader = get_dataset_loader()
        logger.info(f"✅ Dataset loaded: {len(dataset_loader.df)} diseases")
    except Exception as e:
        logger.error(f"❌ Failed to load dataset: {e}")
        raise

    # Initialize exam classifier and enrich from dataset
    try:
        classifier = get_exam_classifier()
        classifier.enrich_from_dataset(dataset_loader.df)
        logger.info("✅ Exam classifier ready")
    except Exception as e:
        logger.warning(f"⚠️ Exam classifier init failed (non-fatal): {e}")

    # Initialize symptom normalizer vocabulary from dataset
    try:
        normalizer = get_symptom_normalizer()
        normalizer.build_vocabulary(dataset_loader.df)
        logger.info("✅ Symptom normalizer ready")
    except Exception as e:
        logger.warning(f"⚠️ Symptom normalizer init failed (non-fatal): {e}")

    # Pre-load ML model so the first user request is not penalised
    try:
        ml = get_ml_predictor()
        if not ml.is_loaded:
            ml.load_model()
        logger.info("✅ ML model pre-loaded")
    except Exception as e:
        logger.warning(f"⚠️ ML model pre-load failed (non-fatal): {e}")

    # Warm MySQL connection pool (avoids ~300ms penalty on first DB request)
    try:
        conn = _db_get_connection()
        conn.close()
        logger.info("✅ MySQL pool warmed")
    except Exception as e:
        logger.warning(f"⚠️ MySQL pool warm-up failed (non-fatal): {e}")


    logger.info("✅ API is ready to accept requests")


@app.on_event("shutdown")
async def shutdown_event():
    """
    Shutdown event
    """
    logger.info("🛑 Shutting down Medical Diagnostic API...")


# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Add processing time to response headers"""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(round(process_time, 3))
    return response


# Exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors"""
    logger.warning(f"Validation error: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "error": "Validation Error",
            "detail": exc.errors(),
            "body": exc.body
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal Server Error",
            "detail": str(exc) if settings.DEBUG else "An error occurred"
        }
    )


# Include routers
app.include_router(diagnostic.router, prefix="/api/v1")
app.include_router(maladies.router, prefix="/api/v1")
app.include_router(patients.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1")
app.include_router(metadata.router, prefix="/api/v1")
app.include_router(consultations.router, prefix="/api/v1")
app.include_router(diagnostics_history.router, prefix="/api/v1")
app.include_router(vitals.router, prefix="/api/v1")
app.include_router(feedback.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """
    Root endpoint - API information
    """
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "operational",
        "environment": settings.ENVIRONMENT,
        "docs": "/docs",
        "redoc": "/redoc",
        "endpoints": {
            "diagnostic": "/api/v1/diagnostic",
            "maladies": "/api/v1/maladies",
            "health": "/api/v1/diagnostic/health"
        }
    }


@app.get("/health", tags=["Health"])
async def health():
    """
    Health check endpoint
    """
    try:
        dataset_loader = get_dataset_loader()
        diseases_count = len(dataset_loader.df) if dataset_loader.df is not None else 0
        
        return {
            "status": "healthy",
            "version": settings.APP_VERSION,
            "environment": settings.ENVIRONMENT,
            "dataset": {
                "loaded": diseases_count > 0,
                "diseases_count": diseases_count
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "error": str(e)
            }
        )


@app.get("/api/v1", tags=["API Info"])
async def api_info():
    """
    API v1 information
    """
    return {
        "version": "1.0",
        "endpoints": {
            "diagnostic": {
                "POST /diagnostic/": "Perform full diagnostic",
                "POST /diagnostic/quick": "Quick diagnostic (top 5)",
                "POST /diagnostic/summary": "Get diagnostic summary",
                "POST /diagnostic/examinations": "Get recommended examinations",
                "GET /diagnostic/stats": "Get system statistics",
                "GET /diagnostic/health": "Health check"
            },
            "maladies": {
                "GET /maladies/": "List all diseases",
                "GET /maladies/{id}": "Get disease by ID",
                "GET /maladies/search/{query}": "Search diseases",
                "GET /maladies/filter/age/{age}": "Filter by age",
                "GET /maladies/categories/stats": "Get categories stats"
            }
        }
    }


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )
