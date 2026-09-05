from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.database import Base
from app.core.config import settings

SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

# For SQLite, we use StaticPool for in-memory or different threading defaults
engine_args = {"connect_args": {"check_same_thread": False}} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {}

if not SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine_args.update({
        "pool_size": 20,
        "max_overflow": 10
    })

engine = create_engine(SQLALCHEMY_DATABASE_URL, **engine_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
