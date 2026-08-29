from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List
import models, schemas, cricket_api
from database import get_db

router = APIRouter()


def _serialize_team(team: models.Team):
    return {
        "id": team.id,
        "teamName": team.name,
        "name": team.name,
        "captain": team.captain,
        "matches_played": team.matches_played,
        "wins": team.wins,
        "losses": team.losses,
        "points": team.points,
    }


def _serialize_match(match: models.Match):
    team1 = match.team1
    team2 = match.team2
    return {
        "id": match.id,
        "team1_id": match.team1_id,
        "team2_id": match.team2_id,
        "team1": {
            "id": team1.id if team1 else None,
            "teamName": team1.name if team1 else "Unknown",
            "name": team1.name if team1 else "Unknown",
        },
        "team2": {
            "id": team2.id if team2 else None,
            "teamName": team2.name if team2 else "Unknown",
            "name": team2.name if team2 else "Unknown",
        },
        "status": match.status,
        "winner_id": match.winner_id,
        "winner": {
            "id": match.winner_id,
            "teamName": match.winner.name if match.winner else None,
            "name": match.winner.name if match.winner else None,
        } if match.winner else None,
        "team1Score": getattr(match, "team1_score", None),
        "team2Score": getattr(match, "team2_score", None),
    }


@router.get("/health")
def health_check():
    return {"status": "ok", "message": "Python backend is running!"}


@router.post("/teams")
def create_team(team: schemas.TeamCreate, db: Session = Depends(get_db)):
    team_name = (team.name or team.teamName or "").strip()
    if not team_name:
        raise HTTPException(status_code=400, detail="Team name is required")

    db_team = models.Team(name=team_name, captain=team.captain or "")
    db.add(db_team)
    db.commit()
    db.refresh(db_team)
    return _serialize_team(db_team)


@router.get("/teams")
def get_teams(db: Session = Depends(get_db)):
    teams = db.query(models.Team).all()
    return [_serialize_team(team) for team in teams]


@router.get("/teams/standings")
def get_team_standings(db: Session = Depends(get_db)):
    teams = db.query(models.Team).all()
    standings = sorted(
        [_serialize_team(team) for team in teams],
        key=lambda team: (-team["points"], -team["wins"], -team["matches_played"], team["teamName"].lower()),
    )
    for idx, team in enumerate(standings, start=1):
        team["rank"] = idx
    return standings


@router.post("/players", response_model=schemas.PlayerResponse)
def create_player(player: schemas.PlayerCreate, db: Session = Depends(get_db)):
    db_player = models.Player(**player.model_dump())
    db.add(db_player)
    db.commit()
    db.refresh(db_player)
    return db_player


@router.get("/players", response_model=List[schemas.PlayerResponse])
def get_players(db: Session = Depends(get_db)):
    return db.query(models.Player).all()


@router.post("/matches")
def create_match(match: schemas.MatchCreate, db: Session = Depends(get_db)):
    team1 = db.query(models.Team).filter(models.Team.id == match.team1_id).first()
    team2 = db.query(models.Team).filter(models.Team.id == match.team2_id).first()
    if not team1 or not team2:
        raise HTTPException(status_code=404, detail="Both teams must exist")

    db_match = models.Match(team1_id=match.team1_id, team2_id=match.team2_id, status="SCHEDULED")
    db.add(db_match)
    db.commit()
    db.refresh(db_match)
    return _serialize_match(db_match)


@router.get("/matches")
def get_matches(db: Session = Depends(get_db)):
    matches = db.query(models.Match).all()
    return [_serialize_match(match) for match in matches]


@router.put("/matches/{match_id}/score")
def update_match_score(match_id: int, score_update: schemas.MatchScoreUpdate, db: Session = Depends(get_db)):
    db_match = db.query(models.Match).filter(models.Match.id == match_id).first()
    if not db_match:
        raise HTTPException(status_code=404, detail="Match not found")

    db_match.status = score_update.status
    db_match.winner_id = score_update.winner_id
    db_match.team1_score = getattr(score_update, "team1_score", None)
    db_match.team2_score = getattr(score_update, "team2_score", None)

    if score_update.status == "COMPLETED" and score_update.winner_id:
        winner = db.query(models.Team).filter(models.Team.id == score_update.winner_id).first()
        if winner:
            winner.wins += 1
            winner.points += 2
            winner.matches_played += 1

        loser_id = db_match.team1_id if db_match.team2_id == score_update.winner_id else db_match.team2_id
        loser = db.query(models.Team).filter(models.Team.id == loser_id).first()
        if loser:
            loser.losses += 1
            loser.matches_played += 1

    db.commit()
    db.refresh(db_match)
    return _serialize_match(db_match)


@router.put("/matches/{match_id}/result")
def update_match_result(match_id: int, team1Score: int = Query(None), team2Score: int = Query(None), db: Session = Depends(get_db)):
    db_match = db.query(models.Match).filter(models.Match.id == match_id).first()
    if not db_match:
        raise HTTPException(status_code=404, detail="Match not found")

    if team1Score is None or team2Score is None:
        raise HTTPException(status_code=400, detail="Both team scores are required")

    winner_id = None
    if team1Score > team2Score:
        winner_id = db_match.team1_id
    elif team2Score > team1Score:
        winner_id = db_match.team2_id

    db_match.team1_score = team1Score
    db_match.team2_score = team2Score
    db_match.status = "COMPLETED"
    db_match.winner_id = winner_id

    if winner_id:
        winner = db.query(models.Team).filter(models.Team.id == winner_id).first()
        if winner:
            winner.wins += 1
            winner.points += 2
            winner.matches_played += 1

        loser_id = db_match.team1_id if db_match.team2_id == winner_id else db_match.team2_id
        loser = db.query(models.Team).filter(models.Team.id == loser_id).first()
        if loser:
            loser.losses += 1
            loser.matches_played += 1

    for team in [db_match.team1, db_match.team2]:
        if team and team.id not in [winner_id, None]:
            team.matches_played = max(team.matches_played, 0)

    db.commit()
    db.refresh(db_match)
    return _serialize_match(db_match)

@router.get("/live")
async def get_live_matches():
    data = await cricket_api.fetch_live_matches()

    if isinstance(data, dict) and data.get("success") is False:
        cached = cricket_api.get_live_cache_response()
        if cached:
            return JSONResponse(status_code=200, content=cached)
        return JSONResponse(status_code=503, content=data)

    if data is None:
        cached = cricket_api.get_live_cache_response()
        if cached:
            return JSONResponse(status_code=200, content=cached)
        return JSONResponse(
            status_code=503,
            content=cricket_api.build_provider_error_payload(
                status_code=None,
                detail="Live cricket provider temporarily unavailable",
                error="Live cricket provider temporarily unavailable"
            )
        )

    return data

@router.get("/cricket/matches")
async def get_cricket_matches(offset: int = 0):
    data = await cricket_api.fetch_matches(offset)
    if isinstance(data, dict) and data.get("success") is False:
        return JSONResponse(status_code=503, content=data)
    return data

@router.get("/cricket/matches/{match_id}")
async def get_cricket_match_details(match_id: str):
    data = await cricket_api.fetch_match_details(match_id)
    if isinstance(data, dict) and data.get("success") is False:
        return JSONResponse(status_code=503, content=data)
    return data

