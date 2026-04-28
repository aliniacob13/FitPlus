from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import OAuth2PasswordBearer
from geoalchemy2.types import Geography
from sqlalchemy import cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import ACCESS_TOKEN_TYPE, decode_token
from app.models.favorite import FavoriteGym
from app.models.gym import Gym
from app.models.review import GymReview
from app.models.user import User
from app.schemas.places import PlaceGymDetail
from app.services.google_places import google_places_service
from app.schemas.gym import (
    FavoriteGymResponse,
    GymDetailResponse,
    GymResponse,
    GymReviewCreate,
    GymReviewResponse,
)

router = APIRouter(prefix="/gyms", tags=["Gyms"])

_oauth2_optional = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


async def _get_current_user_optional(
    token: str | None = Depends(_oauth2_optional),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    """Returns the authenticated user, or None if no valid token is present."""
    if not token:
        return None
    decoded = decode_token(token)
    if not decoded or decoded.get("type") != ACCESS_TOKEN_TYPE:
        return None
    try:
        user_id = int(decoded["sub"])
    except (KeyError, ValueError):
        return None
    return await db.get(User, user_id)


_oauth2_required = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=True)


async def _require_current_user(
    token: str = Depends(_oauth2_required),
    db: AsyncSession = Depends(get_db),
) -> User:
    decoded = decode_token(token)
    if not decoded or decoded.get("type") != ACCESS_TOKEN_TYPE:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token.")
    try:
        user_id = int(decoded["sub"])
    except (KeyError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload.")
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found.")
    return user


def _extract_local_id(place_id: str) -> int | None:
    if not place_id.startswith("local_"):
        return None
    try:
        return int(place_id.split("_", maxsplit=1)[1])
    except ValueError:
        return None


def _opening_hours_to_json(value: Any) -> dict[str, str] | list[str] | None:
    if value is None:
        return None
    if isinstance(value, dict):
        return value
    if isinstance(value, list):
        return [str(item) for item in value]
    return None


async def _upsert_gym_from_place(
    db: AsyncSession,
    place_id: str,
    place: PlaceGymDetail,
) -> Gym:
    gym = await db.scalar(select(Gym).where(Gym.place_id == place_id))
    if gym:
        gym.name = place.name
        gym.address = place.address
        gym.phone = place.phone
        gym.website = place.website
        gym.rating = place.rating
        gym.image_url = place.photo_urls[0] if place.photo_urls else gym.image_url
        gym.opening_hours = _opening_hours_to_json(place.opening_hours)
        gym.review_count = place.review_count or gym.review_count
        gym.location = f"SRID=4326;POINT ({place.longitude} {place.latitude})"
        db.add(gym)
        await db.commit()
        await db.refresh(gym)
        return gym

    gym = Gym(
        place_id=place_id,
        source="google_places",
        name=place.name,
        address=place.address,
        phone=place.phone,
        website=place.website,
        rating=place.rating,
        image_url=place.photo_urls[0] if place.photo_urls else None,
        opening_hours=_opening_hours_to_json(place.opening_hours),
        review_count=place.review_count or 0,
        location=f"SRID=4326;POINT ({place.longitude} {place.latitude})",
    )
    db.add(gym)
    await db.commit()
    await db.refresh(gym)
    return gym


async def _resolve_db_gym_by_place_id(place_id: str, db: AsyncSession) -> Gym:
    local_id = _extract_local_id(place_id)
    if local_id is not None:
        gym = await db.get(Gym, local_id)
        if not gym:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gym not found.")
        return gym

    gym = await db.scalar(select(Gym).where(Gym.place_id == place_id))
    if gym:
        return gym

    if not google_places_service.is_enabled:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gym not found in local database and Google Places is disabled.",
        )

    place = await google_places_service.get_place_details(place_id)
    if not place:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gym not found in Google Places.")

    return await _upsert_gym_from_place(db, place_id, place)


# ── Nearby gyms ───────────────────────────────────────────────────────────────

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
    ref_point = cast(
        func.ST_SetSRID(func.ST_MakePoint(longitude, latitude), 4326),
        Geography,
    )
    gym_location_geog = cast(Gym.location, Geography)

    stmt = (
        select(
            Gym.id,
            Gym.place_id,
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
            func.ST_Y(Gym.location).label("latitude"),
            func.ST_X(Gym.location).label("longitude"),
            func.ST_Distance(gym_location_geog, ref_point).label("distance_m"),
        )
        .where(func.ST_DWithin(gym_location_geog, ref_point, radius_m))
        .order_by("distance_m")
    )

    result = await db.execute(stmt)
    rows = result.mappings().all()
    return [GymResponse(**row) for row in rows]


# ── Gym detail ────────────────────────────────────────────────────────────────

@router.get("/{gym_id}", response_model=GymDetailResponse)
async def get_gym_detail(
    gym_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(_get_current_user_optional),
) -> GymDetailResponse:
    stmt = (
        select(
            Gym.id,
            Gym.place_id,
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

    reviews = list(
        (
            await db.execute(
                select(GymReview)
                .where(GymReview.gym_id == gym_id)
                .order_by(GymReview.created_at.desc())
            )
        )
        .scalars()
        .all()
    )

    avg_rating: float | None = None
    if reviews:
        avg_rating = round(sum(r.rating for r in reviews) / len(reviews), 2)

    is_favorited = False
    if current_user:
        fav = await db.scalar(
            select(FavoriteGym).where(
                FavoriteGym.user_id == current_user.id,
                FavoriteGym.gym_id == gym_id,
            )
        )
        is_favorited = fav is not None

    return GymDetailResponse(
        **dict(row),
        reviews=[GymReviewResponse.model_validate(r) for r in reviews],
        average_rating=avg_rating,
        is_favorited=is_favorited,
    )


@router.post("/resolve-place/{place_id}", response_model=GymDetailResponse)
async def resolve_place_to_db_gym(
    place_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(_get_current_user_optional),
) -> GymDetailResponse:
    gym = await _resolve_db_gym_by_place_id(place_id, db)

    stmt = (
        select(
            Gym.id,
            Gym.place_id,
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
        ).where(Gym.id == gym.id)
    )
    row = (await db.execute(stmt)).mappings().first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gym not found.")

    reviews = list(
        (
            await db.execute(
                select(GymReview)
                .where(GymReview.gym_id == gym.id)
                .order_by(GymReview.created_at.desc())
            )
        )
        .scalars()
        .all()
    )
    avg_rating = round(sum(r.rating for r in reviews) / len(reviews), 2) if reviews else None

    is_favorited = False
    if current_user:
        fav = await db.scalar(
            select(FavoriteGym).where(
                FavoriteGym.user_id == current_user.id,
                FavoriteGym.gym_id == gym.id,
            )
        )
        is_favorited = fav is not None

    return GymDetailResponse(
        **dict(row),
        reviews=[GymReviewResponse.model_validate(r) for r in reviews],
        average_rating=avg_rating,
        is_favorited=is_favorited,
    )


# ── Reviews ───────────────────────────────────────────────────────────────────

@router.post("/{gym_id}/reviews", response_model=GymReviewResponse, status_code=status.HTTP_201_CREATED)
async def add_review(
    gym_id: int,
    payload: GymReviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_require_current_user),
) -> GymReviewResponse:
    gym = await db.get(Gym, gym_id)
    if not gym:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gym not found.")

    existing = await db.scalar(
        select(GymReview).where(
            GymReview.user_id == current_user.id,
            GymReview.gym_id == gym_id,
        )
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already reviewed this gym.",
        )

    review = GymReview(
        user_id=current_user.id,
        gym_id=gym_id,
        rating=payload.rating,
        comment=payload.comment,
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)
    return GymReviewResponse.model_validate(review)


@router.get("/{gym_id}/reviews", response_model=list[GymReviewResponse])
async def get_reviews(
    gym_id: int,
    db: AsyncSession = Depends(get_db),
) -> list[GymReviewResponse]:
    gym = await db.get(Gym, gym_id)
    if not gym:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gym not found.")

    reviews = list(
        (
            await db.execute(
                select(GymReview)
                .where(GymReview.gym_id == gym_id)
                .order_by(GymReview.created_at.desc())
            )
        )
        .scalars()
        .all()
    )
    return [GymReviewResponse.model_validate(r) for r in reviews]


# ── Favorites ─────────────────────────────────────────────────────────────────

@router.post("/{gym_id}/favorite", response_model=dict)
async def toggle_favorite(
    gym_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_require_current_user),
) -> dict:
    gym = await db.get(Gym, gym_id)
    if not gym:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gym not found.")

    existing = await db.scalar(
        select(FavoriteGym).where(
            FavoriteGym.user_id == current_user.id,
            FavoriteGym.gym_id == gym_id,
        )
    )

    if existing:
        await db.delete(existing)
        await db.commit()
        return {"is_favorited": False, "message": "Gym removed from favorites."}

    db.add(FavoriteGym(user_id=current_user.id, gym_id=gym_id))
    await db.commit()
    return {"is_favorited": True, "message": "Gym added to favorites."}
