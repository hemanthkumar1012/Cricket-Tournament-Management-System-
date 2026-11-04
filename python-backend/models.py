from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    func,
)
from sqlalchemy.orm import relationship

from database import Base


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(80), nullable=False, unique=True, index=True)
    captain = Column(String(80), nullable=False, default="TBD")
    matches_played = Column(Integer, nullable=False, default=0)
    wins = Column(Integer, nullable=False, default=0)
    losses = Column(Integer, nullable=False, default=0)
    draws = Column(Integer, nullable=False, default=0)
    points = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    matches_as_team1 = relationship(
        "Match", foreign_keys="Match.team1_id", back_populates="team1"
    )
    matches_as_team2 = relationship(
        "Match", foreign_keys="Match.team2_id", back_populates="team2"
    )
    won_matches = relationship(
        "Match", foreign_keys="Match.winner_id", back_populates="winner"
    )
    players = relationship(
        "Player", back_populates="team", cascade="all, delete-orphan"
    )


class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(80), nullable=False, index=True)
    role = Column(String(40), nullable=False, default="Player")
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="SET NULL"), nullable=True)

    team = relationship("Team", back_populates="players")


class Match(Base):
    __tablename__ = "matches"
    __table_args__ = (
        CheckConstraint("team1_id != team2_id", name="ck_match_distinct_teams"),
        CheckConstraint(
            "team1_score IS NULL OR team1_score >= 0", name="ck_match_team1_score_nonnegative"
        ),
        CheckConstraint(
            "team2_score IS NULL OR team2_score >= 0", name="ck_match_team2_score_nonnegative"
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    team1_id = Column(Integer, ForeignKey("teams.id"), nullable=False, index=True)
    team2_id = Column(Integer, ForeignKey("teams.id"), nullable=False, index=True)
    team1_score = Column(Integer, nullable=True)
    team2_score = Column(Integer, nullable=True)
    winner_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    status = Column(String(20), nullable=False, default="SCHEDULED", index=True)
    scheduled_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    team1 = relationship("Team", foreign_keys=[team1_id], back_populates="matches_as_team1")
    team2 = relationship("Team", foreign_keys=[team2_id], back_populates="matches_as_team2")
    winner = relationship("Team", foreign_keys=[winner_id], back_populates="won_matches")
