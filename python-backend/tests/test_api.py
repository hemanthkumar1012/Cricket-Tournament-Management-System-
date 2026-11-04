import os
import sys
import tempfile
from pathlib import Path

# Configure an isolated database before importing the application modules.
TEST_DIR = Path(tempfile.mkdtemp(prefix="cricpulse-tests-"))
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DIR / 'test.sqlite3'}"
os.environ["ADMIN_USERNAME"] = "test-admin"
os.environ["ADMIN_PASSWORD"] = "test-password"
os.environ["JWT_SECRET"] = "test-secret-that-is-long-enough-for-hmac-sha256"
os.environ["ENVIRONMENT"] = "test"
os.environ.pop("VERCEL", None)

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from fastapi.testclient import TestClient  # noqa: E402
from database import Base, engine  # noqa: E402
from main import app  # noqa: E402


def login(client):
    response = client.post(
        "/api/auth/login",
        json={"username": "test-admin", "password": "test-password"},
    )
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def create_team(client, headers, name):
    response = client.post(
        "/api/teams",
        headers=headers,
        json={"name": name, "captain": f"{name} Captain"},
    )
    assert response.status_code == 201, response.text
    return response.json()


def create_match(client, headers, team1_id, team2_id):
    response = client.post(
        "/api/matches",
        headers=headers,
        json={"team1_id": team1_id, "team2_id": team2_id},
    )
    assert response.status_code == 201, response.text
    return response.json()


def reset_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def test_admin_authentication_protects_write_routes():
    reset_database()
    with TestClient(app) as client:
        denied = client.post(
            "/api/teams",
            json={"name": "Falcons", "captain": "A Captain"},
        )
        assert denied.status_code == 401

        headers = login(client)
        created = create_team(client, headers, "Falcons")
        assert created["teamName"] == "Falcons"
        assert client.get("/api/teams").status_code == 200


def test_duplicate_team_names_are_rejected_case_insensitively():
    reset_database()
    with TestClient(app) as client:
        headers = login(client)
        create_team(client, headers, "Falcons")
        duplicate = client.post(
            "/api/teams",
            headers=headers,
            json={"name": "falcons", "captain": "Another Captain"},
        )
        assert duplicate.status_code == 409


def test_match_result_updates_both_teams_and_cannot_be_applied_twice():
    reset_database()
    with TestClient(app) as client:
        headers = login(client)
        team1 = create_team(client, headers, "Falcons")
        team2 = create_team(client, headers, "Tigers")
        match = create_match(client, headers, team1["id"], team2["id"])

        result = client.put(
            f"/api/matches/{match['id']}/result?team1Score=184&team2Score=171",
            headers=headers,
        )
        assert result.status_code == 200
        assert result.json()["team1Score"] == 184
        assert result.json()["winner"]["id"] == team1["id"]

        standings = {team["id"]: team for team in client.get("/api/teams/standings").json()}
        assert standings[team1["id"]]["wins"] == 1
        assert standings[team1["id"]]["points"] == 2
        assert standings[team1["id"]]["matches_played"] == 1
        assert standings[team2["id"]]["losses"] == 1
        assert standings[team2["id"]]["matches_played"] == 1

        duplicate = client.put(
            f"/api/matches/{match['id']}/result?team1Score=190&team2Score=160",
            headers=headers,
        )
        assert duplicate.status_code == 409

        standings_after_retry = {team["id"]: team for team in client.get("/api/teams").json()}
        assert standings_after_retry[team1["id"]]["points"] == 2
        assert standings_after_retry[team1["id"]]["matches_played"] == 1


def test_tied_match_awards_one_point_to_each_team():
    reset_database()
    with TestClient(app) as client:
        headers = login(client)
        team1 = create_team(client, headers, "Royals")
        team2 = create_team(client, headers, "Chargers")
        match = create_match(client, headers, team1["id"], team2["id"])

        result = client.put(
            f"/api/matches/{match['id']}/result?team1Score=150&team2Score=150",
            headers=headers,
        )
        assert result.status_code == 200
        assert result.json()["winner"] is None

        teams = {team["id"]: team for team in client.get("/api/teams").json()}
        assert teams[team1["id"]]["draws"] == 1
        assert teams[team2["id"]]["draws"] == 1
        assert teams[team1["id"]]["points"] == 1
        assert teams[team2["id"]]["points"] == 1


def test_same_team_cannot_be_scheduled_against_itself():
    reset_database()
    with TestClient(app) as client:
        headers = login(client)
        team = create_team(client, headers, "Warriors")
        response = client.post(
            "/api/matches",
            headers=headers,
            json={"team1_id": team["id"], "team2_id": team["id"]},
        )
        assert response.status_code == 422


def test_negative_scores_are_rejected():
    reset_database()
    with TestClient(app) as client:
        headers = login(client)
        team1 = create_team(client, headers, "Eagles")
        team2 = create_team(client, headers, "Panthers")
        match = create_match(client, headers, team1["id"], team2["id"])
        response = client.put(
            f"/api/matches/{match['id']}/result?team1Score=-1&team2Score=20",
            headers=headers,
        )
        assert response.status_code == 422
