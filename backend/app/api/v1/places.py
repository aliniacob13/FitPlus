from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from geoalchemy2.types import Geography
from sqlalchemy import cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.gym import Gym
from app.schemas.places import GeocodeResponse, PlaceGymDetail, PlaceGymSummary
from app.services.google_places import google_places_service

router = APIRouter(prefix="/places", tags=["Places"])

CITY_FALLBACK_COORDS: dict[str, tuple[float, float]] = {
    "bucuresti": (44.4268, 26.1025),
    "bucharest": (44.4268, 26.1025),
    "iasi": (47.1585, 27.6014),
    "cluj": (46.7712, 23.6236),
    "cluj-napoca": (46.7712, 23.6236),
    "timisoara": (45.7489, 21.2087),
    "constanta": (44.1598, 28.6348),
    "brasov": (45.6579, 25.6012),
}


def _to_weekday_lines(raw_opening_hours: Any) -> list[str] | None:
    if raw_opening_hours is None:
        return None
    if isinstance(raw_opening_hours, list):
        return [str(item) for item in raw_opening_hours]
    if isinstance(raw_opening_hours, dict):
        return [f"{k}: {v}" for k, v in raw_opening_hours.items()]
    return None


def _extract_local_id(place_id: str) -> int | None:
    if not place_id.startswith("local_"):
        return None
    try:
        return int(place_id.split("_", maxsplit=1)[1])
    except ValueError:
        return None


async def _fallback_local_nearby(
    db: AsyncSession,
    latitude: float,
    longitude: float,
    radius_m: int,
) -> list[PlaceGymSummary]:
    ref_point = cast(
        func.ST_SetSRID(func.ST_MakePoint(longitude, latitude), 4326),
        Geography,
    )
    gym_location_geog = cast(Gym.location, Geography)
    stmt = (
        select(
            Gym.id,
            Gym.name,
            Gym.address,
            Gym.rating,
            Gym.website,
            Gym.image_url,
            Gym.opening_hours,
            func.ST_Y(Gym.location).label("latitude"),
            func.ST_X(Gym.location).label("longitude"),
            func.ST_Distance(gym_location_geog, ref_point).label("distance_m"),
            Gym.review_count,
        )
        .where(func.ST_DWithin(gym_location_geog, ref_point, float(radius_m)))
        .order_by("distance_m")
        .limit(50)
    )
    rows = (await db.execute(stmt)).mappings().all()

    return [
        PlaceGymSummary(
            place_id=f"local_{row['id']}",
            name=row["name"],
            address=row["address"],
            latitude=row["latitude"],
            longitude=row["longitude"],
            rating=row["rating"],
            review_count=row["review_count"],
            website=row["website"],
            google_maps_url=f"https://www.google.com/maps/search/?api=1&query={row['latitude']},{row['longitude']}",
            photo_url=row["image_url"],
            opening_hours=_to_weekday_lines(row.get("opening_hours")),
            distance_m=row["distance_m"],
        )
        for row in rows
    ]


@router.get("/gyms/nearby", response_model=list[PlaceGymSummary])
async def search_real_gyms_nearby(
    latitude: float = Query(..., ge=-90.0, le=90.0),
    longitude: float = Query(..., ge=-180.0, le=180.0),
    radius_m: int = Query(20_000, ge=500, le=50_000),
    db: AsyncSession = Depends(get_db),
) -> list[PlaceGymSummary]:
    if google_places_service.is_enabled:
        try:
            places = await google_places_service.search_nearby_gyms(latitude, longitude, radius_m)
            if places:
                return places
        except Exception:
            pass
    return await _fallback_local_nearby(db, latitude, longitude, radius_m)


@router.get("/gyms/{place_id}", response_model=PlaceGymDetail)
async def get_real_gym_details(place_id: str, db: AsyncSession = Depends(get_db)) -> PlaceGymDetail:
    local_id = _extract_local_id(place_id)
    if local_id is not None:
        stmt = select(
            Gym.id,
            Gym.name,
            Gym.address,
            Gym.phone,
            Gym.website,
            Gym.rating,
            Gym.review_count,
            Gym.image_url,
            Gym.opening_hours,
            func.ST_Y(Gym.location).label("latitude"),
            func.ST_X(Gym.location).label("longitude"),
        ).where(Gym.id == local_id)
        row = (await db.execute(stmt)).mappings().first()
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Place not found.")
        return PlaceGymDetail(
            place_id=f"local_{row['id']}",
            name=row["name"],
            address=row["address"],
            latitude=row["latitude"],
            longitude=row["longitude"],
            phone=row["phone"],
            website=row["website"],
            google_maps_url=f"https://www.google.com/maps/search/?api=1&query={row['latitude']},{row['longitude']}",
            rating=row["rating"],
            review_count=row["review_count"],
            opening_hours=_to_weekday_lines(row.get("opening_hours")),
            photo_urls=[row["image_url"]] if row["image_url"] else [],
        )

    if not google_places_service.is_enabled:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Place not found.")

    detail = await google_places_service.get_place_details(place_id)
    if not detail:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Place not found.")
    return detail


@router.get("/geocode", response_model=GeocodeResponse)
async def geocode_location(query: str = Query(..., min_length=2, max_length=200)) -> GeocodeResponse:
    if google_places_service.is_enabled:
        try:
            result = await google_places_service.geocode(query)
            if result:
                return result
        except Exception:
            pass

    lowered = query.strip().lower()
    if "," in lowered:
        chunks = [part.strip() for part in lowered.split(",", maxsplit=1)]
        if len(chunks) == 2:
            try:
                lat = float(chunks[0])
                lng = float(chunks[1])
                return GeocodeResponse(
                    latitude=lat,
                    longitude=lng,
                    formatted_address=f"{lat}, {lng}",
                    city=None,
                )
            except ValueError:
                pass

    for city_key, (lat, lng) in CITY_FALLBACK_COORDS.items():
        if city_key in lowered:
            return GeocodeResponse(
                latitude=lat,
                longitude=lng,
                formatted_address=city_key.title(),
                city=city_key.title(),
            )

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found.")
