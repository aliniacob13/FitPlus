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

    model_config = {"from_attributes": True}
