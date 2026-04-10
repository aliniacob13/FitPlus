from fastapi import APIRouter

from app.api.v1.gyms import router as gyms_router

router = APIRouter()

router.include_router(gyms_router)


@router.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok"}
