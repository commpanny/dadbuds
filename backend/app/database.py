from __future__ import annotations

import os
from pathlib import Path

from sqlmodel import Session, SQLModel, create_engine

backend_dir = Path(__file__).resolve().parent.parent
default_db = f"sqlite:///{backend_dir / 'dadbuds.db'}"
raw_database_url = os.getenv("DATABASE_URL", default_db)


def normalize_database_url(url: str) -> str:
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg://", 1)
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


DATABASE_URL = normalize_database_url(raw_database_url)

app_env = os.getenv("APP_ENV", "development").strip().lower()
if (
    app_env == "production"
    and DATABASE_URL.startswith("sqlite")
    and os.getenv("ALLOW_SQLITE_IN_PRODUCTION", "false").strip().lower() != "true"
):
    raise RuntimeError(
        "SQLite is disabled in production. Use a managed Postgres DATABASE_URL "
        "with TLS enabled, or explicitly set ALLOW_SQLITE_IN_PRODUCTION=true "
        "for a private non-production instance."
    )

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, echo=False, connect_args=connect_args)


def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
