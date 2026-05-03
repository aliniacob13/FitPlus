from enum import Enum


class Sex(str, Enum):
    male = "male"
    female = "female"


class ActivityLevel(str, Enum):
    sedentary = "sedentary"
    lightly_active = "lightly_active"
    moderately_active = "moderately_active"
    very_active = "very_active"
    extra_active = "extra_active"


class Goal(str, Enum):
    lose = "lose"
    maintain = "maintain"
    gain = "gain"


_ACTIVITY_MULTIPLIER: dict[ActivityLevel, float] = {
    ActivityLevel.sedentary: 1.2,
    ActivityLevel.lightly_active: 1.375,
    ActivityLevel.moderately_active: 1.55,
    ActivityLevel.very_active: 1.725,
    ActivityLevel.extra_active: 1.9,
}

_MIN_CALORIES = 1200


def compute_bmr(sex: Sex, age: int, weight_kg: float, height_cm: float) -> int:
    """Mifflin–St Jeor equation."""
    base = 10.0 * weight_kg + 6.25 * height_cm - 5.0 * age
    offset = 5 if sex == Sex.male else -161
    return round(base + offset)


def compute_tdee(bmr: int, activity_level: ActivityLevel) -> int:
    return round(bmr * _ACTIVITY_MULTIPLIER[activity_level])


def compute_target_calories(
    tdee: int,
    goal: Goal,
    weekly_rate_kg: float | None = None,
) -> int:
    if goal == Goal.maintain:
        return tdee

    if weekly_rate_kg is not None:
        # 7700 kcal ≈ 1 kg of body fat
        daily_delta = round(weekly_rate_kg * 7700 / 7)
    else:
        daily_delta = 500 if goal == Goal.lose else 300

    if goal == Goal.lose:
        return max(_MIN_CALORIES, tdee - daily_delta)

    return tdee + daily_delta


def compute_macros(weight_kg: float, target_calories: int) -> tuple[int, int, int]:
    """Returns (protein_g, carbs_g, fat_g). Protein 2 g/kg; fat 25 % of kcal; carbs the rest."""
    protein_g = round(2.0 * weight_kg)
    fat_g = round(target_calories * 0.25 / 9)
    remaining_kcal = target_calories - protein_g * 4 - fat_g * 9
    carbs_g = max(0, round(remaining_kcal / 4))
    return protein_g, carbs_g, fat_g
