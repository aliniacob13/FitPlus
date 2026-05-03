from datetime import UTC, date as DateType, datetime

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.users import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.models.food_log import FoodLogEntry
from app.models.user import User
from app.schemas.nutrition import (
    DailyTotals,
    FoodLogCreateRequest,
    FoodLogDayResponse,
    FoodLogEntryResponse,
    FoodPer100g,
    FoodSearchResultItem,
    LabelScanResponse,
    MacrosSuggestion,
    NutritionTargetRequest,
    NutritionTargetResponse,
)
from app.services.nutrition import compute_bmr, compute_macros, compute_target_calories, compute_tdee
from app.services.ocr import extract_text, parse_nutrition_label
from app.services.usda import USDAServiceError, search_foods

router = APIRouter(tags=["Nutrition"])


# ── Phase 1 — TDEE calculator ────────────────────────────────────────────────


@router.post("/users/me/nutrition-targets/compute", response_model=NutritionTargetResponse)
async def compute_nutrition_targets(
    payload: NutritionTargetRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> NutritionTargetResponse:
    bmr = compute_bmr(payload.sex, payload.age, payload.weight_kg, payload.height_cm)
    tdee = compute_tdee(bmr, payload.activity_level)
    target_calories = compute_target_calories(tdee, payload.goal, payload.weekly_rate_kg)
    protein_g, carbs_g, fat_g = compute_macros(payload.weight_kg, target_calories)

    current_user.daily_calorie_target = float(target_calories)
    current_user.nutrition_target_updated_at = datetime.now(UTC)
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)

    return NutritionTargetResponse(
        bmr=bmr,
        tdee=tdee,
        target_calories=target_calories,
        macros_suggestion=MacrosSuggestion(
            protein_g=protein_g,
            carbs_g=carbs_g,
            fat_g=fat_g,
        ),
    )


# ── Phase 2 — Food search ────────────────────────────────────────────────────


@router.get("/nutrition/foods/search", response_model=list[FoodSearchResultItem])
async def food_search(
    q: str = Query(min_length=1, max_length=200),
    page: int = Query(default=1, ge=1, le=100),
    _current_user: User = Depends(get_current_user),
) -> list[FoodSearchResultItem]:
    try:
        results = await search_foods(q, settings.USDA_API_KEY, page=page)
    except USDAServiceError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=exc.message,
        ) from exc
    return [
        FoodSearchResultItem(
            name=r.name,
            external_id=r.external_id,
            per_100g=FoodPer100g(
                kcal=r.per_100g.kcal,
                protein_g=r.per_100g.protein_g,
                carbs_g=r.per_100g.carbs_g,
                fat_g=r.per_100g.fat_g,
            ),
            serving_g=r.serving_g,
        )
        for r in results
    ]


# ── Phase 2 — Food log ───────────────────────────────────────────────────────


@router.post(
    "/users/me/food-log",
    response_model=FoodLogEntryResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_food_log_entry(
    payload: FoodLogCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FoodLogEntryResponse:
    entry = FoodLogEntry(
        user_id=current_user.id,
        date=payload.date,
        name=payload.name,
        grams=payload.grams,
        kcal=round(payload.kcal, 2),
        protein_g=round(payload.protein_g, 2),
        carbs_g=round(payload.carbs_g, 2),
        fat_g=round(payload.fat_g, 2),
        source=payload.source,
        raw_payload={"external_id": payload.external_id} if payload.external_id else None,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return FoodLogEntryResponse.model_validate(entry)


@router.get("/users/me/food-log", response_model=FoodLogDayResponse)
async def get_food_log(
    date: DateType = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FoodLogDayResponse:
    result = await db.execute(
        select(FoodLogEntry)
        .where(FoodLogEntry.user_id == current_user.id, FoodLogEntry.date == date)
        .order_by(FoodLogEntry.created_at)
    )
    entries = result.scalars().all()

    totals = DailyTotals(
        kcal=round(sum(e.kcal for e in entries), 2),
        protein_g=round(sum(e.protein_g for e in entries), 2),
        carbs_g=round(sum(e.carbs_g for e in entries), 2),
        fat_g=round(sum(e.fat_g for e in entries), 2),
    )

    return FoodLogDayResponse(
        date=date,
        entries=[FoodLogEntryResponse.model_validate(e) for e in entries],
        totals=totals,
    )


# ── Phase 3 — Label scan ────────────────────────────────────────────────────

_ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"}


@router.post("/nutrition/label-scan", response_model=LabelScanResponse)
async def label_scan(
    image: UploadFile = File(...),
    _current_user: User = Depends(get_current_user),
) -> LabelScanResponse:
    if image.content_type not in _ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported type '{image.content_type}'. Send JPEG, PNG, or WebP.",
        )
    data = await image.read()
    max_mb = settings.NUTRITION_LABEL_SCAN_MAX_IMAGE_MB
    if max_mb > 0:
        max_bytes = max_mb * 1024 * 1024
        if len(data) > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Image must be under {max_mb} MB.",
            )
    try:
        text = extract_text(data)
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    result = parse_nutrition_label(text)
    return LabelScanResponse(
        kcal=result.kcal,
        fat_g=result.fat_g,
        carbs_g=result.carbs_g,
        protein_g=result.protein_g,
        serving_size_g=result.serving_size_g,
        per_100g=result.per_100g,
        confidence=result.confidence,
    )


@router.delete("/food-log/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_food_log_entry(
    entry_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    entry = await db.get(FoodLogEntry, entry_id)
    if not entry or entry.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found.")
    await db.delete(entry)
    await db.commit()
