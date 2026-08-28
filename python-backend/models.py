from sqlalchemy import Column, Integer, String, ForeignKey
from database import Base

class Team(Base):
    __tablename__ = "py_teams"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True)
    captain = Column(String(255))
    matches_played = Column(Integer, default=0)
    wins = Column(Integer, default=0)
    losses = Column(Integer, default=0)
    points = Column(Integer, default=0)

class Player(Base):
    __tablename__ = "py_players"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True)
    role = Column(String(255))
    team_id = Column(Integer, ForeignKey("py_teams.id"))

class Match(Base):
    __tablename__ = "py_matches"
    id = Column(Integer, primary_key=True, index=True)
    team1_id = Column(Integer, ForeignKey("py_teams.id"))
    team2_id = Column(Integer, ForeignKey("py_teams.id"))
    status = Column(String(255), default="SCHEDULED")
    winner_id = Column(Integer, ForeignKey("py_teams.id"), nullable=True)

