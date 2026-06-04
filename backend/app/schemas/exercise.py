from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, Field

_DEFAULT_WEIGHT_KG = 75.0  # fallback when user has no weight set


class ExerciseType(StrEnum):
    running = "running"
    walking = "walking"
    cycling = "cycling"
    swimming = "swimming"
    jump_rope = "jump_rope"
    yoga = "yoga"
    weight_training = "weight_training"
    hiit = "hiit"
    dancing = "dancing"
    hiking = "hiking"
    rowing = "rowing"
    elliptical = "elliptical"


# MET (Metabolic Equivalent of Task) values per exercise type.
# Calories burned = MET × weight_kg × (duration_minutes / 60)
EXERCISE_MET: dict[str, float] = {
    "running": 9.8,
    "walking": 3.5,
    "cycling": 7.5,
    "swimming": 8.0,
    "jump_rope": 12.3,
    "yoga": 2.5,
    "weight_training": 5.0,
    "hiit": 8.0,
    "dancing": 5.5,
    "hiking": 6.0,
    "rowing": 7.0,
    "elliptical": 5.0,
}


def compute_kcal(exercise_type: str, duration_minutes: int, weight_kg: float | None) -> float:
    met = EXERCISE_MET.get(exercise_type, 5.0)
    w = weight_kg if weight_kg and weight_kg > 0 else _DEFAULT_WEIGHT_KG
    return round(met * w * duration_minutes / 60, 1)


class ExerciseLogCreate(BaseModel):
    exercise_type: ExerciseType
    duration_minutes: int = Field(ge=1, le=600)
    notes: str | None = Field(default=None, max_length=500)


class ExerciseLogResponse(BaseModel):
    id: int
    exercise_type: str
    duration_minutes: int
    kcal_burned: float
    notes: str | None
    logged_at: datetime

    model_config = {"from_attributes": True}
