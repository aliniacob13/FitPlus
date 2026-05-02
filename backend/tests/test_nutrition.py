import pytest

from app.services.nutrition import (
    ActivityLevel,
    Goal,
    Sex,
    compute_bmr,
    compute_macros,
    compute_target_calories,
    compute_tdee,
)


def test_bmr_male_typical() -> None:
    # 10*70 + 6.25*175 − 5*30 + 5 = 700 + 1093.75 − 150 + 5 = 1648.75 → 1649
    assert compute_bmr(Sex.male, 30, 70.0, 175.0) == 1649


def test_bmr_female_typical() -> None:
    # 10*60 + 6.25*165 − 5*25 − 161 = 600 + 1031.25 − 125 − 161 = 1345.25 → 1345
    assert compute_bmr(Sex.female, 25, 60.0, 165.0) == 1345


def test_bmr_male_higher_than_female_same_stats() -> None:
    args = (30, 70.0, 175.0)
    assert compute_bmr(Sex.male, *args) > compute_bmr(Sex.female, *args)


def test_tdee_sedentary() -> None:
    assert compute_tdee(1600, ActivityLevel.sedentary) == round(1600 * 1.2)


def test_tdee_very_active() -> None:
    assert compute_tdee(1600, ActivityLevel.very_active) == round(1600 * 1.725)


def test_tdee_extra_active() -> None:
    assert compute_tdee(2000, ActivityLevel.extra_active) == round(2000 * 1.9)


def test_target_maintain_equals_tdee() -> None:
    assert compute_target_calories(2000, Goal.maintain) == 2000


def test_target_lose_default_500_deficit() -> None:
    assert compute_target_calories(2000, Goal.lose) == 1500


def test_target_gain_default_300_surplus() -> None:
    assert compute_target_calories(2000, Goal.gain) == 2300


def test_target_lose_with_weekly_rate() -> None:
    # 0.5 kg/week → 0.5 * 7700 / 7 = 550 kcal/day
    assert compute_target_calories(2000, Goal.lose, weekly_rate_kg=0.5) == 2000 - 550


def test_target_gain_with_weekly_rate() -> None:
    # 0.3 kg/week → 0.3 * 7700 / 7 ≈ 330 kcal/day
    assert compute_target_calories(2000, Goal.gain, weekly_rate_kg=0.3) == 2000 + round(0.3 * 7700 / 7)


def test_target_lose_clamped_above_minimum() -> None:
    # Very high weekly rate on low TDEE must not drop below 1200
    result = compute_target_calories(1400, Goal.lose, weekly_rate_kg=2.0)
    assert result >= 1200


def test_macros_protein_two_grams_per_kg() -> None:
    protein_g, _carbs, _fat = compute_macros(70.0, 2000)
    assert protein_g == 140  # 2 × 70


def test_macros_carbs_nonnegative() -> None:
    # Even with high protein and moderate calories, carbs must not go negative
    _protein, carbs, _fat = compute_macros(100.0, 2500)
    assert carbs >= 0


def test_macros_sum_approximates_target_calories() -> None:
    protein_g, carbs_g, fat_g = compute_macros(70.0, 2000)
    approx_kcal = protein_g * 4 + carbs_g * 4 + fat_g * 9
    # rounding may cause small difference
    assert abs(approx_kcal - 2000) < 50
