from datetime import date, datetime, timedelta
from pathlib import Path
from tempfile import gettempdir

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Response, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.users import get_current_user
from app.core.database import get_db
from app.models.diet import DietPreference, Prescription, WeightLog
from app.models.user import User
from app.models.wellness import DailyWaterIntake, PhysicalActivityLog
from app.schemas.diet import (
    DietPreferenceCreateUpdate,
    DietPreferenceResponse,
    PrescriptionResponse,
    WeightLogCreate,
    WeightLogResponse,
)
from app.schemas.wellness import (
    PhysicalActivityCreate,
    PhysicalActivityResponse,
    WaterIntakeRead,
    WaterIntakeResponse,
    WaterIntakeUpsert,
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


@router.delete(
    "/prescriptions/{prescription_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_prescription(
    prescription_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    print(f"[DELETE] prescription_id: {prescription_id}, type: {type(prescription_id)}")
    print(f"[DELETE] current_user.id: {current_user.id}, type: {type(current_user.id)}")
    
    query = select(Prescription).where(
        Prescription.id == prescription_id,
        Prescription.user_id == current_user.id,
    )
    result = await db.execute(query)
    prescription = result.scalar_one_or_none()
    
    print(f"[DELETE] prescription found: {prescription is not None}")

    if prescription is None:
        print(f"[DELETE] Prescription not found for ID: {prescription_id}, user: {current_user.id}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found")

    file_path = Path(prescription.s3_url_or_path)
    if file_path.is_absolute() and file_path.exists():
        file_path.unlink(missing_ok=True)

    await db.delete(prescription)
    await db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)


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
    current_user.weight_kg = payload.weight_kg
    db.add(current_user)

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


@router.post(
    "/physical-activities",
    response_model=PhysicalActivityResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_physical_activity(
    payload: PhysicalActivityCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PhysicalActivityResponse:
    data = payload.model_dump()
    activity_date = data.pop("activity_date") or date.today()
    row = PhysicalActivityLog(
        user_id=current_user.id,
        activity_date=activity_date,
        **data,
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return PhysicalActivityResponse.model_validate(row)


@router.get("/physical-activities", response_model=list[PhysicalActivityResponse])
async def list_physical_activities(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[PhysicalActivityResponse]:
    today = date.today()
    end = end_date or today
    start = start_date or (end - timedelta(days=120))
    stmt = (
        select(PhysicalActivityLog)
        .where(
            PhysicalActivityLog.user_id == current_user.id,
            PhysicalActivityLog.activity_date >= start,
            PhysicalActivityLog.activity_date <= end,
        )
        .order_by(PhysicalActivityLog.activity_date.desc(), PhysicalActivityLog.created_at.desc())
    )
    result = await db.execute(stmt)
    rows = result.scalars().all()
    return [PhysicalActivityResponse.model_validate(r) for r in rows]


@router.get("/water-intake", response_model=WaterIntakeRead)
async def get_water_intake(
    log_date: date = Query(alias="date"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> WaterIntakeRead:
    stmt = select(DailyWaterIntake).where(
        DailyWaterIntake.user_id == current_user.id,
        DailyWaterIntake.log_date == log_date,
    )
    result = await db.execute(stmt)
    row = result.scalar_one_or_none()
    if row is None:
        return WaterIntakeRead(log_date=log_date, ml_total=0)
    return WaterIntakeRead(log_date=row.log_date, ml_total=row.ml_total)


@router.put("/water-intake", response_model=WaterIntakeResponse)
async def upsert_water_intake(
    payload: WaterIntakeUpsert,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> WaterIntakeResponse:
    stmt = select(DailyWaterIntake).where(
        DailyWaterIntake.user_id == current_user.id,
        DailyWaterIntake.log_date == payload.log_date,
    )
    result = await db.execute(stmt)
    row = result.scalar_one_or_none()
    if row is None:
        row = DailyWaterIntake(
            user_id=current_user.id,
            log_date=payload.log_date,
            ml_total=payload.ml_total,
        )
        db.add(row)
    else:
        row.ml_total = payload.ml_total
        db.add(row)
    await db.commit()
    await db.refresh(row)
    return WaterIntakeResponse.model_validate(row)
