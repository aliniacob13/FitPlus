import re
from dataclasses import dataclass

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.diet import DietPreference, Prescription, WeightLog
from app.models.user import User


@dataclass(slots=True)
class UserHealthContext:
    allergies: str = ""
    preferences: str = ""
    current_weight: str = ""
    target_weight: str = ""
    prescription_references: str = ""


def _extract_target_weight(goals_text: str | None) -> str:
    if not goals_text:
        return ""

    lowered = goals_text.lower()
    if not any(keyword in lowered for keyword in ("target", "goal", "tinta", "țintă")):
        return ""

    match = re.search(r"(\d+(?:[.,]\d+)?)\s*kg", lowered)
    if not match:
        return ""

    return match.group(1).replace(",", ".")


async def get_user_health_context_for_ai(user_id: int, db: AsyncSession) -> UserHealthContext:
    diet_preferences = await db.scalar(
        select(DietPreference).where(DietPreference.user_id == user_id)
    )
    latest_weight = await db.scalar(
        select(WeightLog)
        .where(WeightLog.user_id == user_id)
        .order_by(WeightLog.logged_at.desc(), WeightLog.id.desc())
        .limit(1)
    )
    prescriptions_count = await db.scalar(
        select(func.count(Prescription.id)).where(Prescription.user_id == user_id)
    )
    user = await db.get(User, user_id)

    allergies_items = (diet_preferences.allergies if diet_preferences else None) or []
    preferences_items = (diet_preferences.restrictions if diet_preferences else None) or []

    return UserHealthContext(
        allergies=", ".join(str(item) for item in allergies_items if item),
        preferences=", ".join(str(item) for item in preferences_items if item),
        current_weight=str(latest_weight.weight_kg) if latest_weight else "",
        target_weight=_extract_target_weight(
            (diet_preferences.goals if diet_preferences else None) or (user.goals if user else None)
        ),
        prescription_references=(
            f"{prescriptions_count} prescription(s) uploaded." if prescriptions_count else ""
        ),
    )
