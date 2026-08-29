import html
import os
import re
import time
from pathlib import Path

import httpx
from dotenv import load_dotenv


# Load the .env file from python-backend
ENV_FILE = Path(__file__).resolve().parent / ".env"
load_dotenv(ENV_FILE, override=True)

CRICKET_API_KEY = os.getenv("CRICKET_API_KEY", "").strip()

BASE_URL = "https://www.cricbuzz.com"
LIVE_URL = f"{BASE_URL}/cricket-match/live-scores"
LIVE_CACHE = {"data": None, "updated_at": None}


def get_headers():
    return {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
        "Accept": "text/html,application/json,*/*",
        "Referer": BASE_URL,
    }


def build_provider_error_payload(status_code=None, detail="Live cricket provider temporarily unavailable", error=None):
    return {
        "success": False,
        "source": "provider",
        "error": error or "Live cricket provider temporarily unavailable",
        "status_code": status_code,
        "detail": detail,
    }


def set_live_cache(payload):
    if payload is None:
        return
    LIVE_CACHE["data"] = payload
    LIVE_CACHE["updated_at"] = time.time()


def get_live_cache_response():
    if not LIVE_CACHE["data"]:
        return None
    return {
        "success": True,
        "source": "cache",
        "stale": True,
        "cached_at": LIVE_CACHE["updated_at"],
        "data": LIVE_CACHE["data"],
    }


def _clean_text(value):
    text = html.unescape(value or "")
    text = re.sub(r"<.*?>", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def _parse_match_score_segments(match_text):
    score_matches = re.findall(
        r"([A-Za-z][A-Za-z .&'-]+?)\s+(\d+(?:-\d+)?(?:\s*&\s*\d+(?:-\d+)?)?(?:\s*\(\d+\))?)",
        match_text,
        flags=re.IGNORECASE,
    )
    cleaned = []
    for team, score in score_matches:
        team_name = re.sub(r"\s+", " ", team).strip()
        score_text = re.sub(r"\s+", " ", score).strip()
        if len(team_name) < 3:
            continue
        lower = team_name.lower()
        if lower in {"day", "stumps", "preview", "live", "score", "match", "series", "matches"}:
            continue
        cleaned.append((team_name, score_text))
    return cleaned[:2]


def parse_cricbuzz_live_matches(html_text):
    matches = []
    seen = set()

    for anchor_match in re.finditer(r'<a[^>]+href=["\'](/live-cricket-scores/[^"\']+)["\'][^>]*>(.*?)</a>', html_text, flags=re.IGNORECASE | re.DOTALL):
        href, inner = anchor_match.groups()
        text = _clean_text(inner)
        if not text:
            continue
        if re.search(r"(scorecard|full commentary|news|fixtures|archive)", text, flags=re.IGNORECASE):
            continue
        text = text.replace("|", " ")
        if len(text) > 260:
            continue
        if text.lower().startswith("live score"):
            continue

        title = text.strip()
        status = "Live"
        if " - " in title:
            left, right = title.rsplit(" - ", 1)
            title = left.strip()
            status = right.strip() or "Live"

        if " vs " not in title.lower() and " vs. " not in title.lower():
            continue

        home_away = re.split(r"\s+vs\s+|\s+-\s+", title, flags=re.IGNORECASE)
        home_team = home_away[0].strip() if home_away else "Unknown"
        away_team = home_away[1].strip() if len(home_away) > 1 else "Unknown"

        score_pairs = _parse_match_score_segments(text)
        home_score = ""
        away_score = ""
        if len(score_pairs) >= 2:
            home_score = score_pairs[0][1]
            away_score = score_pairs[1][1]
            if home_away[0] and home_away[1]:
                home_team = score_pairs[0][0]
                away_team = score_pairs[1][0]

        match_id = href.strip("/").replace("/", "-") or f"cricbuzz-{len(matches) + 1}"
        team_key = tuple(sorted((home_team.lower(), away_team.lower())))
        if match_id in seen or team_key in seen:
            continue
        seen.add(match_id)
        seen.add(team_key)

        match = {
            "id": match_id,
            "name": title,
            "status": status,
            "subtitle": text,
            "startTime": "",
            "homeTeam": home_team,
            "awayTeam": away_team,
            "homeScore": home_score,
            "awayScore": away_score,
            "venue": "",
            "series": "",
        }
        matches.append(match)

    return matches


async def fetch_live_matches():
    """Fetch the current public Cricbuzz live-match listings and normalize them."""
    async with httpx.AsyncClient(timeout=25.0) as client:
        try:
            response = await client.get(LIVE_URL, headers=get_headers())
            response.raise_for_status()
            html_text = response.text
            matches = parse_cricbuzz_live_matches(html_text)
            if not matches:
                return {
                    "success": False,
                    "source": "provider",
                    "error": "No live cricket matches available right now",
                    "detail": "The live scores page did not return any match entries.",
                }
            payload = {"matches": matches}
            set_live_cache(payload)
            return payload
        except httpx.HTTPStatusError as e:
            return build_provider_error_payload(
                status_code=e.response.status_code,
                detail=e.response.text or str(e),
                error="Live cricket provider temporarily unavailable",
            )
        except httpx.RequestError as e:
            return build_provider_error_payload(
                status_code=None,
                detail=str(e),
                error="Could not connect to the live cricket source",
            )


async def fetch_schedule():
    """Get upcoming/scheduled matches.
    This is intentionally kept as a public-page fallback until a dedicated source is available.
    """
    payload = await fetch_live_matches()
    if isinstance(payload, dict) and payload.get("success") is False:
        return payload
    return payload


async def fetch_matches(offset: int = 0):
    """Backward-compatible wrapper for older routes and frontends."""
    return await fetch_schedule()


async def fetch_match_details(match_id: str):
    """Unimplemented for the public live-score source. Return a consistent provider error payload."""
    return build_provider_error_payload(
        status_code=None,
        detail=f"Live score details are not available for match {match_id} from the public source.",
        error="Match details are not available from the current live source",
    )