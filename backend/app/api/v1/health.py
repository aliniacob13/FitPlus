from pathlib import Path
from tempfile import gettempdir

from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.users import get_current_user
from app.core.database import get_db
from app.models.diet import DietPreference, Prescription, WeightLog
from app.models.user import User
from app.schemas.diet import (
    DietPreferenceCreateUpdate,
    DietPreferenceResponse,
    PrescriptionResponse,
    WeightLogCreate,
    WeightLogResponse,
)

router = APIRouter(prefix="/users/me", tags=["Health & Diet"])


@router.post(
    "/prescriptions",
    response_model=PrescriptionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_prescription(
    file: UploadFile = File(...),
    notes: str | None = Form(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PrescriptionResponse:
    temp_dir = Path(gettempdir()) / "fitplus_prescriptions"
    temp_dir.mkdir(parents=True, exist_ok=True)

    safe_filename = Path(file.filename or "prescription_upload").name
    destination = temp_dir / f"user_{current_user.id}_{safe_filename}"

    file_bytes = await file.read()
    destination.write_bytes(file_bytes)
    await file.close()

    prescription = Prescription(
        user_id=current_user.id,
        filename=safe_filename,
        s3_url_or_path=str(destination),
        notes=notes,
    )
    db.add(prescription)
    await db.commit()
    await db.refresh(prescription)

    return PrescriptionResponse.model_validate(prescription)


@router.get("/prescriptions", response_model=list[PrescriptionResponse])
async def list_user_prescriptions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[PrescriptionResponse]:
    query = (
        select(Prescription)
        .where(Prescription.user_id == current_user.id)
        .order_by(Prescription.uploaded_at.desc())
    )
    result = await db.execute(query)
    prescriptions = result.scalars().all()
    return [PrescriptionResponse.model_validate(item) for item in prescriptions]


@router.get("/diet-preferences", response_model=DietPreferenceResponse)
async def get_diet_preferences(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DietPreferenceResponse:
    query = select(DietPreference).where(DietPreference.user_id == current_user.id)
    result = await db.execute(query)
    preferences = result.scalar_one_or_none()

    if preferences is None:
        preferences = DietPreference(
            user_id=current_user.id,
            restrictions=[],
            allergies=[],
            goals=None,
        )
        db.add(preferences)
        await db.commit()
        await db.refresh(preferences)

    return DietPreferenceResponse.model_validate(preferences)


@router.put("/diet-preferences", response_model=DietPreferenceResponse)
async def upsert_diet_preferences(
    payload: DietPreferenceCreateUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DietPreferenceResponse:
    query = select(DietPreference).where(DietPreference.user_id == current_user.id)
    result = await db.execute(query)
    preferences = result.scalar_one_or_none()

    if preferences is None:
        preferences = DietPreference(user_id=current_user.id)

    data = payload.model_dump()
    normalized_restrictions = data["restrictions"] or []
    legacy_preferences = data.get("preferences")
    if not normalized_restrictions and legacy_preferences:
        if isinstance(legacy_preferences, str):
            normalized_restrictions = [legacy_preferences]
        else:
            normalized_restrictions = [str(item) for item in legacy_preferences if str(item).strip()]

    preferences.restrictions = normalized_restrictions
    preferences.allergies = data["allergies"] or []
    preferences.goals = data["goals"]

    db.add(preferences)
    await db.commit()
    await db.refresh(preferences)

    return DietPreferenceResponse.model_validate(preferences)


@router.post(
    "/weight-log",
    response_model=WeightLogResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_weight_log(
    payload: WeightLogCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> WeightLogResponse:
    weight_log = WeightLog(
        user_id=current_user.id,
        weight_kg=payload.weight_kg,
    )
    db.add(weight_log)
    await db.commit()
    await db.refresh(weight_log)

    return WeightLogResponse.model_validate(weight_log)


@router.get("/weight-log", response_model=list[WeightLogResponse])
async def list_weight_logs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[WeightLogResponse]:
    query = (
        select(WeightLog)
        .where(WeightLog.user_id == current_user.id)
        .order_by(WeightLog.logged_at.desc())
    )
    result = await db.execute(query)
    weight_logs = result.scalars().all()
    return [WeightLogResponse.model_validate(item) for item in weight_logs]
