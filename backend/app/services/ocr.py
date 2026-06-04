import io
import re
from dataclasses import dataclass


@dataclass
class LabelParseResult:
    kcal: float | None
    fat_g: float | None
    carbs_g: float | None
    protein_g: float | None
    serving_size_g: float | None
    per_100g: bool
    confidence: float  # 0.0 – 1.0


def extract_text(image_bytes: bytes) -> str:
    """Run Tesseract OCR and return text with rows sorted by visual Y position.

    Romanian nutrition declarations use a two-column table layout. Without
    positional reconstruction, Tesseract reads all left-column labels first
    ("Grăsimi", "Glucide", "Proteine", …) then all right-column values
    ("10,5 g", "45 g", "8 g", …), making keyword→value regex matching
    impossible. By sorting Tesseract's word bounding boxes by their top-Y
    coordinate we get "Grăsimi 10,5 g" on one line as expected.
    """
    try:
        import pytesseract  # type: ignore[import-untyped]
        from PIL import Image  # type: ignore[import-untyped]
    except ImportError as exc:
        raise RuntimeError(
            "pytesseract and Pillow are required for OCR. "
            "Install them and ensure Tesseract is on PATH."
        ) from exc

    img = Image.open(io.BytesIO(image_bytes))
    w, h = img.size
    if max(w, h) < 1000:
        scale = 1000 / max(w, h)
        img = img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)

    # PSM 6: treat the image as a single uniform text block — better for labels.
    data = pytesseract.image_to_data(  # type: ignore[no-any-return]
        img,
        lang="eng",
        config="--psm 6",
        output_type=pytesseract.Output.DICT,
    )
    return _rows_by_position(data)


def _rows_by_position(data: dict) -> str:
    """Reconstruct OCR text by sorting and merging Tesseract groups by visual top-Y.

    Tesseract assigns words to (block, paragraph, line) groups. In a two-column
    layout — typical of Romanian nutrition declarations — each column becomes a
    separate block, so "Grăsimi" (block 1) and "10,5 g" (block 2) end up in
    different groups even though they are on the same visual row.

    This function sorts all groups by their top-Y coordinate, then merges groups
    whose top-Y values are within Y_TOLERANCE pixels into a single output line.
    Words within the merged line are sorted left-to-right by their X position,
    giving e.g. "Grasimi 10,5 g" instead of two separate lines.
    """
    # 15 px tolerance: handles slight vertical misalignment between label and
    # value columns while still separating adjacent rows (typically 20-30 px apart).
    _Y_TOLERANCE = 15

    lines: dict[tuple[int, int, int], list[tuple[int, str]]] = {}
    line_tops: dict[tuple[int, int, int], int] = {}

    for i in range(len(data["text"])):
        word = data["text"][i].strip()
        if not word:
            continue
        key = (data["block_num"][i], data["par_num"][i], data["line_num"][i])
        lines.setdefault(key, []).append((data["left"][i], word))
        line_tops[key] = min(line_tops.get(key, 99999), data["top"][i])

    sorted_keys = sorted(lines, key=lambda k: line_tops[k])

    # Merge groups at the same visual row (within tolerance) into one output line.
    merged: list[list[tuple[int, str]]] = []
    row_top: int | None = None

    for key in sorted_keys:
        top = line_tops[key]
        if row_top is None or abs(top - row_top) > _Y_TOLERANCE:
            merged.append(list(lines[key]))
            row_top = top
        else:
            merged[-1].extend(lines[key])

    return "\n".join(" ".join(w for _, w in sorted(row, key=lambda x: x[0])) for row in merged)


def parse_nutrition_label(text: str) -> LabelParseResult:
    """Parse OCR text into structured macronutrient values.

    Tries keyword-based regex first. If confidence is low (< 0.5), also tries
    a sequential column-format fallback that matches values by their fixed order
    in the Romanian standard nutrition declaration table.
    """
    t = _normalize_decimals(text.lower())

    kcal = _parse_kcal(t)
    fat_g = _parse_fat(t)
    carbs_g = _parse_carbs(t)
    protein_g = _parse_protein(t)
    serving_size_g = _parse_serving(t)
    per_100g = bool(re.search(r"per\s*100\s*g|/\s*100\s*g|100\s*g\b|la\s*100\s*g", t))

    found = sum(1 for v in [kcal, fat_g, carbs_g, protein_g] if v is not None)

    # If fewer than 2 macros were found, try the column-format sequential fallback.
    if found < 2:
        col = _try_column_fallback(t)
        kcal = kcal or col.get("kcal")
        fat_g = fat_g or col.get("fat_g")
        carbs_g = carbs_g or col.get("carbs_g")
        protein_g = protein_g or col.get("protein_g")
        found = sum(1 for v in [kcal, fat_g, carbs_g, protein_g] if v is not None)

    return LabelParseResult(
        kcal=kcal,
        fat_g=fat_g,
        carbs_g=carbs_g,
        protein_g=protein_g,
        serving_size_g=serving_size_g,
        per_100g=per_100g,
        confidence=round(found / 4.0, 2),
    )


# ── Field parsers ─────────────────────────────────────────────────────────────


def _parse_kcal(t: str) -> float | None:
    return _first(
        t,
        [
            # "calories: 250" / "energy: 200" — keyword BEFORE the number with separator.
            # NOTE: "kcal" is intentionally excluded here because "294 kcal\n10.5 g"
            # would cause pattern r"kcal\s*[:\s]+(\d+)" to capture the NEXT line's
            # value (fat grams) as calories.
            r"(?:calories?|energy)\s*[:\s]+(\d+(?:\.\d+)?)",
            # "294 kcal" / "250kcal" — number BEFORE the unit (most Romanian labels).
            r"(\d+(?:\.\d+)?)\s*kcal",
            r"(\d+(?:\.\d+)?)\s*cal\b",
            # "valoare energetica 1234 kJ / 294 kcal" — grab the kcal value on the same line.
            r"(?:valoare\s+energetic[aă]|energie)\s[^\n]*?(\d+(?:\.\d+)?)\s*kcal",
        ],
    )


def _parse_fat(t: str) -> float | None:
    return _first(
        t,
        [
            r"(?:total\s+)?fat\s*[:\s]+(\d+(?:\.\d+)?)\s*g",
            r"lipid(?:es?)?\s*[:\s]+(\d+(?:\.\d+)?)",
            r"(?:total\s+)?fat\s+(\d+(?:\.\d+)?)\s*g",
            # Romanian: "grasimi" / "grasimi totale" — does NOT match "din care acizi grasi"
            r"gr[aă]simi(?:\s+totale)?\s+(\d+(?:\.\d+)?)\s*g",
            r"gr[aă]simi(?:\s+totale)?\s*[:\s]+(\d+(?:\.\d+)?)",
        ],
    )


def _parse_carbs(t: str) -> float | None:
    return _first(
        t,
        [
            r"(?:total\s+)?carbohydrate(?:s)?\s*[:\s]+(\d+(?:\.\d+)?)\s*g",
            r"carbs?\s*[:\s]+(\d+(?:\.\d+)?)\s*g",
            r"glucid(?:es?)?\s*[:\s]+(\d+(?:\.\d+)?)",
            r"(?:total\s+)?carbohydrate(?:s)?\s+(\d+(?:\.\d+)?)\s*g",
            # Romanian: "glucide" / "glucide totale"
            r"glucide(?:\s+totale)?\s+(\d+(?:\.\d+)?)\s*g",
            r"glucide(?:\s+totale)?\s*[:\s]+(\d+(?:\.\d+)?)",
        ],
    )


def _parse_protein(t: str) -> float | None:
    return _first(
        t,
        [
            r"protein(?:e|s)?\s*[:\s]+(\d+(?:\.\d+)?)\s*g?",
            r"protein(?:e|s)?\s+(\d+(?:\.\d+)?)",
        ],
    )


def _parse_serving(t: str) -> float | None:
    return _first(
        t,
        [
            r"serving\s+size\s*[:\s]+(\d+(?:\.\d+)?)\s*g",
            r"portion\s*[:\s]+(\d+(?:\.\d+)?)\s*g",
            r"per\s+serving\s*[:\s]+(\d+(?:\.\d+)?)\s*g",
            r"por[tț]ie\s*[:\s]+(\d+(?:\.\d+)?)\s*g",
            r"m[aă]rime\s+por[tț]ie\s*[:\s]+(\d+(?:\.\d+)?)\s*g",
        ],
    )


# ── Column-format fallback ────────────────────────────────────────────────────

# Standard Romanian declaration row order after the energy line:
#   fat, saturated-fat (*sub*), carbs, sugars (*sub*), fibre (*sub*), protein, salt
# Indices of MAIN rows (skipping sub-rows): fat=0, carbs=2, protein=4 or 5
_COLUMN_MAIN_INDICES = {"fat_g": 0, "carbs_g": 2, "protein_g": 4}

# A value line in the column-format section: standalone number with optional unit.
_VALUE_LINE_RE = re.compile(r"^\s*(\d+(?:\.\d+)?)\s*(?:g|kcal|kj)?\s*$")


def _try_column_fallback(t: str) -> dict[str, float | None]:
    """Sequential fallback for pure column-format OCR output.

    When positional row reconstruction fails (label and value in separate blocks
    with Y mismatch > tolerance), all labels appear first and all values appear
    below. In this layout every value line is a standalone number followed by
    an optional unit. The Romanian standard order is fixed, so we can assign
    values by their position in the sequence that follows the energy line.
    """
    lines = t.splitlines()

    # Find the line that contains the kcal value — this anchors the value section.
    energy_idx: int | None = None
    kcal: float | None = None
    for i, line in enumerate(lines):
        m = re.search(r"(\d+(?:\.\d+)?)\s*kcal", line)
        if m:
            energy_idx = i
            kcal = float(m.group(1))
            break

    if energy_idx is None:
        return {}

    # Collect standalone value lines that follow the energy line.
    values: list[float] = []
    for line in lines[energy_idx + 1 :]:
        m = _VALUE_LINE_RE.match(line)
        if m:
            values.append(float(m.group(1)))

    result: dict[str, float | None] = {"kcal": kcal}
    for field, idx in _COLUMN_MAIN_INDICES.items():
        if idx < len(values):
            result[field] = values[idx]

    return result


# ── Helpers ───────────────────────────────────────────────────────────────────


def _normalize_decimals(text: str) -> str:
    """Replace comma-as-decimal-separator with dot — e.g. '10,5' → '10.5'."""
    return re.sub(r"(\d),(\d)", r"\1.\2", text)


def _first(text: str, patterns: list[str]) -> float | None:
    for pat in patterns:
        m = re.search(pat, text)
        if m:
            try:
                return float(m.group(1))
            except (ValueError, IndexError):
                continue
    return None
