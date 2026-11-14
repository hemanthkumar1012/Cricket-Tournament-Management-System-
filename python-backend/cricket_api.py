import os
import re
import time
from pathlib import Path

import httpx
from dotenv import load_dotenv

ENV_FILE = Path(__file__).resolve().parent / ".env"
load_dotenv(ENV_FILE, override=True)

CRICKET_API_KEY = os.getenv("CRICKET_API_KEY", "").strip()
CRICKET_API_BASE_URL = os.getenv("CRICKET_API_BASE_URL", "").strip().rstrip("/")
CRICKET_API_KEY_HEADER = os.getenv("CRICKET_API_KEY_HEADER", "x-api-key").strip()
CRICKET_API_KEY_QUERY = os.getenv("CRICKET_API_KEY_QUERY", "").strip()
CRICKET_API_LIVE_PATH = os.getenv("CRICKET_API_LIVE_PATH", "/matches/live").strip()
CRICKET_API_HISTORY_PATH = os.getenv("CRICKET_API_HISTORY_PATH", "/matches").strip()
CRICKET_API_MATCH_DETAIL_PATH = os.getenv("CRICKET_API_MATCH_DETAIL_PATH", "/matches/{match_id}").strip()
CRICKET_CACHE_TTL = max(15, int(os.getenv("CRICKET_CACHE_TTL", "45")))

BASE_URL = "https://www.cricbuzz.com"
LIVE_URL = f"{BASE_URL}/cricket-match/live-scores"
LIVE_CACHE = {"data": None, "updated_at": None}
MATCH_CACHE = {}

DEMO_LIVE_MATCHES = [
    {"id": "live-ind-vs-aus", "name": "India vs Australia", "status": "Live", "subtitle": "Sample feed — not a real-time score", "startTime": "", "homeTeam": "India", "awayTeam": "Australia", "homeScore": "", "awayScore": "", "venue": "", "series": ""},
    {"id": "live-eng-vs-sa", "name": "England vs South Africa", "status": "Live", "subtitle": "Sample feed — not a real-time score", "startTime": "", "homeTeam": "England", "awayTeam": "South Africa", "homeScore": "", "awayScore": "", "venue": "", "series": ""},
]
DEMO_HISTORY_MATCHES = []


def _get_path(template, match_id=None):
    path = template.strip() or "/"
    if match_id is not None:
        path = path.replace("{match_id}", str(match_id))
    return path if path.startswith("/") else f"/{path}"


def _unwrap_matches(payload):
    if isinstance(payload, list):
        return payload
    if not isinstance(payload, dict):
        return []
    for key in ("matches", "results", "data"):
        value = payload.get(key)
        if isinstance(value, list):
            return value
        if isinstance(value, dict):
            for nested in ("matches", "results", "items"):
                if isinstance(value.get(nested), list):
                    return value[nested]
    return []


def _normalize_match(raw):
    if not isinstance(raw, dict):
        return None
    teams = raw.get("teams") if isinstance(raw.get("teams"), list) else []
    home = raw.get("homeTeam") or raw.get("team1") or (teams[0] if teams else {})
    away = raw.get("awayTeam") or raw.get("team2") or (teams[1] if len(teams) > 1 else {})
    def team_name(value):
        if isinstance(value, str):
            return value
        if isinstance(value, dict):
            return value.get("name") or value.get("full_name") or value.get("short_name") or value.get("code") or "Unknown"
        return "Unknown"
    scores = raw.get("score") if isinstance(raw.get("score"), dict) else {}
    return {
        **raw,
        "id": raw.get("id") or raw.get("match_id") or raw.get("matchId"),
        "name": raw.get("name") or raw.get("title") or f"{team_name(home)} vs {team_name(away)}",
        "status": raw.get("status") or raw.get("matchStatus") or raw.get("state") or "Unknown",
        "homeTeam": team_name(home),
        "awayTeam": team_name(away),
        "homeScore": raw.get("homeScore") or raw.get("team1Score") or scores.get("home") or scores.get("team1") or "",
        "awayScore": raw.get("awayScore") or raw.get("team2Score") or scores.get("away") or scores.get("team2") or "",
        "series": raw.get("series") or raw.get("tournament") or "",
        "venue": raw.get("venue") or raw.get("location") or "",
        "startTime": raw.get("startTime") or raw.get("start_time") or raw.get("date") or "",
    }


def _provider_configured():
    return bool(CRICKET_API_BASE_URL and CRICKET_API_KEY)


def _provider_headers():
    headers = {"Accept": "application/json"}
    if CRICKET_API_KEY_HEADER:
        headers[CRICKET_API_KEY_HEADER] = CRICKET_API_KEY
    return headers


async def _provider_get(path, params=None):
    if not _provider_configured():
        return None
    query = dict(params or {})
    if CRICKET_API_KEY_QUERY:
        query[CRICKET_API_KEY_QUERY] = CRICKET_API_KEY
    url = f"{CRICKET_API_BASE_URL}{_get_path(path)}"
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url, params=query, headers=_provider_headers())
        response.raise_for_status()
        return response.json()


def _cache_response(cache, key):
    entry = cache.get(key)
    if not entry:
        return None
    return {"success": True, "source": "cache", "stale": time.time() - entry["updated_at"] > CRICKET_CACHE_TTL, "cached_at": entry["updated_at"], **entry["payload"]}


def _set_cache(cache, key, payload):
    cache[key] = {"payload": payload, "updated_at": time.time()}


async def fetch_live_matches():
    if _provider_configured():
        try:
            payload = await _provider_get(CRICKET_API_LIVE_PATH)
            matches = [_normalize_match(item) for item in _unwrap_matches(payload)]
            normalized = [match for match in matches if match]
            result = {"success": True, "source": "provider", "stale": False, "matches": normalized, "updatedAt": time.time()}
            _set_cache(MATCH_CACHE, "live", result)
            return result
        except (httpx.HTTPError, ValueError) as error:
            cached = _cache_response(MATCH_CACHE, "live")
            if cached:
                return cached
            return {"success": False, "source": "provider", "error": "Cricket provider request failed", "detail": str(error)}
    return {"success": True, "source": "demo", "stale": True, "matches": DEMO_LIVE_MATCHES, "updatedAt": None}


async def fetch_schedule():
    return await fetch_live_matches()


async def fetch_matches(offset: int = 0, limit: int = 10, query: str = "", team: str = "", series: str = ""):
    start = max(0, int(offset))
    page_size = min(50, max(1, int(limit)))
    if _provider_configured():
        try:
            payload = await _provider_get(CRICKET_API_HISTORY_PATH, {"offset": start, "limit": page_size, "q": query, "team": team, "series": series})
            raw_matches = _unwrap_matches(payload)
            matches = [_normalize_match(item) for item in raw_matches]
            matches = [match for match in matches if match]
            total = payload.get("total") if isinstance(payload, dict) else None
            return {"success": True, "source": "provider", "offset": start, "limit": page_size, "total": total, "hasMore": (start + len(matches) < total) if isinstance(total, int) else len(matches) == page_size, "matches": matches}
        except (httpx.HTTPError, ValueError) as error:
            return {"success": False, "source": "provider", "error": "Cricket history request failed", "detail": str(error), "matches": []}
    return {"success": True, "source": "demo", "offset": start, "limit": page_size, "total": 0, "hasMore": False, "matches": []}


async def fetch_match_details(match_id: str):
    if not _provider_configured():
        return {"success": False, "source": "demo", "error": "Match details require a configured cricket data provider", "detail": "Set CRICKET_API_BASE_URL and CRICKET_API_KEY on the backend to load provider scorecards."}
    try:
        path = CRICKET_API_MATCH_DETAIL_PATH.replace("{match_id}", str(match_id))
        payload = await _provider_get(path)
        if isinstance(payload, dict) and isinstance(payload.get("match"), dict):
            match = payload["match"]
        else:
            match = payload
        result = {"success": True, "source": "provider", "match": match}
        _set_cache(MATCH_CACHE, f"details:{match_id}", result)
        return result
    except (httpx.HTTPError, ValueError) as error:
        cached = _cache_response(MATCH_CACHE, f"details:{match_id}")
        if cached:
            return cached
        return {"success": False, "source": "provider", "error": "Match details request failed", "detail": str(error)}


__all__ = ["fetch_live_matches", "fetch_schedule", "fetch_matches", "fetch_match_details"]
