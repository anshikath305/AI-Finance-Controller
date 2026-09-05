import logging
import logging.config
import re
import sys
import json
import uuid
from typing import Optional
from app.core.config import settings

# Global context for correlation ID (used by filter)
_correlation_id = None

def set_correlation_id(id: str):
    global _correlation_id
    _correlation_id = id

def get_correlation_id() -> str:
    global _correlation_id
    return _correlation_id or "SYSTEM"

class StructuredFormatter(logging.Formatter):
    def format(self, record):
        log_entry = {
            "timestamp": self.formatTime(record),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "correlation_id": get_correlation_id(),
            "module": record.module,
            "funcName": record.funcName,
        }
        
        # Add extra fields if they exist
        if hasattr(record, "extra_fields"):
            log_entry.update(record.extra_fields)
            
        # Redact secrets in message
        log_entry["message"] = self._redact(log_entry["message"])
        
        return json.dumps(log_entry)

    def _redact(self, message: str) -> str:
        # Redact OpenAI Keys
        message = re.sub(r'sk-[a-zA-Z0-9]{32,}', '[REDACTED API KEY]', message)
        # Redact Authorization headers if accidentally logged
        message = re.sub(r'Bearer\s+[a-zA-Z0-9\._\-]+', '[REDACTED TOKEN]', message)
        return message

class SensitiveDataFilter(logging.Filter):
    def filter(self, record):
        return True # Handled by formatter now

def setup_logging():
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    
    config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "structured": {
                "()": StructuredFormatter,
            },
            "standard": {
                "format": "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
            }
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "structured" if settings.ENVIRONMENT == "production" else "standard",
                "stream": sys.stdout,
            },
        },
        "root": {
            "level": log_level,
            "handlers": ["console"],
        },
    }
    
    logging.config.dictConfig(config)
