from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import router as api_router
from app.core.database import init_db, engine
from app.core.logging import setup_logging, set_correlation_id
from app.core.config import settings
import time
import uuid
import logging

setup_logging()
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="2.9.0",
    docs_url="/api/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/api/redoc" if settings.ENVIRONMENT != "production" else None
)

@app.on_event("startup")
def on_startup():
    init_db()
    logger.info(f"Application started in {settings.ENVIRONMENT} mode.")
    if not settings.OPENAI_API_KEY:
        logger.warning("OPENAI_API_KEY not set. AI semantic reasoning will be inactive.")

# Correlation ID and Performance Middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    correlation_id = request.headers.get("X-Correlation-ID", str(uuid.uuid4()))
    set_correlation_id(correlation_id)
    
    start_time = time.time()
    response: Response = await call_next(request)
    process_time = time.time() - start_time
    
    response.headers["X-Process-Time"] = str(process_time)
    response.headers["X-Correlation-ID"] = correlation_id
    
    # Log request details
    logger.info(
        f"{request.method} {request.url.path} handled in {process_time:.4f}s with status {response.status_code}",
        extra={"extra_fields": {
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "duration": process_time
        }}
    )
    
    return response

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(
        f"Unhandled exception: {str(exc)}",
        exc_info=True,
        extra={"extra_fields": {"path": request.url.path}}
    )
    return Response(
        content='{"detail": "Internal server failure. Refer to correlation ID for diagnosis."}',
        status_code=500,
        media_type="application/json"
    )

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": f"{settings.PROJECT_NAME} API v2.9.0 is running", "env": settings.ENVIRONMENT}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": time.time()}

@app.get("/ready")
async def readiness_check():
    # Validate critical dependencies
    try:
        # Check DB connectivity
        from sqlalchemy import text
        from app.core.database import SessionLocal
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
    except Exception as e:
        logger.critical(f"Readiness check failed: Database unreachable. {str(e)}")
        return Response(status_code=503, content='{"status": "not_ready", "reason": "database_unreachable"}')
    
    return {"status": "ready"}
