from fastapi import APIRouter

from app.schemas.user import UserProfileResponse

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserProfileResponse)
async def get_me() -> UserProfileResponse:
    return UserProfileResponse(
        id="demo-user-1",
        email="demo@fitplus.com",
        name="Demo User",
        age=26,
        weight_kg=71.0,
        height_cm=176.0,
        fitness_level="intermediate",
        goals="Build muscle while improving cardio",
    )
