from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import router as api_router
from app.core.database import init_db
from app.core.logging import setup_logging

setup_logging()
app = FastAPI(title="AI Finance-Ops Agent API")

@app.on_event("startup")
def on_startup():
    init_db()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "AI Finance-Ops Agent API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
