# CricPulse Cricket Data Provider

Live scores, full match history, scorecards, and ball-by-ball details require an external cricket data provider. This service is configured as a generic JSON API adapter; provider response fields are normalized, but endpoint paths and authentication format must match the provider plan you choose.

## Configure backend secrets

Copy `.env.example` to `.env` for local work, or set these variables in the backend deployment environment:

- `CRICKET_API_BASE_URL`: provider API base URL
- `CRICKET_API_KEY`: secret provider key (backend-only)
- `CRICKET_API_KEY_HEADER`: header name used for key authentication (default `x-api-key`)
- `CRICKET_API_KEY_QUERY`: optional query parameter auth name (usually leave blank)
- `CRICKET_API_LIVE_PATH`, `CRICKET_API_HISTORY_PATH`, `CRICKET_API_MATCH_DETAIL_PATH`: provider routes

The adapter requests history using `offset`, `limit`, `q`, `team`, and `series` query parameters. If your provider uses different parameter names or wraps its responses differently, adapt `python-backend/cricket_api.py` to its documented API. Never put the secret in frontend variables, source files, or a public `.env.example`.

## Current behavior

- Live endpoint: `GET /api/cricket/live`
- History endpoint: `GET /api/cricket/matches?offset=0&limit=10`
- Match details: `GET /api/cricket/matches/{match_id}`
- Scores refresh every 60 seconds in the browser.
- Without provider settings, the app clearly indicates sample/demo mode; it intentionally does not invent historical results.

## Verify

From `python-backend/`:

```sh
pip install -r requirements.txt
PYTHONPATH=. pytest -q
```
