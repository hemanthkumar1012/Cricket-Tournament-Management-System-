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


def test_player_can_be_registered_assigned_reassigned_and_removed():
    reset_database()
    with TestClient(app) as client:
        headers = login(client)
        falcons = create_team(client, headers, "Falcons")
        tigers = create_team(client, headers, "Tigers")

        created = client.post(
            "/api/players",
            headers=headers,
            json={"name": "Arjun Rao", "role": "All-rounder", "team_id": falcons["id"]},
        )
        assert created.status_code == 201
        player = created.json()
        assert player["team_id"] == falcons["id"]
        assert player["team"]["teamName"] == "Falcons"

        reassigned = client.patch(
            f"/api/players/{player['id']}",
            headers=headers,
            json={"team_id": tigers["id"]},
        )
        assert reassigned.status_code == 200
        assert reassigned.json()["team"]["teamName"] == "Tigers"

        removed = client.delete(f"/api/players/{player['id']}", headers=headers)
        assert removed.status_code == 204
        assert client.get("/api/players").json() == []


def test_player_cannot_be_assigned_to_unknown_team():
    reset_database()
    with TestClient(app) as client:
        headers = login(client)
        response = client.post(
            "/api/players",
            headers=headers,
            json={"name": "Arjun Rao", "role": "Batter", "team_id": 9999},
        )
        assert response.status_code == 404


def test_player_changes_require_admin_authentication():
    reset_database()
    with TestClient(app) as client:
        denied = client.post(
            "/api/players",
            json={"name": "Arjun Rao", "role": "Batter"},
        )
        assert denied.status_code == 401


def register_player(client, headers, name, team_id):
    response = client.post(
        "/api/players",
        headers=headers,
        json={"name": name, "role": "Batter", "team_id": team_id},
    )
    assert response.status_code == 201, response.text
    return response.json()


def add_dot_balls(client, headers, innings_id, striker_id, non_striker_id, bowler_id, count=6):
    for _ in range(count):
        response = client.post(
            f"/api/innings/{innings_id}/deliveries",
            headers=headers,
            json={
                "striker_id": striker_id,
                "non_striker_id": non_striker_id,
                "bowler_id": bowler_id,
                "batter_runs": 0,
            },
        )
        assert response.status_code == 201, response.text
    return response.json()


def test_ball_by_ball_scoring_tracks_extras_batter_stats_and_undo():
    reset_database()
    with TestClient(app) as client:
        headers = login(client)
        falcons = create_team(client, headers, "Falcons")
        tigers = create_team(client, headers, "Tigers")
        striker = register_player(client, headers, "Aarav Batter", falcons["id"])
        non_striker = register_player(client, headers, "Dev Batter", falcons["id"])
        bowler = register_player(client, headers, "Rohan Bowler", tigers["id"])
        match = create_match(client, headers, falcons["id"], tigers["id"])

        started = client.post(
            f"/api/matches/{match['id']}/innings",
            headers=headers,
            json={"batting_team_id": falcons["id"], "overs_limit": 2},
        )
        assert started.status_code == 201, started.text
        innings = started.json()["innings"][0]
        assert innings["status"] == "IN_PROGRESS"
        blocked_manual_result = client.put(
            f"/api/matches/{match['id']}/result?team1Score=100&team2Score=90",
            headers=headers,
        )
        assert blocked_manual_result.status_code == 409

        boundary = client.post(
            f"/api/innings/{innings['id']}/deliveries",
            headers=headers,
            json={
                "striker_id": striker["id"],
                "non_striker_id": non_striker["id"],
                "bowler_id": bowler["id"],
                "batter_runs": 4,
            },
        )
        assert boundary.status_code == 201, boundary.text

        wide = client.post(
            f"/api/innings/{innings['id']}/deliveries",
            headers=headers,
            json={
                "striker_id": striker["id"],
                "non_striker_id": non_striker["id"],
                "bowler_id": bowler["id"],
                "extra_type": "WIDE",
            },
        )
        assert wide.status_code == 201, wide.text
        current = wide.json()["innings"][0]
        assert current["total_runs"] == 5
        assert current["extras"] == 1
        assert current["legal_balls"] == 1
        assert current["overs"] == "0.1"
        batter_line = next(row for row in current["batting"] if row["player_id"] == striker["id"])
        assert batter_line["runs"] == 4
        assert batter_line["balls_faced"] == 1

        undone = client.delete(
            f"/api/innings/{innings['id']}/last-delivery",
            headers=headers,
        )
        assert undone.status_code == 200, undone.text
        after_undo = undone.json()["innings"][0]
        assert after_undo["total_runs"] == 4
        assert after_undo["extras"] == 0
        assert after_undo["legal_balls"] == 1

        no_ball = client.post(
            f"/api/innings/{innings['id']}/deliveries",
            headers=headers,
            json={
                "striker_id": striker["id"],
                "non_striker_id": non_striker["id"],
                "bowler_id": bowler["id"],
                "batter_runs": 1,
                "extra_type": "NO_BALL",
            },
        )
        assert no_ball.status_code == 201, no_ball.text
        no_ball_innings = no_ball.json()["innings"][0]
        assert no_ball_innings["total_runs"] == 6
        assert no_ball_innings["extras"] == 1
        assert no_ball_innings["legal_balls"] == 1
        striker_line = next(row for row in no_ball_innings["batting"] if row["player_id"] == striker["id"])
        assert striker_line["runs"] == 5
        assert striker_line["balls_faced"] == 1


def test_two_player_squad_is_all_out_after_one_wicket():
    reset_database()
    with TestClient(app) as client:
        headers = login(client)
        falcons = create_team(client, headers, "Falcons")
        tigers = create_team(client, headers, "Tigers")
        striker = register_player(client, headers, "Aarav Batter", falcons["id"])
        non_striker = register_player(client, headers, "Dev Batter", falcons["id"])
        bowler = register_player(client, headers, "Rohan Bowler", tigers["id"])
        match = create_match(client, headers, falcons["id"], tigers["id"])
        started = client.post(
            f"/api/matches/{match['id']}/innings",
            headers=headers,
            json={"batting_team_id": falcons["id"], "overs_limit": 5},
        )
        innings_id = started.json()["innings"][0]["id"]
        wicket = client.post(
            f"/api/innings/{innings_id}/deliveries",
            headers=headers,
            json={
                "striker_id": striker["id"],
                "non_striker_id": non_striker["id"],
                "bowler_id": bowler["id"],
                "wicket": True,
                "dismissal_type": "bowled",
                "dismissed_player_id": striker["id"],
            },
        )
        assert wicket.status_code == 201, wicket.text
        first_innings = wicket.json()["innings"][0]
        assert first_innings["wickets"] == 1
        assert first_innings["status"] == "COMPLETED"


def test_ball_by_ball_scoring_requires_admin_and_valid_team_players():
    reset_database()
    with TestClient(app) as client:
        headers = login(client)
        falcons = create_team(client, headers, "Falcons")
        tigers = create_team(client, headers, "Tigers")
        striker = register_player(client, headers, "Aarav Batter", falcons["id"])
        non_striker = register_player(client, headers, "Dev Batter", falcons["id"])
        bowler = register_player(client, headers, "Rohan Bowler", tigers["id"])
        match = create_match(client, headers, falcons["id"], tigers["id"])

        denied = client.post(
            f"/api/matches/{match['id']}/innings",
            json={"batting_team_id": falcons["id"], "overs_limit": 1},
        )
        assert denied.status_code == 401

        started = client.post(
            f"/api/matches/{match['id']}/innings",
            headers=headers,
            json={"batting_team_id": falcons["id"], "overs_limit": 1},
        )
        assert started.status_code == 201
        innings_id = started.json()["innings"][0]["id"]

        late_signup = client.post(
            "/api/players",
            headers=headers,
            json={"name": "Late Batter", "role": "Batter", "team_id": falcons["id"]},
        )
        assert late_signup.status_code == 409

        wrong_bowler = client.post(
            f"/api/innings/{innings_id}/deliveries",
            headers=headers,
            json={
                "striker_id": striker["id"],
                "non_striker_id": non_striker["id"],
                "bowler_id": striker["id"],
            },
        )
        assert wrong_bowler.status_code == 422


def test_two_completed_innings_finalize_result_and_update_standings():
    reset_database()
    with TestClient(app) as client:
        headers = login(client)
        falcons = create_team(client, headers, "Falcons")
        tigers = create_team(client, headers, "Tigers")
        falcons_batter = register_player(client, headers, "Aarav Batter", falcons["id"])
        falcons_partner = register_player(client, headers, "Dev Batter", falcons["id"])
        falcons_bowler = register_player(client, headers, "Rohan Bowler", falcons["id"])
        tigers_batter = register_player(client, headers, "Kabir Batter", tigers["id"])
        tigers_partner = register_player(client, headers, "Ishaan Batter", tigers["id"])
        tigers_bowler = register_player(client, headers, "Vihaan Bowler", tigers["id"])
        match = create_match(client, headers, falcons["id"], tigers["id"])

        first = client.post(
            f"/api/matches/{match['id']}/innings",
            headers=headers,
            json={"batting_team_id": falcons["id"], "overs_limit": 1},
        )
        assert first.status_code == 201, first.text
        first_innings = first.json()["innings"][0]
        first_scorecard = add_dot_balls(
            client, headers, first_innings["id"],
            falcons_batter["id"], falcons_partner["id"], tigers_bowler["id"],
        )
        assert first_scorecard["innings"][0]["status"] == "COMPLETED"

        second = client.post(
            f"/api/matches/{match['id']}/innings",
            headers=headers,
            json={"batting_team_id": tigers["id"], "overs_limit": 1},
        )
        assert second.status_code == 201, second.text
        second_innings = second.json()["innings"][1]
        second_scorecard = add_dot_balls(
            client, headers, second_innings["id"],
            tigers_batter["id"], tigers_partner["id"], falcons_bowler["id"],
        )
        assert second_scorecard["innings"][1]["status"] == "COMPLETED"

        finished = client.post(f"/api/matches/{match['id']}/finish", headers=headers)
        assert finished.status_code == 200, finished.text
        assert finished.json()["status"] == "COMPLETED"
        assert finished.json()["winner"] is None

        teams = {item["id"]: item for item in client.get("/api/teams").json()}
        assert teams[falcons["id"]]["draws"] == 1
        assert teams[tigers["id"]]["draws"] == 1
        assert teams[falcons["id"]]["points"] == 1
        assert teams[tigers["id"]]["points"] == 1
