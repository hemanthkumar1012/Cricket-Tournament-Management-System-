from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from database import get_db

router = APIRouter()

@router.get("/health")
def health_check():
    return {"status": "ok", "message": "Python backend is running!"}

@router.post("/teams", response_model=schemas.TeamResponse)
def create_team(team: schemas.TeamCreate, db: Session = Depends(get_db)):
    db_team = models.Team(name=team.name, captain=team.captain)
    db.add(db_team)
    db.commit()
    db.refresh(db_team)
    return db_team

@router.get("/teams", response_model=List[schemas.TeamResponse])
def get_teams(db: Session = Depends(get_db)):
    return db.query(models.Team).all()

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

@router.post("/matches", response_model=schemas.MatchResponse)
def create_match(match: schemas.MatchCreate, db: Session = Depends(get_db)):
    db_match = models.Match(team1_id=match.team1_id, team2_id=match.team2_id)
    db.add(db_match)
    db.commit()
    db.refresh(db_match)
    return db_match

@router.get("/matches", response_model=List[schemas.MatchResponse])
def get_matches(db: Session = Depends(get_db)):
    return db.query(models.Match).all()

@router.put("/matches/{match_id}/score", response_model=schemas.MatchResponse)
def update_match_score(match_id: int, score_update: schemas.MatchScoreUpdate, db: Session = Depends(get_db)):
    db_match = db.query(models.Match).filter(models.Match.id == match_id).first()
    if not db_match:
        raise HTTPException(status_code=404, detail="Match not found")
    
    db_match.status = score_update.status
    db_match.winner_id = score_update.winner_id
    
    # If match is completed, update the wins/losses
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
    return db_match

