from pydantic import BaseModel, Field


class PlaceGymSummary(BaseModel):
    place_id: str
    name: str
    address: str | None = None
    latitude: float
    longitude: float
    rating: float | None = None
    review_count: int | None = None
    website: str | None = None
    google_maps_url: str | None = None
    photo_url: str | None = None
    opening_hours: list[str] | None = None
    distance_m: float | None = None


class PlaceGymDetail(BaseModel):
    place_id: str
    name: str
    address: str | None = None
    latitude: float
    longitude: float
    phone: str | None = None
    website: str | None = None
    google_maps_url: str | None = None
    rating: float | None = None
    review_count: int | None = None
    opening_hours: list[str] | None = None
    photo_urls: list[str] = Field(default_factory=list)


class GeocodeResponse(BaseModel):
    latitude: float
    longitude: float
    formatted_address: str
    city: str | None = None
