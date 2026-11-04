from typing import Literal, Optional

from pydantic import BaseModel, Field, model_validator


class InningsCreate(BaseModel):
    batting_team_id: int = Field(gt=0)
    overs_limit: int = Field(default=20, ge=1, le=50)


class DeliveryCreate(BaseModel):
    striker_id: int = Field(gt=0)
    non_striker_id: int = Field(gt=0)
    bowler_id: int = Field(gt=0)
    batter_runs: int = Field(default=0, ge=0, le=6)
    extra_type: Literal["NONE", "WIDE", "NO_BALL", "BYE", "LEG_BYE"] = "NONE"
    extras_runs: int = Field(default=0, ge=0, le=6)
    wicket: bool = False
    dismissal_type: Optional[
        Literal["bowled", "caught", "lbw", "run_out", "stumped", "hit_wicket", "obstructing_field"]
    ] = None
    dismissed_player_id: Optional[int] = Field(default=None, gt=0)

    @model_validator(mode="after")
    def validate_delivery(self):
        if self.striker_id == self.non_striker_id:
            raise ValueError("Striker and non-striker must be different players")
        if self.extra_type == "NONE" and self.extras_runs:
            raise ValueError("Extra runs require an extras type")
        if self.extra_type == "WIDE" and self.batter_runs:
            raise ValueError("A wide cannot also contain batter runs")
        if self.extra_type in {"BYE", "LEG_BYE"} and self.batter_runs:
            raise ValueError("Bye and leg-bye runs cannot be credited to the batter")
        if self.extra_type in {"BYE", "LEG_BYE"} and self.extras_runs < 1:
            raise ValueError("Byes and leg-byes must add at least one extra run")
        if self.wicket:
            if not self.dismissal_type or self.dismissed_player_id is None:
                raise ValueError("Select a dismissal type and the dismissed batter")
            if self.dismissed_player_id not in {self.striker_id, self.non_striker_id}:
                raise ValueError("The dismissed player must be at the crease")
            if self.extra_type == "NO_BALL" and self.dismissal_type not in {"run_out", "obstructing_field"}:
                raise ValueError("A no-ball can only record a run out or obstructing-field dismissal here")
            if self.extra_type == "WIDE" and self.dismissal_type not in {
                "run_out", "stumped", "obstructing_field"
            }:
                raise ValueError("That dismissal is not valid on a wide")
        elif self.dismissal_type or self.dismissed_player_id is not None:
            raise ValueError("Dismissal details require wicket=true")
        return self
