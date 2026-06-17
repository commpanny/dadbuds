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
export ADMIN_TOKEN=dev-dadbuds-admin
uvicorn app.main:app --reload --app-dir backend
```

Run the web app:

```bash
npm run dev
```

The frontend defaults to `http://localhost:8000` for the API. Override with `VITE_API_URL` if needed.

## Admin Auth

Admin pages and admin API routes require a shared admin token for the pilot.

- Backend: set `ADMIN_TOKEN` before starting the API.
- Frontend: open `/admin` and enter that token in the browser gate.
- Optional local convenience: set `VITE_ADMIN_TOKEN` for a dev-only preloaded token. Do not use `VITE_ADMIN_TOKEN` as a real production secret because Vite exposes it to the browser bundle.

Protected admin API routes include user listing, all-availability listing, availability status updates, plan creation, draft plan listing, all-RSVP listing, message generation, message listing, message creation, and fake-send logging.

## Production Environment

The backend reads `DATABASE_URL` and accepts hosted Postgres URLs in either `postgres://`, `postgresql://`, or `postgresql+psycopg://` form.

Recommended production values:

```bash
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/dadbuds
ADMIN_TOKEN=<long random secret>
FRONTEND_ORIGINS=https://your-dadbuds-domain.example
```

Recommended frontend value:

```bash
VITE_API_URL=https://your-dadbuds-api.example
```

Do not commit real `.env` files. `.env.example` is only a template.

## MVP Integrations

Twilio, Discord, and OpenAI are intentionally placeholders. Admin message actions create or update rows in the message log with `fake-sent` status.
