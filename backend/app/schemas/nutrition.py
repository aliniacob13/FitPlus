from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.services.nutrition import ActivityLevel, Goal, Sex

# ── Phase 1 — TDEE calculator ────────────────────────────────────────────────


class NutritionTargetRequest(BaseModel):
    sex: Sex
    age: int = Field(ge=13, le=100)
    weight_kg: float = Field(ge=20.0, le=500.0)
    height_cm: float = Field(ge=80.0, le=260.0)
    activity_level: ActivityLevel
    goal: Goal
    weekly_rate_kg: float | None = Field(default=None, ge=0.1, le=2.0)


class MacrosSuggestion(BaseModel):
    protein_g: int
    carbs_g: int
    fat_g: int


class NutritionTargetResponse(BaseModel):
    bmr: int
    tdee: int
    target_calories: int
    macros_suggestion: MacrosSuggestion


# ── Phase 2 — Food search ────────────────────────────────────────────────────


class FoodPer100g(BaseModel):
    kcal: float
    protein_g: float
    carbs_g: float
    fat_g: float


class FoodSearchResultItem(BaseModel):
    name: str
    external_id: str
    per_100g: FoodPer100g
    serving_g: float


# ── Phase 2 — Food log ───────────────────────────────────────────────────────


class FoodLogCreateRequest(BaseModel):
    date: date
    name: str = Field(min_length=1, max_length=255)
    grams: float = Field(gt=0, le=5000)
    kcal: float = Field(ge=0)
    protein_g: float = Field(ge=0)
    carbs_g: float = Field(ge=0)
    fat_g: float = Field(ge=0)
    source: Literal["manual", "search", "barcode", "plate"] = "manual"
    external_id: str | None = None


class FoodLogEntryResponse(BaseModel):
    id: int
    date: date
    name: str
    grams: float
    kcal: float
    protein_g: float
    carbs_g: float
    fat_g: float
    source: str
    created_at: datetime

    model_config = {"from_attributes": True}


class DailyTotals(BaseModel):
    kcal: float
    protein_g: float
    carbs_g: float
    fat_g: float


class FoodLogDayResponse(BaseModel):
    date: date
    entries: list[FoodLogEntryResponse]
    totals: DailyTotals
