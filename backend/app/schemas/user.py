from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserProfileResponse(BaseModel):
    id: int
    email: EmailStr
    name: str
    age: int | None = None
    weight_kg: float | None = None
    height_cm: float | None = None
    fitness_level: str | None = None
    goals: str | None = None
    daily_calorie_target: float | None = None
    nutrition_target_updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class UserProfileUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    age: int | None = Field(default=None, ge=13, le=100)
    weight_kg: float | None = Field(default=None, ge=20, le=500)
    height_cm: float | None = Field(default=None, ge=80, le=260)
    fitness_level: str | None = Field(default=None, min_length=2, max_length=50)
    goals: str | None = Field(default=None, max_length=2000)
