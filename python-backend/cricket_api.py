import os
import re
import time
from pathlib import Path

import httpx
from dotenv import load_dotenv


ENV_FILE = Path(__file__).resolve().parent / ".env"
load_dotenv(ENV_FILE, override=True)

CRICKET_API_KEY = os.getenv("CRICKET_API_KEY", "").strip()
BASE_URL = "https://www.cricbuzz.com"
LIVE_URL = f"{BASE_URL}/cricket-match/live-scores"
LIVE_CACHE = {"data": None, "updated_at": None}

DEMO_LIVE_MATCHES = [
    {
        "id": "live-ind-vs-aus",
        "name": "India vs Australia",
        "status": "Live",
        "subtitle": "India need 34 off 19. Australia 172/7",
        "startTime": "19:30 IST",
        "homeTeam": "India",
        "awayTeam": "Australia",
        "homeScore": "172/7",
        "awayScore": "179/8",
        "venue": "Wankhede Stadium, Mumbai",
        "series": "Champions Trophy",
    },
    {
        "id": "live-eng-vs-sa",
        "name": "England vs South Africa",
        "status": "Innings Break",
        "subtitle": "England 246/8 in 18.4 overs",
        "startTime": "18:45 IST",
        "homeTeam": "England",
        "awayTeam": "South Africa",
        "homeScore": "246/8",
        "awayScore": "184/10",
        "venue": "The Oval, London",
        "series": "T20I Tri-Series",
    },
    {
        "id": "live-pak-vs-nz",
        "name": "Pakistan vs New Zealand",
        "status": "Live",
        "subtitle": "New Zealand 143/4 after 14.2 overs",
        "startTime": "17:50 IST",
        "homeTeam": "Pakistan",
        "awayTeam": "New Zealand",
        "homeScore": "118/9",
        "awayScore": "143/4",
        "venue": "Lahore Cricket Stadium",
        "series": "Asia Cup",
    },
]

DEMO_HISTORY_MATCHES = [
    {
        "id": "hist-001",
        "name": "India vs Sri Lanka",
        "status": "Completed",
        "subtitle": "India won by 6 wickets",
        "startTime": "2026-11-10T15:30:00Z",
        "homeTeam": "India",
        "awayTeam": "Sri Lanka",
        "homeScore": "178/4",
        "awayScore": "172/10",
        "venue": "Eden Gardens, Kolkata",
        "series": "World Cup Warm-up",
    },
    {
        "id": "hist-002",
        "name": "Australia vs England",
        "status": "Completed",
        "subtitle": "Australia won by 32 runs",
        "startTime": "2026-11-08T18:00:00Z",
        "homeTeam": "Australia",
        "awayTeam": "England",
        "homeScore": "241/6",
        "awayScore": "209/10",
        "venue": "Melbourne Cricket Ground",
        "series": "Ashes",
    },
    {
        "id": "hist-003",
        "name": "South Africa vs Bangladesh",
        "status": "Completed",
        "subtitle": "South Africa won by 7 wickets",
        "startTime": "2026-11-02T12:20:00Z",
        "homeTeam": "South Africa",
        "awayTeam": "Bangladesh",
        "homeScore": "185/3",
        "awayScore": "184/10",
        "venue": "Centurion Park",
        "series": "ODI Series",
    },
    {
        "id": "hist-004",
        "name": "Afghanistan vs Nepal",
        "status": "Completed",
        "subtitle": "Afghanistan won by 4 wickets",
        "startTime": "2026-10-28T18:00:00Z",
        "homeTeam": "Afghanistan",
        "awayTeam": "Nepal",
        "homeScore": "146/6",
        "awayScore": "145/9",
        "venue": "Sharjah Cricket Stadium",
        "series": "ACC League",
    },
    {
        "id": "hist-005",
        "name": "New Zealand vs Ireland",
        "status": "Completed",
        "subtitle": "New Zealand won by 58 runs",
        "startTime": "2026-10-22T16:15:00Z",
        "homeTeam": "New Zealand",
        "awayTeam": "Ireland",
        "homeScore": "232/7",
        "awayScore": "174/10",
        "venue": "Wellington Regional Stadium",
        "series": "Bilateral Series",
    },
]


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

        matches.append({
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
        })

    return matches


async def _fetch_provider_live_matches():
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.get(LIVE_URL, headers=get_headers())
        response.raise_for_status()
        html_text = response.text
        matches = parse_cricbuzz_live_matches(html_text)
        if not matches:
            return None
        payload = {"success": True, "source": "provider", "matches": matches}
        set_live_cache(payload)
        return payload


async def fetch_live_matches():
    try:
        provider_payload = await _fetch_provider_live_matches()
        if provider_payload is not None:
            return provider_payload
    except (httpx.HTTPStatusError, httpx.RequestError):
        pass

    demo_payload = {"success": True, "source": "demo", "matches": DEMO_LIVE_MATCHES}
    set_live_cache(demo_payload)
    return demo_payload


async def fetch_schedule():
    payload = await fetch_live_matches()
    if isinstance(payload, dict) and payload.get("success") is False:
        return payload
    return payload


async def fetch_matches(offset: int = 0):
    history = list(DEMO_HISTORY_MATCHES)
    start = max(0, int(offset))
    page = history[start:start + 10]
    return {
        "success": True,
        "source": "demo",
        "offset": start,
        "count": len(page),
        "matches": page,
    }


async def fetch_match_details(match_id: str):
    match = next((item for item in DEMO_HISTORY_MATCHES + DEMO_LIVE_MATCHES if item["id"] == match_id), None)
    if match is None:
        return build_provider_error_payload(
            status_code=None,
            detail=f"Match {match_id} is not available in the live or history feed.",
            error="Match details are not available from the current source",
        )

    innings = [
        {"team": match["homeTeam"], "runs": match["homeScore"], "overs": "18.4"},
        {"team": match["awayTeam"], "runs": match["awayScore"], "overs": "20.0"},
    ]
    return {
        "success": True,
        "source": "demo",
        "match": {
            **match,
            "summary": match["subtitle"],
            "innings": innings,
            "recentOvers": ["1", "2", "4", "1", "6", "0", "1", "2"],
        },
    }


__all__ = [
    "build_provider_error_payload",
    "fetch_live_matches",
    "fetch_matches",
    "fetch_match_details",
    "get_live_cache_response",
    "parse_cricbuzz_live_matches",
]


if __name__ == "__main__":
    import asyncio
    print(asyncio.run(fetch_live_matches()))
