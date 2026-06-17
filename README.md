# DadBuds

DadBuds is a local social coordination helper for dads in the Spokane pilot market. The MVP lets people sign up, share availability, browse suggested plans, RSVP, and gives admins a manual dashboard for creating plans and logging fake SMS/Discord messages before real integrations exist.

## Stack

- Frontend: React, Vite, Tailwind, React Router
- Backend: FastAPI, SQLModel, Alembic-ready models
- Database: `DATABASE_URL` driven. Defaults to local SQLite for fast development, supports Postgres with `postgresql+psycopg://...`.

## Quick Start

Install frontend dependencies:

```bash
npm install
```

Install backend dependencies:

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install -r backend/requirements.txt
```

Run the API:

```bash
. .venv/bin/activate
uvicorn app.main:app --reload --app-dir backend
```

Run the web app:

```bash
npm run dev
```

The frontend defaults to `http://localhost:8000` for the API. Override with `VITE_API_URL` if needed.

## MVP Integrations

Twilio, Discord, and OpenAI are intentionally placeholders. Admin message actions create or update rows in the message log with `fake-sent` status.

