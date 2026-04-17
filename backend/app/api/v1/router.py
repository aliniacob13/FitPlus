from fastapi import APIRouter

from app.api.v1.ai import router as ai_router
from app.api.v1.auth import router as auth_router
from app.api.v1.gyms import router as gyms_router
from app.api.v1.users import router as users_router

router = APIRouter()

router.include_router(auth_router)
router.include_router(users_router)
router.include_router(gyms_router)
router.include_router(ai_router)


@router.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok"}
