"""Unit tests for the nutrition label OCR parser (no Tesseract installation needed)."""
import pytest

from app.services.ocr import LabelParseResult, parse_nutrition_label


def test_parse_full_us_label() -> None:
    text = """
    Nutrition Facts
    Serving size: 100g
    Calories 250
    Total Fat 10g
    Total Carbohydrate 30g
    Protein 20g
    """
    r = parse_nutrition_label(text)
    assert r.kcal == 250.0
    assert r.fat_g == 10.0
    assert r.carbs_g == 30.0
    assert r.protein_g == 20.0
    assert r.serving_size_g == 100.0
    assert r.confidence == 1.0


def test_parse_eu_label_per_100g() -> None:
    text = """
    Per 100g
    Energy: 200 kcal
    Fat: 8g
    Carbohydrate: 25g
    Protein: 15g
    """
    r = parse_nutrition_label(text)
    assert r.kcal == 200.0
    assert r.fat_g == 8.0
    assert r.carbs_g == 25.0
    assert r.protein_g == 15.0
    assert r.per_100g is True
    assert r.confidence == 1.0


def test_parse_partial_label() -> None:
    text = "Calories 150\nProtein 12g"
    r = parse_nutrition_label(text)
    assert r.kcal == 150.0
    assert r.protein_g == 12.0
    assert r.fat_g is None
    assert r.carbs_g is None
    assert r.confidence == 0.5


def test_parse_empty_text() -> None:
    r = parse_nutrition_label("")
    assert r.kcal is None
    assert r.fat_g is None
    assert r.carbs_g is None
    assert r.protein_g is None
    assert r.confidence == 0.0


def test_parse_kcal_inline_per_100g() -> None:
    text = "250kcal per 100g\nFat 5g\nCarbohydrates 35g\nProtein 8g"
    r = parse_nutrition_label(text)
    assert r.kcal == 250.0
    assert r.per_100g is True
    assert r.confidence == 1.0


def test_parse_decimal_values() -> None:
    text = "Calories: 123.5\nTotal Fat: 5.5g\nCarbohydrate: 15.25g\nProtein: 10.75g"
    r = parse_nutrition_label(text)
    assert r.kcal == 123.5
    assert r.fat_g == 5.5
    assert r.carbs_g == 15.25
    assert r.protein_g == 10.75


def test_parse_colon_separator() -> None:
    text = "Energy: 310 kcal\nFat: 12g\nCarbs: 40g\nProtein: 18g\nServing size: 150g"
    r = parse_nutrition_label(text)
    assert r.kcal == 310.0
    assert r.fat_g == 12.0
    assert r.carbs_g == 40.0
    assert r.protein_g == 18.0
    assert r.serving_size_g == 150.0
    assert r.confidence == 1.0


def test_confidence_bounds() -> None:
    for text in ["", "Calories 100", "Calories 100\nProtein 10g", "Calories 100\nProtein 10g\nFat 5g"]:
        r = parse_nutrition_label(text)
        assert 0.0 <= r.confidence <= 1.0


def test_per_100g_flag_absent() -> None:
    text = "Calories 200\nFat 8g\nCarbs 25g\nProtein 10g\nServing size: 60g"
    r = parse_nutrition_label(text)
    assert r.per_100g is False


def test_return_type_is_label_parse_result() -> None:
    r = parse_nutrition_label("anything")
    assert isinstance(r, LabelParseResult)