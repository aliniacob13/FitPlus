"""Unit tests for the nutrition label OCR parser (no Tesseract installation needed)."""

from app.services.ocr import LabelParseResult, _rows_by_position, parse_nutrition_label


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
    for text in [
        "",
        "Calories 100",
        "Calories 100\nProtein 10g",
        "Calories 100\nProtein 10g\nFat 5g",
    ]:
        r = parse_nutrition_label(text)
        assert 0.0 <= r.confidence <= 1.0


def test_per_100g_flag_absent() -> None:
    text = "Calories 200\nFat 8g\nCarbs 25g\nProtein 10g\nServing size: 60g"
    r = parse_nutrition_label(text)
    assert r.per_100g is False


def test_return_type_is_label_parse_result() -> None:
    r = parse_nutrition_label("anything")
    assert isinstance(r, LabelParseResult)


def test_parse_romanian_label_comma_decimals() -> None:
    """Romanian labels use comma as decimal separator and Romanian keywords."""
    text = """
    Declaratie nutritionala
    Valoare energetica 1234 kJ / 294 kcal
    Grasimi 10,5 g
    din care acizi grasi saturati 3,2 g
    Glucide 45,0 g
    din care zaharuri 12,3 g
    Fibre 2,1 g
    Proteine 8,5 g
    Sare 0,85 g
    """
    r = parse_nutrition_label(text)
    assert r.kcal == 294.0
    assert r.fat_g == 10.5
    assert r.carbs_g == 45.0
    assert r.protein_g == 8.5
    assert r.confidence == 1.0


def test_parse_romanian_din_care_does_not_override_main_row() -> None:
    """'din care acizi grasi' sub-row must not be captured as fat_g."""
    text = """
    Grasimi 12,0 g
    din care acizi grasi saturati 4,0 g
    Glucide 30,0 g
    din care zaharuri 5,0 g
    Proteine 9,0 g
    Energie 250 kcal
    """
    r = parse_nutrition_label(text)
    assert r.fat_g == 12.0, "Should capture top-level fat row, not saturated sub-row"
    assert r.carbs_g == 30.0, "Should capture top-level carbs row, not sugars sub-row"


def test_rows_by_position_two_column_layout() -> None:
    """Simulate Tesseract reading a two-column nutrition table.

    Without positional reconstruction, Tesseract outputs block 1 (left column:
    all labels) then block 2 (right column: all values), so 'Grasimi' and
    '10,5 g' end up separated by 6 unrelated lines. _rows_by_position must
    interleave them correctly by visual Y coordinate.
    """
    # Simulate Tesseract image_to_data for a two-column table.
    # Left column (block 1): labels at x~10, values at y = 100,120,140,160,180,200
    # Right column (block 2): values at x~200, same y positions
    label_words = ["Grasimi", "din", "care", "acizi", "Glucide", "Proteine"]
    value_words = ["10,5", "g", "3,2", "g", "45,0", "g", "8,5", "g"]

    block_num = [1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2]
    par_num = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    line_num = [1, 2, 2, 2, 3, 4, 1, 1, 2, 2, 3, 3, 4, 4]
    left = [10, 10, 30, 50, 10, 10, 200, 215, 200, 215, 200, 215, 200, 215]
    top = [100, 120, 120, 120, 140, 180, 100, 100, 120, 120, 140, 140, 180, 180]
    text = label_words + value_words

    data = {
        "text": text,
        "block_num": block_num,
        "par_num": par_num,
        "line_num": line_num,
        "left": left,
        "top": top,
    }

    result = _rows_by_position(data)
    lines = result.splitlines()

    assert lines[0] == "Grasimi 10,5 g"
    assert lines[1] == "din care acizi 3,2 g"
    assert lines[2] == "Glucide 45,0 g"
    assert lines[3] == "Proteine 8,5 g"


def test_parse_romanian_label_integer_values() -> None:
    """Labels without decimal places should still parse correctly."""
    text = """
    Per 100 g
    Energie 350 kcal
    Grasimi totale 14 g
    Glucide totale 48 g
    Proteine 7 g
    """
    r = parse_nutrition_label(text)
    assert r.kcal == 350.0
    assert r.fat_g == 14.0
    assert r.carbs_g == 48.0
    assert r.protein_g == 7.0
    assert r.per_100g is True
