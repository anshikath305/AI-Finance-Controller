from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Finance Controller"
    ENVIRONMENT: str = "development"  # development, test, production
    
    # Database
    DATABASE_URL: str = "sqlite:///./finance_agent.db"
    
    # Security
    JWT_SECRET_KEY: str = "finance-ops-super-secret-key-for-dev"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day for dev
    
    # AI Provider
    OPENAI_API_KEY: Optional[str] = None
    
    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]
    
    # Limits
    MAX_FILE_SIZE_BYTES: int = 5 * 1024 * 1024  # 5MB
    MAX_ROWS_PER_FILE: int = 10000
    RATE_LIMIT_PER_MINUTE: int = 10
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True
    )

settings = Settings()
