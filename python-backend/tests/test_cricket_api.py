from unittest.mock import AsyncMock, patch
import pytest
import httpx
import cricket_api


@pytest.mark.asyncio
async def test_live_matches_normalize_provider_payload(monkeypatch):
    monkeypatch.setattr(cricket_api, "CRICKET_API_BASE_URL", "https://provider.test")
    monkeypatch.setattr(cricket_api, "CRICKET_API_KEY", "test-key")
    monkeypatch.setattr(cricket_api, "_provider_get", AsyncMock(return_value={"data": {"matches": [{"match_id": "m1", "team1": {"name": "Home"}, "team2": {"name": "Away"}, "score": {"home": "10/1"}}]}}))
    result = await cricket_api.fetch_live_matches()
    assert result["source"] == "provider"
    assert result["matches"][0]["id"] == "m1"
    assert result["matches"][0]["homeTeam"] == "Home"
    assert result["matches"][0]["homeScore"] == "10/1"


@pytest.mark.asyncio
async def test_live_matches_use_demo_without_provider(monkeypatch):
    monkeypatch.setattr(cricket_api, "CRICKET_API_BASE_URL", "")
    monkeypatch.setattr(cricket_api, "CRICKET_API_KEY", "")
    result = await cricket_api.fetch_live_matches()
    assert result["source"] == "demo"
    assert result["stale"] is True
    assert all("Sample feed" in match["subtitle"] for match in result["matches"])


@pytest.mark.asyncio
async def test_history_paginates_provider_data(monkeypatch):
    monkeypatch.setattr(cricket_api, "CRICKET_API_BASE_URL", "https://provider.test")
    monkeypatch.setattr(cricket_api, "CRICKET_API_KEY", "test-key")
    monkeypatch.setattr(cricket_api, "_provider_get", AsyncMock(return_value={"total": 25, "matches": [{"id": "m2", "homeTeam": "A", "awayTeam": "B"}]}))
    result = await cricket_api.fetch_matches(offset=10, limit=10)
    assert result["offset"] == 10
    assert result["hasMore"] is True
    assert result["matches"][0]["id"] == "m2"


@pytest.mark.asyncio
async def test_match_details_call_provider_path(monkeypatch):
    monkeypatch.setattr(cricket_api, "CRICKET_API_BASE_URL", "https://provider.test")
    monkeypatch.setattr(cricket_api, "CRICKET_API_KEY", "test-key")
    monkeypatch.setattr(cricket_api, "CRICKET_API_MATCH_DETAIL_PATH", "/matches/{match_id}")
    getter = AsyncMock(return_value={"match": {"id": "m3", "innings": []}})
    monkeypatch.setattr(cricket_api, "_provider_get", getter)
    result = await cricket_api.fetch_match_details("m3")
    assert result["match"]["id"] == "m3"
    getter.assert_awaited_once_with("/matches/m3")


@pytest.mark.asyncio
async def test_history_returns_empty_not_fake_results_without_provider(monkeypatch):
    monkeypatch.setattr(cricket_api, "CRICKET_API_BASE_URL", "")
    result = await cricket_api.fetch_matches()
    assert result["source"] == "demo"
    assert result["matches"] == []
    assert result["hasMore"] is False


def test_match_normalizer_handles_string_teams_and_status():
    result = cricket_api._normalize_match({"id": "x", "teams": ["A", "B"], "state": "Live"})
    assert result["homeTeam"] == "A"
    assert result["awayTeam"] == "B"
    assert result["status"] == "Live"
