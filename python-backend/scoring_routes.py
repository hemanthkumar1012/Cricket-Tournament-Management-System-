from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import models
import scoring_models as score_models
import scoring_schemas as score_schemas
from database import get_db
from security import require_admin

router = APIRouter(tags=["Ball-by-ball scoring"])
BOWLER_WICKETS = {"bowled", "caught", "lbw", "stumped", "hit_wicket"}


def _not_found():
    raise HTTPException(status_code=404, detail="Match or innings not found")


def _get_match(db: Session, match_id: int):
    match = db.query(models.Match).filter(models.Match.id == match_id).first()
    if match is None:
        _not_found()
    return match


def _team_summary(db: Session, team_id: int):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    return {"id": team.id, "name": team.name, "teamName": team.name} if team else None


def _innings_payload(db: Session, innings: score_models.Innings) -> dict:
    deliveries = (
        db.query(score_models.Delivery)
        .filter(score_models.Delivery.innings_id == innings.id)
        .order_by(score_models.Delivery.sequence_no.asc())
        .all()
    )
    batting_players = (
        db.query(models.Player)
        .filter(models.Player.team_id == innings.batting_team_id)
        .order_by(models.Player.name.asc())
        .all()
    )
    bowling_players = (
        db.query(models.Player)
        .filter(models.Player.team_id == innings.bowling_team_id)
        .order_by(models.Player.name.asc())
        .all()
    )
    player_names = {player.id: player.name for player in batting_players + bowling_players}

    batting_stats = {
        player.id: {
            "player_id": player.id,
            "name": player.name,
            "role": player.role,
            "runs": 0,
            "balls_faced": 0,
            "fours": 0,
            "sixes": 0,
            "dismissal": None,
            "status": "yet to bat",
            "_first_seen": 999999,
        }
        for player in batting_players
    }
    bowling_stats = {
        player.id: {
            "player_id": player.id,
            "name": player.name,
            "overs": "0.0",
            "legal_balls": 0,
            "maidens": 0,
            "runs_conceded": 0,
            "wickets": 0,
        }
        for player in bowling_players
    }

    dismissed = set()
    for delivery in deliveries:
        for player_id in (delivery.striker_id, delivery.non_striker_id):
            if player_id in batting_stats:
                batting_stats[player_id]["_first_seen"] = min(
                    batting_stats[player_id]["_first_seen"], delivery.sequence_no
                )

        batter = batting_stats.get(delivery.striker_id)
        if batter:
            batter["_first_seen"] = min(batter["_first_seen"], delivery.sequence_no)
            batter["runs"] += delivery.batter_runs
            if delivery.extra_type not in {"WIDE", "NO_BALL"}:
                batter["balls_faced"] += 1
            if delivery.batter_runs == 4:
                batter["fours"] += 1
            if delivery.batter_runs == 6:
                batter["sixes"] += 1

        if delivery.dismissed_player_id:
            dismissed.add(delivery.dismissed_player_id)
            if delivery.dismissed_player_id in batting_stats:
                batting_stats[delivery.dismissed_player_id]["dismissal"] = (
                    delivery.dismissal_type.replace("_", " ").title()
                )

        bowler = bowling_stats.get(delivery.bowler_id)
        if bowler:
            if delivery.is_legal:
                bowler["legal_balls"] += 1
            bowler_runs = delivery.total_runs
            if delivery.extra_type in {"BYE", "LEG_BYE"}:
                bowler_runs -= delivery.extras_runs
            bowler["runs_conceded"] += bowler_runs
            if delivery.dismissal_type in BOWLER_WICKETS:
                bowler["wickets"] += 1

    for player_id, stats in batting_stats.items():
        if stats["_first_seen"] != 999999:
            stats["status"] = "out" if player_id in dismissed else "not out"
        stats.pop("_first_seen")
    batting_rows = sorted(
        batting_stats.values(),
        key=lambda item: (
            item["status"] == "yet to bat",
            item["_first_seen"],
            item["name"].casefold(),
        ),
    )
    for stats in batting_rows:
        stats.pop("_first_seen")
    for stats in bowling_stats.values():
        stats["overs"] = f'{stats["legal_balls"] // 6}.{stats["legal_balls"] % 6}'

    first = (
        db.query(score_models.Innings)
        .filter(
            score_models.Innings.match_id == innings.match_id,
            score_models.Innings.innings_number == 1,
        )
        .first()
    )
    target = first.total_runs + 1 if innings.innings_number == 2 and first else None
    runs_required = max(0, target - innings.total_runs) if target is not None else None
    balls_remaining = max(0, innings.overs_limit * 6 - innings.legal_balls)

    current_striker = None
    current_non_striker = None
    if deliveries:
        last = deliveries[-1]
        current_striker = last.striker_id
        current_non_striker = last.non_striker_id
        completed_runs = last.batter_runs + last.extras_runs
        if completed_runs % 2:
            current_striker, current_non_striker = current_non_striker, current_striker
        if last.is_legal and innings.legal_balls % 6 == 0:
            current_striker, current_non_striker = current_non_striker, current_striker
        if last.dismissed_player_id == current_striker:
            current_striker = None
        elif last.dismissed_player_id == current_non_striker:
            current_non_striker = None

    run_rate = round(innings.total_runs * 6 / innings.legal_balls, 2) if innings.legal_balls else 0.0
    recent_deliveries = [
        {
            "id": item.id,
            "sequence_no": item.sequence_no,
            "label": item.ball_label,
            "runs": item.total_runs,
            "batter_runs": item.batter_runs,
            "extra_type": item.extra_type,
            "extras_runs": item.extras_runs,
            "wicket": item.wicket,
            "dismissal_type": item.dismissal_type,
            "dismissed_player": player_names.get(item.dismissed_player_id),
            "bowler": player_names.get(item.bowler_id),
            "striker": player_names.get(item.striker_id),
            "summary": (
                "W"
                if item.wicket
                else f'{item.total_runs}wd'
                if item.extra_type == "WIDE"
                else f'{item.total_runs}nb'
                if item.extra_type == "NO_BALL"
                else str(item.total_runs)
            ),
        }
        for item in deliveries[-12:]
    ]

    return {
        "id": innings.id,
        "innings_number": innings.innings_number,
        "batting_team": _team_summary(db, innings.batting_team_id),
        "bowling_team": _team_summary(db, innings.bowling_team_id),
        "batting_team_id": innings.batting_team_id,
        "bowling_team_id": innings.bowling_team_id,
        "overs_limit": innings.overs_limit,
        "overs": f"{innings.legal_balls // 6}.{innings.legal_balls % 6}",
        "total_runs": innings.total_runs,
        "wickets": innings.wickets,
        "legal_balls": innings.legal_balls,
        "extras": innings.extras,
        "run_rate": run_rate,
        "target": target,
        "runs_required": runs_required,
        "balls_remaining": balls_remaining,
        "status": innings.status,
        "current_striker_id": current_striker,
        "current_non_striker_id": current_non_striker,
        "batting": batting_rows,
        "bowling": list(bowling_stats.values()),
        "deliveries": recent_deliveries,
    }


def _scorecard(db: Session, match_id: int) -> dict:
    match = _get_match(db, match_id)
    innings = (
        db.query(score_models.Innings)
        .filter(score_models.Innings.match_id == match_id)
        .order_by(score_models.Innings.innings_number.asc())
        .all()
    )
    return {
        "match": {
            "id": match.id,
            "status": match.status,
            "team1": _team_summary(db, match.team1_id),
            "team2": _team_summary(db, match.team2_id),
            "team1Score": match.team1_score,
            "team2Score": match.team2_score,
        },
        "innings": [_innings_payload(db, item) for item in innings],
    }


@router.get("/matches/{match_id}/scorecard")
def get_match_scorecard(match_id: int, db: Session = Depends(get_db)):
    return _scorecard(db, match_id)


@router.post("/matches/{match_id}/innings", status_code=status.HTTP_201_CREATED)
def create_innings(
    match_id: int,
    payload: score_schemas.InningsCreate,
    db: Session = Depends(get_db),
    admin: str = Depends(require_admin),
):
    match = _get_match(db, match_id)
    if match.status == "COMPLETED":
        raise HTTPException(status_code=409, detail="A completed match cannot be started again")

    existing = (
        db.query(score_models.Innings)
        .filter(score_models.Innings.match_id == match_id)
        .order_by(score_models.Innings.innings_number.asc())
        .all()
    )
    if len(existing) == 0:
        if payload.batting_team_id not in {match.team1_id, match.team2_id}:
            raise HTTPException(status_code=422, detail="The batting team must be part of this fixture")
        innings_number = 1
        batting_team_id = payload.batting_team_id
        bowling_team_id = match.team2_id if batting_team_id == match.team1_id else match.team1_id
    elif len(existing) == 1:
        first = existing[0]
        if first.status != "COMPLETED":
            raise HTTPException(status_code=409, detail="Finish the first innings before starting the chase")
        innings_number = 2
        batting_team_id = first.bowling_team_id
        bowling_team_id = first.batting_team_id
        if payload.batting_team_id != batting_team_id:
            raise HTTPException(status_code=422, detail="The team that bowled first must bat second")
    else:
        raise HTTPException(status_code=409, detail="Both innings have already been created")

    batter_count = db.query(models.Player).filter(models.Player.team_id == batting_team_id).count()
    bowler_count = db.query(models.Player).filter(models.Player.team_id == bowling_team_id).count()
    if batter_count < 2 or bowler_count < 1:
        raise HTTPException(
            status_code=409,
            detail="Add at least two players to the batting team and one player to the bowling team before starting an innings",
        )

    innings = score_models.Innings(
        match_id=match_id,
        innings_number=innings_number,
        batting_team_id=batting_team_id,
        bowling_team_id=bowling_team_id,
        overs_limit=payload.overs_limit,
        status="IN_PROGRESS",
    )
    db.add(innings)
    match.status = "LIVE"
    db.commit()
    db.refresh(innings)
    return _scorecard(db, match_id)


@router.post("/innings/{innings_id}/deliveries", status_code=status.HTTP_201_CREATED)
def record_delivery(
    innings_id: int,
    payload: score_schemas.DeliveryCreate,
    db: Session = Depends(get_db),
    admin: str = Depends(require_admin),
):
    innings = db.query(score_models.Innings).filter(score_models.Innings.id == innings_id).first()
    if innings is None:
        _not_found()
    if innings.status != "IN_PROGRESS":
        raise HTTPException(status_code=409, detail="This innings has finished")
    if innings.legal_balls >= innings.overs_limit * 6 or innings.wickets >= 10:
        raise HTTPException(status_code=409, detail="The innings is already complete")

    striker = db.query(models.Player).filter(models.Player.id == payload.striker_id).first()
    non_striker = db.query(models.Player).filter(models.Player.id == payload.non_striker_id).first()
    bowler = db.query(models.Player).filter(models.Player.id == payload.bowler_id).first()
    if (
        striker is None
        or non_striker is None
        or bowler is None
        or striker.team_id != innings.batting_team_id
        or non_striker.team_id != innings.batting_team_id
        or bowler.team_id != innings.bowling_team_id
    ):
        raise HTTPException(status_code=422, detail="Select two batters from the batting team and a bowler from the bowling team")

    dismissed_before = {
        row[0]
        for row in db.query(score_models.Delivery.dismissed_player_id)
        .filter(score_models.Delivery.innings_id == innings_id)
        .all()
        if row[0] is not None
    }
    if payload.striker_id in dismissed_before or payload.non_striker_id in dismissed_before:
        raise HTTPException(status_code=409, detail="A dismissed batter cannot return to the crease")

    if payload.wicket and payload.dismissed_player_id in dismissed_before:
        raise HTTPException(status_code=409, detail="This batter has already been dismissed")

    previous = (
        db.query(score_models.Delivery)
        .filter(score_models.Delivery.innings_id == innings_id)
        .order_by(score_models.Delivery.sequence_no.desc())
        .first()
    )
    sequence_no = previous.sequence_no + 1 if previous else 1
    legal_before = innings.legal_balls
    is_legal = payload.extra_type not in {"WIDE", "NO_BALL"}
    penalty = 1 if payload.extra_type in {"WIDE", "NO_BALL"} else 0
    total_runs = payload.batter_runs + payload.extras_runs + penalty
    ball_number = legal_before % 6 + 1
    suffix = ".wd" if payload.extra_type == "WIDE" else ".nb" if payload.extra_type == "NO_BALL" else ""
    delivery = score_models.Delivery(
        innings_id=innings_id,
        sequence_no=sequence_no,
        ball_label=f"{legal_before // 6}.{ball_number}{suffix}",
        striker_id=payload.striker_id,
        non_striker_id=payload.non_striker_id,
        bowler_id=payload.bowler_id,
        batter_runs=payload.batter_runs,
        extra_type=payload.extra_type,
        extras_runs=payload.extras_runs,
        total_runs=total_runs,
        is_legal=is_legal,
        wicket=payload.wicket,
        dismissal_type=payload.dismissal_type,
        dismissed_player_id=payload.dismissed_player_id,
    )

    db.add(delivery)
    innings.total_runs += total_runs
    innings.extras += payload.extras_runs + penalty
    if is_legal:
        innings.legal_balls += 1
    if payload.wicket:
        innings.wickets += 1

    batting_squad_size = db.query(models.Player).filter(
        models.Player.team_id == innings.batting_team_id
    ).count()
    max_wickets = min(10, max(1, batting_squad_size - 1))

    first = (
        db.query(score_models.Innings)
        .filter(
            score_models.Innings.match_id == innings.match_id,
            score_models.Innings.innings_number == 1,
        )
        .first()
    )
    target_reached = (
        innings.innings_number == 2
        and first is not None
        and innings.total_runs >= first.total_runs + 1
    )
    innings_complete = (
        innings.legal_balls >= innings.overs_limit * 6
        or innings.wickets >= max_wickets
        or target_reached
    )
    if innings_complete:
        innings.status = "COMPLETED"
        innings.completed_at = datetime.now(timezone.utc)

    db.commit()
    return _scorecard(db, innings.match_id)


@router.delete("/innings/{innings_id}/last-delivery")
def undo_last_delivery(
    innings_id: int,
    db: Session = Depends(get_db),
    admin: str = Depends(require_admin),
):
    innings = db.query(score_models.Innings).filter(score_models.Innings.id == innings_id).first()
    if innings is None:
        _not_found()
    match = _get_match(db, innings.match_id)
    if match.status == "COMPLETED":
        raise HTTPException(status_code=409, detail="A finalized match cannot be edited")
    if innings.innings_number == 1:
        second_exists = (
            db.query(score_models.Innings)
            .filter(
                score_models.Innings.match_id == innings.match_id,
                score_models.Innings.innings_number == 2,
            )
            .first()
        )
        if second_exists:
            raise HTTPException(status_code=409, detail="Undo the second innings before changing the first innings")
    last = (
        db.query(score_models.Delivery)
        .filter(score_models.Delivery.innings_id == innings_id)
        .order_by(score_models.Delivery.sequence_no.desc())
        .first()
    )
    if last is None:
        raise HTTPException(status_code=409, detail="There is no delivery to undo")

    db.delete(last)
    db.flush()
    remaining = (
        db.query(score_models.Delivery)
        .filter(score_models.Delivery.innings_id == innings_id)
        .all()
    )
    innings.total_runs = sum(item.total_runs for item in remaining)
    innings.wickets = sum(1 for item in remaining if item.wicket)
    innings.legal_balls = sum(1 for item in remaining if item.is_legal)
    innings.extras = sum(
        item.extras_runs + (1 if item.extra_type in {"WIDE", "NO_BALL"} else 0)
        for item in remaining
    )
    innings.status = "IN_PROGRESS"
    innings.completed_at = None

    first = (
        db.query(score_models.Innings)
        .filter(
            score_models.Innings.match_id == innings.match_id,
            score_models.Innings.innings_number == 1,
        )
        .first()
    )
    target_reached = (
        innings.innings_number == 2
        and first is not None
        and innings.total_runs >= first.total_runs + 1
    )
    batting_squad_size = db.query(models.Player).filter(
        models.Player.team_id == innings.batting_team_id
    ).count()
    max_wickets = min(10, max(1, batting_squad_size - 1))
    if innings.legal_balls >= innings.overs_limit * 6 or innings.wickets >= max_wickets or target_reached:
        innings.status = "COMPLETED"
        innings.completed_at = datetime.now(timezone.utc)

    match.status = "LIVE"
    db.commit()
    return _scorecard(db, innings.match_id)


@router.post("/matches/{match_id}/finish")
def finish_scored_match(
    match_id: int,
    db: Session = Depends(get_db),
    admin: str = Depends(require_admin),
):
    match = _get_match(db, match_id)
    innings = (
        db.query(score_models.Innings)
        .filter(score_models.Innings.match_id == match_id)
        .order_by(score_models.Innings.innings_number.asc())
        .all()
    )
    if len(innings) != 2 or any(item.status != "COMPLETED" for item in innings):
        raise HTTPException(status_code=409, detail="Both innings must be completed before finalizing the match")
    scores = {item.batting_team_id: item.total_runs for item in innings}
    return _finalize_from_scoring(match, scores, db)


def _finalize_from_scoring(match, scores: dict, db: Session):
    from routes import record_match_result

    return record_match_result(
        match.id,
        scores[match.team1_id],
        scores[match.team2_id],
        db,
        allow_scored=True,
    )
