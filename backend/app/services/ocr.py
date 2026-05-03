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
    """Run Tesseract OCR on raw image bytes and return text."""
    try:
        import pytesseract  # type: ignore[import-untyped]
        from PIL import Image  # type: ignore[import-untyped]
    except ImportError as exc:
        raise RuntimeError(
            "pytesseract and Pillow are required for OCR. "
            "Install them and ensure Tesseract is on PATH."
        ) from exc

    img = Image.open(io.BytesIO(image_bytes))
    # Upscale small images — Tesseract accuracy improves above 300 DPI equivalent
    w, h = img.size
    if max(w, h) < 1000:
        scale = 1000 / max(w, h)
        img = img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)

    return pytesseract.image_to_string(img, lang="eng")  # type: ignore[no-any-return]


def parse_nutrition_label(text: str) -> LabelParseResult:
    """Parse OCR text into structured macronutrient values using regex heuristics."""
    t = text.lower()

    kcal = _first(t, [
        r"(?:calories?|energy|kcal)\s*[:\s]+(\d+(?:\.\d+)?)",
        r"(\d+(?:\.\d+)?)\s*kcal",
        r"(\d+(?:\.\d+)?)\s*cal\b",
    ])
    fat_g = _first(t, [
        r"(?:total\s+)?fat\s*[:\s]+(\d+(?:\.\d+)?)\s*g",
        r"lipid(?:es?)?\s*[:\s]+(\d+(?:\.\d+)?)",
        r"(?:total\s+)?fat\s+(\d+(?:\.\d+)?)\s*g",
    ])
    carbs_g = _first(t, [
        r"(?:total\s+)?carbohydrate(?:s)?\s*[:\s]+(\d+(?:\.\d+)?)\s*g",
        r"carbs?\s*[:\s]+(\d+(?:\.\d+)?)\s*g",
        r"glucid(?:es?)?\s*[:\s]+(\d+(?:\.\d+)?)",
        r"(?:total\s+)?carbohydrate(?:s)?\s+(\d+(?:\.\d+)?)\s*g",
    ])
    protein_g = _first(t, [
        r"protein(?:e|s)?\s*[:\s]+(\d+(?:\.\d+)?)\s*g?",
        r"protein(?:e|s)?\s+(\d+(?:\.\d+)?)",
    ])
    serving_size_g = _first(t, [
        r"serving\s+size\s*[:\s]+(\d+(?:\.\d+)?)\s*g",
        r"portion\s*[:\s]+(\d+(?:\.\d+)?)\s*g",
        r"per\s+serving\s*[:\s]+(\d+(?:\.\d+)?)\s*g",
    ])

    per_100g = bool(re.search(r"per\s*100\s*g|/\s*100\s*g|100\s*g\b", t))

    found = sum(1 for v in [kcal, fat_g, carbs_g, protein_g] if v is not None)
    confidence = round(found / 4.0, 2)

    return LabelParseResult(
        kcal=kcal,
        fat_g=fat_g,
        carbs_g=carbs_g,
        protein_g=protein_g,
        serving_size_g=serving_size_g,
        per_100g=per_100g,
        confidence=confidence,
    )


def _first(text: str, patterns: list[str]) -> float | None:
    for pat in patterns:
        m = re.search(pat, text)
        if m:
            try:
                return float(m.group(1))
            except (ValueError, IndexError):
                continue
    return None