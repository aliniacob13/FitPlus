from datetime import date, datetime

from pydantic import BaseModel, Field


class PhysicalActivityCreate(BaseModel):
    activity_date: date | None = None
    activity_type: str = Field(..., min_length=1, max_length=32)
    duration_min: int = Field(..., ge=1, le=24 * 60)
    distance_km: float | None = Field(default=None, ge=0, le=500)
    calories_burned: float | None = Field(default=None, ge=0, le=50_000)
    notes: str | None = Field(default=None, max_length=2000)


class PhysicalActivityResponse(BaseModel):
    id: int
    user_id: int
    activity_date: date
    activity_type: str
    duration_min: int
    distance_km: float | None
    calories_burned: float | None
    notes: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class WaterIntakeUpsert(BaseModel):
    log_date: date
    ml_total: int = Field(..., ge=0, le=20_000)


class WaterIntakeRead(BaseModel):
    """GET when no row exists yet returns ml_total=0."""

    log_date: date
    ml_total: int


class WaterIntakeResponse(BaseModel):
    id: int
    user_id: int
    log_date: date
    ml_total: int
    updated_at: datetime

    model_config = {"from_attributes": True}
