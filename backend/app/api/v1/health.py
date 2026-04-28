from pathlib import Path
from tempfile import gettempdir

from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.users import get_current_user
from app.core.database import get_db
from app.models.diet import Prescription
from app.models.user import User
from app.schemas.diet import PrescriptionResponse

router = APIRouter(prefix="/health", tags=["Health & Diet"])


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
