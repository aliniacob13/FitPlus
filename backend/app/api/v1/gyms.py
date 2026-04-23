from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from geoalchemy2.types import Geography
from sqlalchemy import cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.gym import Gym
from app.schemas.gym import GymDetailResponse, GymResponse

router = APIRouter(prefix="/gyms", tags=["Gyms"])


@router.get("/nearby", response_model=list[GymResponse])
async def get_nearby_gyms(
    latitude: Annotated[float, Query(ge=-90.0, le=90.0, description="Latitudine GPS")],
    longitude: Annotated[float, Query(ge=-180.0, le=180.0, description="Longitudine GPS")],
    radius_m: Annotated[float, Query(gt=0, le=50_000, description="Rază în metri (max 50 km)")] = 5000.0,
    db: AsyncSession = Depends(get_db),
) -> list[GymResponse]:
    """
    Returnează sălile de fitness aflate în raza specificată față de coordonatele date.

    Folosește **ST_DWithin** pe tipul `geography` (WGS-84) astfel încât
    distanța este calculată în **metri**, nu grade.

    - `ST_DWithin(geography, geography, radius_m)` → filtrare spațială indexată
    - `ST_Distance(geography, geography)` → distanța exactă la fiecare rezultat
    - `ST_X / ST_Y` → extrage lon/lat din coloana geometry pentru răspuns
    """
    # Punct de referință (parametrii din query) — SRID 4326, cast la geography
    ref_point = cast(
        func.ST_SetSRID(func.ST_MakePoint(longitude, latitude), 4326),
        Geography,
    )

    # Coloana location a sălii — cast la geography pentru calcul metric
    gym_location_geog = cast(Gym.location, Geography)

    stmt = (
        select(
            Gym.id,
            Gym.name,
            Gym.address,
            Gym.phone,
            Gym.website,
            Gym.rating,
            Gym.image_url,
            Gym.opening_hours,
            Gym.equipment,
            Gym.pricing_plans,
            Gym.review_count,
            func.ST_Y(Gym.location).label("latitude"),   # ST_Y = lat pentru POINT(lon lat)
            func.ST_X(Gym.location).label("longitude"),  # ST_X = lon
            func.ST_Distance(gym_location_geog, ref_point).label("distance_m"),
        )
        .where(
            func.ST_DWithin(gym_location_geog, ref_point, radius_m)
        )
        .order_by("distance_m")
    )

    result = await db.execute(stmt)
    rows = result.mappings().all()

    return [GymResponse(**row) for row in rows]


@router.get("/{gym_id}", response_model=GymDetailResponse)
async def get_gym_detail(
    gym_id: int,
    db: AsyncSession = Depends(get_db),
) -> GymDetailResponse:
    stmt = (
        select(
            Gym.id,
            Gym.name,
            Gym.address,
            Gym.phone,
            Gym.website,
            Gym.rating,
            Gym.description,
            Gym.image_url,
            Gym.opening_hours,
            Gym.equipment,
            Gym.pricing_plans,
            Gym.review_count,
            func.ST_Y(Gym.location).label("latitude"),
            func.ST_X(Gym.location).label("longitude"),
        ).where(Gym.id == gym_id)
    )

    row = (await db.execute(stmt)).mappings().first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gym not found.")

    return GymDetailResponse(**row)
