from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.services.gym_seed import seed_bucharest_gyms

router = APIRouter(prefix="/dev", tags=["Dev"])


def _assert_seed_allowed(x_seed_token: str | None) -> None:
    if not settings.SEED_ENABLED:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found.")

    if settings.SEED_TOKEN:
        if not x_seed_token or x_seed_token != settings.SEED_TOKEN:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid seed token.")
        return

    if not settings.DEBUG:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found.")


@router.post("/seed-gyms")
async def seed_gyms(
    db: AsyncSession = Depends(get_db),
    x_seed_token: str | None = Header(default=None, alias="X-Seed-Token"),
) -> dict[str, int]:
    _assert_seed_allowed(x_seed_token)
    inserted = await seed_bucharest_gyms(db)
    return {"inserted": inserted}
