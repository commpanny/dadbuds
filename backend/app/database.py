from __future__ import annotations

import os
from pathlib import Path

from sqlmodel import Session, SQLModel, create_engine

backend_dir = Path(__file__).resolve().parent.parent
default_db = f"sqlite:///{backend_dir / 'dadbuds.db'}"
DATABASE_URL = os.getenv("DATABASE_URL", default_db)

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, echo=False, connect_args=connect_args)


def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
