import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import NullPool

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./cricket_app.db").strip()


def normalize_database_url(url: str) -> str:
    """Normalize common hosted-Postgres URLs for the psycopg 3 driver."""
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg://", 1)
    if url.startswith("postgresql://") and "+psycopg" not in url:
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


DATABASE_URL = normalize_database_url(DATABASE_URL)
engine_options = {"pool_pre_ping": True, "pool_recycle": 300}

if DATABASE_URL.startswith("sqlite"):
    engine_options["connect_args"] = {"check_same_thread": False}

# Serverless instances should not retain idle database connections between invocations.
if os.getenv("VERCEL"):
    engine_options["poolclass"] = NullPool

engine = create_engine(DATABASE_URL, **engine_options)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


def get_db():
    if os.getenv("VERCEL") and engine.dialect.name == "sqlite":
        from fastapi import HTTPException

        raise HTTPException(
            status_code=503,
            detail="Persistent storage is not configured. Set DATABASE_URL to a hosted PostgreSQL database.",
        )

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
