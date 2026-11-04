# CricPulse — Cricket Tournament Management System

CricPulse is a full-stack tournament administration app for registering teams and players, scheduling fixtures, recording results, calculating standings and viewing a live cricket feed.

## Stack

- **Frontend:** React 18, Vite, responsive CSS
- **Backend:** Python 3.11+, FastAPI, Pydantic 2
- **Persistence:** SQLAlchemy 2 with PostgreSQL in production and SQLite for local development
- **Authentication:** Admin sign-in with short-lived JWT bearer tokens
- **Deployment:** Vercel (frontend + Python API) or Docker Compose

The repository uses **one backend: FastAPI**. The historical Spring Boot implementation has been removed so local development, Docker and Vercel use the same API and data model.

## Features

- Admin sign-in and protected write operations
- Team registration with duplicate-name validation
- Player registration, role selection, team assignment, reassignment and removal
- Searchable player roster
- Fixture creation with date and time
- Match result entry with non-negative score validation
- Automatic win, loss, tie, matches-played and points calculation
- Protection against applying a completed result twice
- Points table ordered by points, wins, matches played and team name
- Live-score feed with automatic frontend refresh and stale-cache fallback
- API health and database readiness endpoints
- Automated backend and frontend tests

## Local development

### 1. Backend

Use Python 3.11 or newer.

```bash
cd python-backend
python -m venv .venv
```

Activate the environment:

- Windows PowerShell: `.venv\\Scripts\\Activate.ps1`
- macOS/Linux: `source .venv/bin/activate`

Install the development dependencies:

```bash
pip install -r requirements-dev.txt
```

Copy the root `.env.example` to `.env` and change the admin password and JWT secret before exposing the application.

Start the API from the `python-backend` directory:

```bash
uvicorn main:app --reload --port 8000
```

The local default database is SQLite at `python-backend/cricket_app.db`. PostgreSQL is recommended for shared environments.

- API: http://localhost:8000/api
- Interactive API docs: http://localhost:8000/docs
- Readiness: http://localhost:8000/api/health/ready

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm ci
npm run dev
```

Open http://localhost:5173. The Vite development server proxies `/api` requests to FastAPI on port 8000.

Local example admin credentials are configured through `.env`:

- Username: `admin`
- Password: `change-me-before-deploy`

Change these values before deployment. Never commit the real `.env` file.

## Docker Compose

Docker Compose starts PostgreSQL, FastAPI and Nginx:

```bash
docker compose up --build
```

Open http://localhost. The default Compose password is for local development only. Override `DATABASE_PASSWORD`, `ADMIN_PASSWORD` and `JWT_SECRET` in your local `.env` file before sharing or deploying the stack.

## Production configuration

Configure these environment variables in the deployment platform:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Persistent PostgreSQL connection string |
| `ADMIN_USERNAME` | Administrator username |
| `ADMIN_PASSWORD` | Strong administrator password |
| `JWT_SECRET` | Unique random secret, at least 32 characters |
| `ENVIRONMENT` | Set to `production` |
| `FRONTEND_ORIGINS` | Comma-separated trusted frontend origins |

**Important:** SQLite is a local-development fallback only. Vercel deployments reject database-backed API requests when a persistent database URL is not configured. Do not rely on a serverless function's local filesystem for tournament data.

Vercel builds the React app from `frontend/` and sends API requests to the FastAPI function in `api/index.py`. Set the production environment variables above in Vercel before using the application. The Vercel project root should be the repository root so both `api/` and `frontend/` are included.

## API overview

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Admin token |
| GET | `/api/health` | Public |
| GET | `/api/health/ready` | Public |
| GET / POST | `/api/teams` | Public read / admin write |
| GET | `/api/teams/standings` | Public |
| GET / POST | `/api/players` | Public read / admin write |
| PATCH / DELETE | `/api/players/{id}` | Admin token |
| GET / POST | `/api/matches` | Public read / admin write |
| PUT | `/api/matches/{id}/result` | Admin token |
| GET | `/api/live` | Public |

FastAPI's interactive documentation lists request and response schemas at `/docs`.

## Tournament scoring rules

- Win: 2 points for the winner.
- Tie: 1 point for each team.
- Loss: 0 points.
- Every completed match increments each participating team's matches played exactly once.
- A completed result cannot be submitted again. This prevents accidental double-counting.

The standings order is points, wins, matches played, then team name.

## Tests

Backend tests:

```bash
cd python-backend
pip install -r requirements-dev.txt
pytest -q
```

Frontend live-score normalization tests:

```bash
cd frontend
npm ci
npm test
npm run build
```

## Live-score provider note

The current live-score adapter uses a public HTML fallback and normalizes its response for the UI. It is best-effort, not a guaranteed official data feed: the source markup can change, and live data can be unavailable. For a public production service, replace this adapter with a licensed cricket-data API and follow that provider's usage terms.

## Repository layout

```text
api/                  Vercel FastAPI entry point
docs/                 QA checklist and project notes
frontend/             React + Vite application
python-backend/       FastAPI app, SQLAlchemy models and tests
docker-compose.yml    PostgreSQL + API + Nginx
vercel.json           Vercel build and API routing
```
