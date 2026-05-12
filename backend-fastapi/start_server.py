"""
Simplified server startup script with detailed logging
"""
import sys
import logging

# Configure logging first
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

logger.info("=" * 60)
logger.info("Starting Medical Diagnostic API...")
logger.info("=" * 60)

try:
    logger.info("Step 1: Importing uvicorn...")
    import uvicorn
    logger.info("✅ uvicorn imported")
    
    logger.info("Step 2: Importing FastAPI app...")
    from app.main import app
    logger.info("✅ App imported")
    
    logger.info("Step 3: Starting server on 127.0.0.1:8000...")
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")
    
except Exception as e:
    logger.error(f"❌ Error: {e}", exc_info=True)
    sys.exit(1)
