from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator


class TeamCreate(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    captain: str = Field(min_length=2, max_length=80)


class TeamResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    captain: str
    matches_played: int
    wins: int
    losses: int
    draws: int
    points: int


class PlayerCreate(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    role: str = Field(default="Player", min_length=2, max_length=40)
    team_id: Optional[int] = None


class PlayerUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=80)
    role: Optional[str] = Field(default=None, min_length=2, max_length=40)
    team_id: Optional[int] = None


class PlayerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    role: str
    team_id: Optional[int] = None


class MatchCreate(BaseModel):
    team1_id: int = Field(gt=0)
    team2_id: int = Field(gt=0)
    scheduled_at: Optional[datetime] = None

    @model_validator(mode="after")
    def teams_must_be_different(self):
        if self.team1_id == self.team2_id:
            raise ValueError("A team cannot play against itself")
        return self


class MatchScoreUpdate(BaseModel):
    team1_score: int = Field(ge=0)
    team2_score: int = Field(ge=0)


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=80)
    password: str = Field(min_length=1, max_length=200)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
