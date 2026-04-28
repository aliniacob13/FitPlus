from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class NearbyQueryParams(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitudine (grade zecimale)")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Longitudine (grade zecimale)")
    radius_m: float = Field(5000.0, gt=0, le=50_000, description="Rază de căutare în metri (max 50 km)")

    @field_validator("radius_m")
    @classmethod
    def round_radius(cls, v: float) -> float:
        return round(v, 2)


class GymResponse(BaseModel):
    id: int
    name: str
    address: str | None
    phone: str | None
    website: str | None
    rating: float | None
    image_url: str | None = None
    opening_hours: dict | list | None = None
    equipment: dict | list | None = None
    pricing_plans: dict | list | None = None
    review_count: int = 0
    latitude: float
    longitude: float
    distance_m: float = Field(..., description="Distanța față de punctul de referință, în metri")

    model_config = {"from_attributes": True}


# ── Review schemas ────────────────────────────────────────────────────────────

class GymReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 (worst) to 5 (best)")
    comment: str | None = Field(default=None, max_length=2000)


class GymReviewResponse(BaseModel):
    id: int
    user_id: int
    gym_id: int
    rating: int
    comment: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Favorite schemas ──────────────────────────────────────────────────────────

class FavoriteGymResponse(BaseModel):
    favorite_id: int
    gym_id: int
    name: str
    address: str | None
    image_url: str | None
    latitude: float
    longitude: float
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Gym detail (enriched with reviews + favorite state) ──────────────────────

class GymDetailResponse(BaseModel):
    id: int
    name: str
    address: str | None
    phone: str | None
    website: str | None
    rating: float | None
    description: str | None = None
    image_url: str | None = None
    opening_hours: dict | list | None = None
    equipment: dict | list | None = None
    pricing_plans: dict | list | None = None
    review_count: int = 0
    latitude: float
    longitude: float
    reviews: list[GymReviewResponse] = []
    average_rating: float | None = None
    is_favorited: bool = False

    model_config = {"from_attributes": True}
