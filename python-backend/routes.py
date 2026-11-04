import os
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

import cricket_api
import models
import schemas
from database import engine, get_db
from security import (
    TOKEN_EXPIRE_HOURS,
    authenticate_admin,
    create_access_token,
    ensure_production_secrets,
    require_admin,
)

router = APIRouter()


def serialize_team(team: models.Team) -> dict:
    return {
        "id": team.id,
        "name": team.name,
        "teamName": team.name,
        "captain": team.captain,
        "matches_played": team.matches_played,
        "matchesPlayed": team.matches_played,
        "wins": team.wins,
        "losses": team.losses,
        "draws": team.draws,
        "points": team.points,
    }


def serialize_match(match: models.Match) -> dict:
    def team_summary(team):
        if team is None:
            return None
        return {"id": team.id, "name": team.name, "teamName": team.name}

    return {
        "id": match.id,
        "team1_id": match.team1_id,
        "team2_id": match.team2_id,
        "team1": team_summary(match.team1),
        "team2": team_summary(match.team2),
        "team1Score": match.team1_score,
        "team2Score": match.team2_score,
        "status": match.status,
        "winner_id": match.winner_id,
        "winner": team_summary(match.winner),
        "scheduled_at": match.scheduled_at.isoformat() if match.scheduled_at else None,
    }


@router.post("/auth/login", response_model=schemas.TokenResponse)
def login(credentials: schemas.LoginRequest):
    ensure_production_secrets()
    if not authenticate_admin(credentials.username, credentials.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return {
        "access_token": create_access_token(credentials.username),
        "token_type": "bearer",
        "expires_in": TOKEN_EXPIRE_HOURS * 60 * 60,
    }


@router.get("/auth/me")
def current_admin(admin: str = Depends(require_admin)):
    return {"username": admin, "role": "admin"}


@router.get("/health")
def health_check():
    return {"status": "ok", "service": "cricpulse-api", "version": "2.0.0"}


@router.get("/health/ready")
def readiness_check():
    if os.getenv("VERCEL") and engine.dialect.name == "sqlite":
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Persistent PostgreSQL storage is required in production. Configure DATABASE_URL.",
        )
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is not ready",
        )
    return {"status": "ready", "database": engine.dialect.name}


@router.post("/teams", status_code=status.HTTP_201_CREATED)
def create_team(
    team: schemas.TeamCreate,
    db: Session = Depends(get_db),
    admin: str = Depends(require_admin),
):
    team_name = team.name.strip()
    captain = team.captain.strip()
    if not team_name or not captain:
        raise HTTPException(status_code=422, detail="Team name and captain are required")

    existing = db.query(models.Team).filter(models.Team.name.ilike(team_name)).first()
    if existing:
        raise HTTPException(status_code=409, detail="A team with this name already exists")

    db_team = models.Team(name=team_name, captain=captain)
    db.add(db_team)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="A team with this name already exists")
    db.refresh(db_team)
    return serialize_team(db_team)


@router.get("/teams")
def get_teams(db: Session = Depends(get_db)):
    teams = db.query(models.Team).order_by(models.Team.name.asc()).all()
    return [serialize_team(team) for team in teams]


@router.get("/teams/standings")
def get_team_standings(db: Session = Depends(get_db)):
    teams = db.query(models.Team).all()
    standings = sorted(
        [serialize_team(team) for team in teams],
        key=lambda team: (
            -team["points"],
            -team["wins"],
            -team["matches_played"],
            team["teamName"].casefold(),
        ),
    )
    for rank, team in enumerate(standings, start=1):
        team["rank"] = rank
    return standings


def serialize_player(player: models.Player) -> dict:
    return {
        "id": player.id,
        "name": player.name,
        "role": player.role,
        "team_id": player.team_id,
        "team": (
            {"id": player.team.id, "name": player.team.name, "teamName": player.team.name}
            if player.team
            else None
        ),
    }


@router.post("/players", status_code=status.HTTP_201_CREATED)
def create_player(
    player: schemas.PlayerCreate,
    db: Session = Depends(get_db),
    admin: str = Depends(require_admin),
):
    if player.team_id is not None:
        team = db.query(models.Team).filter(models.Team.id == player.team_id).first()
        if team is None:
            raise HTTPException(status_code=404, detail="Team not found")

    db_player = models.Player(
        name=player.name.strip(),
        role=player.role.strip(),
        team_id=player.team_id,
    )
    db.add(db_player)
    db.commit()
    db.refresh(db_player)
    return serialize_player(db_player)


@router.get("/players")
def get_players(db: Session = Depends(get_db)):
    players = db.query(models.Player).order_by(models.Player.name.asc()).all()
    return [serialize_player(player) for player in players]


@router.patch("/players/{player_id}")
def update_player(
    player_id: int,
    player_update: schemas.PlayerUpdate,
    db: Session = Depends(get_db),
    admin: str = Depends(require_admin),
):
    player = db.query(models.Player).filter(models.Player.id == player_id).first()
    if player is None:
        raise HTTPException(status_code=404, detail="Player not found")

    updates = player_update.model_dump(exclude_unset=True)
    if "name" in updates and updates["name"] is not None:
        player.name = updates["name"].strip()
    if "role" in updates and updates["role"] is not None:
        player.role = updates["role"].strip()
    if "team_id" in updates:
        team_id = updates["team_id"]
        if team_id is not None and db.query(models.Team).filter(models.Team.id == team_id).first() is None:
            raise HTTPException(status_code=404, detail="Team not found")
        player.team_id = team_id

    db.commit()
    db.refresh(player)
    return serialize_player(player)


@router.delete("/players/{player_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_player(
    player_id: int,
    db: Session = Depends(get_db),
    admin: str = Depends(require_admin),
):
    player = db.query(models.Player).filter(models.Player.id == player_id).first()
    if player is None:
        raise HTTPException(status_code=404, detail="Player not found")
    db.delete(player)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/matches", status_code=status.HTTP_201_CREATED)
def create_match(
    match: schemas.MatchCreate,
    db: Session = Depends(get_db),
    admin: str = Depends(require_admin),
):
    if match.team1_id == match.team2_id:
        raise HTTPException(status_code=422, detail="A team cannot play against itself")

    team1 = db.query(models.Team).filter(models.Team.id == match.team1_id).first()
    team2 = db.query(models.Team).filter(models.Team.id == match.team2_id).first()
    if team1 is None or team2 is None:
        raise HTTPException(status_code=404, detail="Both teams must exist before scheduling a match")

    db_match = models.Match(
        team1_id=team1.id,
        team2_id=team2.id,
        scheduled_at=match.scheduled_at,
        status="SCHEDULED",
    )
    db.add(db_match)
    db.commit()
    db.refresh(db_match)
    return serialize_match(db_match)


@router.get("/matches")
def get_matches(db: Session = Depends(get_db)):
    matches = (
        db.query(models.Match)
        .order_by(models.Match.scheduled_at.asc().nullslast(), models.Match.id.desc())
        .all()
    )
    return [serialize_match(match) for match in matches]


def record_match_result(match_id: int, team1_score: int, team2_score: int, db: Session):
    match = (
        db.query(models.Match)
        .filter(models.Match.id == match_id)
        .with_for_update()
        .first()
    )
    if match is None:
        raise HTTPException(status_code=404, detail="Match not found")
    if match.status == "COMPLETED":
        raise HTTPException(
            status_code=409,
            detail="This match already has a final result. Completed results cannot be applied twice.",
        )

    team1 = db.query(models.Team).filter(models.Team.id == match.team1_id).with_for_update().first()
    team2 = db.query(models.Team).filter(models.Team.id == match.team2_id).with_for_update().first()
    if team1 is None or team2 is None:
        raise HTTPException(status_code=409, detail="A participating team no longer exists")

    match.team1_score = team1_score
    match.team2_score = team2_score
    match.status = "COMPLETED"
    team1.matches_played += 1
    team2.matches_played += 1

    if team1_score > team2_score:
        match.winner_id = team1.id
        team1.wins += 1
        team1.points += 2
        team2.losses += 1
    elif team2_score > team1_score:
        match.winner_id = team2.id
        team2.wins += 1
        team2.points += 2
        team1.losses += 1
    else:
        match.winner_id = None
        team1.draws += 1
        team2.draws += 1
        team1.points += 1
        team2.points += 1

    db.commit()
    db.refresh(match)
    return serialize_match(match)


@router.put("/matches/{match_id}/result")
def update_match_result(
    match_id: int,
    team1Score: int = Query(ge=0),
    team2Score: int = Query(ge=0),
    db: Session = Depends(get_db),
    admin: str = Depends(require_admin),
):
    return record_match_result(match_id, team1Score, team2Score, db)


@router.put("/matches/{match_id}/score")
def update_match_score(
    match_id: int,
    score_update: schemas.MatchScoreUpdate,
    db: Session = Depends(get_db),
    admin: str = Depends(require_admin),
):
    return record_match_result(
        match_id,
        score_update.team1_score,
        score_update.team2_score,
        db,
    )


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
                detail="Live cricket provider temporarily unavailable",
                error="Live cricket provider temporarily unavailable",
            ),
        )

    return data


@router.get("/cricket/matches")
async def get_cricket_matches(offset: int = Query(default=0, ge=0)):
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
