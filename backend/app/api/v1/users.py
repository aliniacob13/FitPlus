from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import ACCESS_TOKEN_TYPE, decode_token
from app.models.favorite import FavoriteGym
from app.models.gym import Gym
from app.models.subscription import Subscription
from app.models.user import User
from app.schemas.gym import FavoriteGymResponse
from app.schemas.payments import UserSubscriptionResponse
from app.schemas.user import UserProfileResponse, UserProfileUpdateRequest

router = APIRouter(prefix="/users", tags=["Users"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    decoded = decode_token(token)
    if not decoded or decoded.get("type") != ACCESS_TOKEN_TYPE:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token.",
        )

    user_id = decoded.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token payload.",
        )

    try:
        parsed_user_id = int(user_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user id in token.",
        ) from exc

    user = await db.get(User, parsed_user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found.",
        )

    return user


@router.get("/me", response_model=UserProfileResponse)
async def get_me(current_user: User = Depends(get_current_user)) -> UserProfileResponse:
    return UserProfileResponse.model_validate(current_user)


@router.put("/me", response_model=UserProfileResponse)
async def update_me(
    payload: UserProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserProfileResponse:
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(current_user, key, value)

    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)

    return UserProfileResponse.model_validate(current_user)


@router.get("/me/favorites", response_model=list[FavoriteGymResponse])
async def get_my_favorites(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[FavoriteGymResponse]:
    stmt = (
        select(
            FavoriteGym.id.label("favorite_id"),
            FavoriteGym.gym_id,
            FavoriteGym.created_at,
            Gym.place_id,
            Gym.name,
            Gym.address,
            Gym.image_url,
            func.ST_Y(Gym.location).label("latitude"),
            func.ST_X(Gym.location).label("longitude"),
        )
        .join(Gym, FavoriteGym.gym_id == Gym.id)
        .where(FavoriteGym.user_id == current_user.id)
        .order_by(FavoriteGym.created_at.desc())
    )
    rows = (await db.execute(stmt)).mappings().all()
    return [FavoriteGymResponse(**row) for row in rows]


@router.get("/me/subscriptions", response_model=list[UserSubscriptionResponse])
async def get_my_subscriptions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[UserSubscriptionResponse]:
    stmt = (
        select(Subscription, Gym.name)
        .join(Gym, Gym.id == Subscription.gym_id)
        .where(Subscription.user_id == current_user.id)
        .order_by(Subscription.created_at.desc())
    )
    rows = (await db.execute(stmt)).all()
    return [
        UserSubscriptionResponse(
            id=sub.id,
            gym_id=sub.gym_id,
            gym_name=gym_name,
            plan_name=sub.plan_name,
            status=sub.status,
            stripe_subscription_id=sub.stripe_subscription_id,
            started_at=sub.started_at,
            expires_at=sub.expires_at,
            created_at=sub.created_at,
        )
        for sub, gym_name in rows
    ]
