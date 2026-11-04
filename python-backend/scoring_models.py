from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    func,
)

from database import Base


class Innings(Base):
    __tablename__ = "match_innings"
    __table_args__ = (
        UniqueConstraint("match_id", "innings_number", name="uq_match_innings_number"),
        CheckConstraint("innings_number IN (1, 2)", name="ck_innings_number"),
        CheckConstraint("overs_limit BETWEEN 1 AND 50", name="ck_innings_overs_limit"),
        CheckConstraint("total_runs >= 0", name="ck_innings_runs_nonnegative"),
        CheckConstraint("wickets BETWEEN 0 AND 10", name="ck_innings_wickets"),
        CheckConstraint("legal_balls >= 0", name="ck_innings_balls_nonnegative"),
    )

    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id", ondelete="CASCADE"), nullable=False, index=True)
    innings_number = Column(Integer, nullable=False)
    batting_team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    bowling_team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    overs_limit = Column(Integer, nullable=False, default=20)
    total_runs = Column(Integer, nullable=False, default=0)
    wickets = Column(Integer, nullable=False, default=0)
    legal_balls = Column(Integer, nullable=False, default=0)
    extras = Column(Integer, nullable=False, default=0)
    status = Column(String(20), nullable=False, default="IN_PROGRESS", index=True)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)


class Delivery(Base):
    __tablename__ = "match_deliveries"
    __table_args__ = (
        UniqueConstraint("innings_id", "sequence_no", name="uq_innings_delivery_sequence"),
        CheckConstraint("sequence_no > 0", name="ck_delivery_sequence_positive"),
        CheckConstraint("batter_runs BETWEEN 0 AND 6", name="ck_delivery_batter_runs"),
        CheckConstraint("extras_runs >= 0", name="ck_delivery_extras_nonnegative"),
        CheckConstraint("total_runs >= 0", name="ck_delivery_total_nonnegative"),
    )

    id = Column(Integer, primary_key=True, index=True)
    innings_id = Column(Integer, ForeignKey("match_innings.id", ondelete="CASCADE"), nullable=False, index=True)
    sequence_no = Column(Integer, nullable=False)
    ball_label = Column(String(16), nullable=False)
    striker_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    non_striker_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    bowler_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    batter_runs = Column(Integer, nullable=False, default=0)
    extra_type = Column(String(16), nullable=False, default="NONE")
    extras_runs = Column(Integer, nullable=False, default=0)
    total_runs = Column(Integer, nullable=False, default=0)
    is_legal = Column(Boolean, nullable=False, default=True)
    wicket = Column(Boolean, nullable=False, default=False)
    dismissal_type = Column(String(32), nullable=True)
    dismissed_player_id = Column(Integer, ForeignKey("players.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
