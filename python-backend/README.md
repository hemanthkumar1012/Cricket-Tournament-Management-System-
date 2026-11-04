# FastAPI backend

This folder contains the single API implementation used by local development, Docker Compose and the Vercel function.

## Run locally

From this directory:

```bash
python -m venv .venv
# Activate .venv, then:
pip install -r requirements-dev.txt
uvicorn main:app --reload --port 8000
```

Configuration is loaded from the repository root `.env` (or this folder's `.env`). SQLite is the local default. Set `DATABASE_URL` to PostgreSQL for shared or deployed environments.

Interactive API documentation: http://localhost:8000/docs

## Tests

```bash
pytest -q
```

## Important environment variables

`DATABASE_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `JWT_SECRET`, `ENVIRONMENT` and `FRONTEND_ORIGINS`.

Production mode rejects placeholder admin credentials and the example JWT secret. Never commit a real `.env` file.
