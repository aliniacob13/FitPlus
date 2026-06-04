from dataclasses import dataclass, field

import httpx

_OFF_URL = "https://world.openfoodfacts.org/api/v0/product/{barcode}.json"
_FIELDS = "product_name,product_name_en,product_name_ro,nutriments,serving_size"
_TIMEOUT = 10.0
# Open Food Facts requires apps to identify themselves via User-Agent to avoid rate limits.
_HEADERS = {"User-Agent": "FitPlus/1.0 (fitness tracking app; contact via GitHub)"}


class BarcodeServiceError(Exception):
    def __init__(self, message: str) -> None:
        self.message = message
        super().__init__(message)


@dataclass
class BarcodeResult:
    found: bool
    barcode: str
    product_name: str | None = field(default=None)
    kcal: float | None = field(default=None)
    fat_g: float | None = field(default=None)
    carbs_g: float | None = field(default=None)
    protein_g: float | None = field(default=None)


async def lookup_barcode(barcode: str) -> BarcodeResult:
    """Query Open Food Facts for a product barcode.

    Returns a BarcodeResult with found=False when the barcode is not in the
    database (not an error — just missing data). Raises BarcodeServiceError on
    network / upstream failures.
    """
    url = _OFF_URL.format(barcode=barcode)
    async with httpx.AsyncClient(timeout=_TIMEOUT, headers=_HEADERS) as client:
        try:
            resp = await client.get(url, params={"fields": _FIELDS})
            resp.raise_for_status()
        except httpx.TimeoutException as exc:
            raise BarcodeServiceError("Open Food Facts request timed out.") from exc
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code == 429:
                raise BarcodeServiceError(
                    "Too many barcode lookups — please wait a moment and try again."
                ) from exc
            raise BarcodeServiceError(
                f"Open Food Facts returned HTTP {exc.response.status_code}."
            ) from exc
        except httpx.RequestError as exc:
            raise BarcodeServiceError(f"Network error reaching Open Food Facts: {exc}") from exc

    body = resp.json()
    if body.get("status") != 1:
        return BarcodeResult(found=False, barcode=barcode)

    product = body.get("product", {})
    nutriments = product.get("nutriments", {})

    name = (
        _nonempty(product.get("product_name_ro"))
        or _nonempty(product.get("product_name_en"))
        or _nonempty(product.get("product_name"))
    )

    return BarcodeResult(
        found=True,
        barcode=barcode,
        product_name=name,
        # Open Food Facts stores both "_100g" and un-suffixed keys; prefer _100g
        kcal=_num(nutriments.get("energy-kcal_100g") or nutriments.get("energy-kcal")),
        fat_g=_num(nutriments.get("fat_100g") or nutriments.get("fat")),
        carbs_g=_num(nutriments.get("carbohydrates_100g") or nutriments.get("carbohydrates")),
        protein_g=_num(nutriments.get("proteins_100g") or nutriments.get("proteins")),
    )


def _nonempty(val: object) -> str | None:
    s = str(val).strip() if val is not None else ""
    return s if s else None


def _num(val: object) -> float | None:
    if val is None:
        return None
    try:
        return float(val)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return None
