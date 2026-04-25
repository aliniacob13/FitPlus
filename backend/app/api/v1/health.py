from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.models.diet import DietPreference
from app.schemas.diet import DietPreferenceCreateUpdate, DietPreferenceResponse

# Am schimbat prefixul aici ca să nu se bată cu restul
router = APIRouter(
    prefix="/api/v1/diet",
    tags=["Health & Diet"]
)

async def get_current_user_mock():
    return {"id": 1}

@router.get("/preferences", response_model=DietPreferenceResponse)
async def get_diet_preferences(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user_mock)
):
    result = await db.execute(select(DietPreference).where(DietPreference.user_id == current_user["id"]))
    preference = result.scalars().first()
    if not preference:
        raise HTTPException(status_code=404, detail="Nu am găsit preferințe.")
    return preference

@router.put("/preferences", response_model=DietPreferenceResponse)
async def update_diet_preferences(
    prefs: DietPreferenceCreateUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user_mock)
):
    result = await db.execute(select(DietPreference).where(DietPreference.user_id == current_user["id"]))
    preference = result.scalars().first()

    if preference:
        for key, value in prefs.model_dump().items():
            setattr(preference, key, value)
    else:
        preference = DietPreference(user_id=current_user["id"], **prefs.model_dump())
        db.add(preference)
        
    await db.commit()
    await db.refresh(preference)
    return preference