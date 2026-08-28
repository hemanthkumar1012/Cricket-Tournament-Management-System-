from pydantic import BaseModel
from typing import Optional, List

class TeamCreate(BaseModel):
    name: str
    captain: Optional[str] = None

class TeamResponse(TeamCreate):
    id: int
    matches_played: int = 0
    wins: int = 0
    losses: int = 0
    points: int = 0

    class Config:
        from_attributes = True

class PlayerCreate(BaseModel):
    name: str
    role: Optional[str] = None
    team_id: Optional[int] = None

class PlayerResponse(PlayerCreate):
    id: int

    class Config:
        from_attributes = True

class MatchCreate(BaseModel):
    team1_id: int
    team2_id: int

class MatchScoreUpdate(BaseModel):
    status: str
    winner_id: Optional[int] = None

class MatchResponse(MatchCreate):
    id: int
    status: str
    winner_id: Optional[int] = None

    class Config:
        from_attributes = True

