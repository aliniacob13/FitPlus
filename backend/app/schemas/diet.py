from datetime import datetime

from pydantic import BaseModel, Field


# --- SCHEME PREFERINȚE DIETĂ ---
class DietPreferenceBase(BaseModel):
    restrictions: list[str] | None = Field(default_factory=list)
    allergies: list[str] | None = Field(default_factory=list)
    goals: str | None = None


class DietPreferenceCreateUpdate(DietPreferenceBase):
    # Backward-compatibility input used by some clients:
    # preferences can come as a single string or a list.
    preferences: list[str] | str | None = None


class DietPreferenceResponse(DietPreferenceBase):
    id: int
    user_id: int
    updated_at: datetime

    class Config:
        from_attributes = True


# --- SCHEME GREUTATE (Weight Log) ---
class WeightLogBase(BaseModel):
    weight_kg: float


class WeightLogCreate(WeightLogBase):
    pass


class WeightLogResponse(WeightLogBase):
    id: int
    user_id: int
    logged_at: datetime

    class Config:
        from_attributes = True


# --- SCHEME PRESCripții ---
class PrescriptionResponse(BaseModel):
    id: int
    user_id: int
    filename: str
    s3_url_or_path: str
    notes: str | None = None
    uploaded_at: datetime

    class Config:
        from_attributes = True
