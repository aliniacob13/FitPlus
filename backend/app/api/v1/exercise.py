from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.users import get_current_user
from app.core.database import get_db
from app.models.exercise_log import ExerciseLog
from app.models.user import User
from app.schemas.exercise import ExerciseLogCreate, ExerciseLogResponse, compute_kcal

router = APIRouter(tags=["Exercise"])


@router.post(
    "/users/me/exercise-log",
    response_model=ExerciseLogResponse,
    status_code=status.HTTP_201_CREATED,
)
async def log_exercise(
    payload: ExerciseLogCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ExerciseLogResponse:
    kcal = compute_kcal(
        payload.exercise_type.value,
        payload.duration_minutes,
        current_user.weight_kg,
    )
    entry = ExerciseLog(
        user_id=current_user.id,
        exercise_type=payload.exercise_type.value,
        duration_minutes=payload.duration_minutes,
        kcal_burned=kcal,
        notes=payload.notes,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return ExerciseLogResponse.model_validate(entry)


@router.get("/users/me/exercise-log", response_model=list[ExerciseLogResponse])
async def get_exercise_log(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[ExerciseLogResponse]:
    result = await db.execute(
        select(ExerciseLog)
        .where(ExerciseLog.user_id == current_user.id)
        .order_by(ExerciseLog.logged_at.desc())
    )
    return [ExerciseLogResponse.model_validate(e) for e in result.scalars().all()]


@router.delete("/exercise-log/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_exercise_log_entry(
    entry_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    entry = await db.get(ExerciseLog, entry_id)
    if not entry or entry.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found.")
    await db.delete(entry)
    await db.commit()
