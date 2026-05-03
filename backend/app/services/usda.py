from dataclasses import dataclass

import httpx

_BASE = "https://api.nal.usda.gov/fdc/v1"

# Nutrient IDs used by USDA FoodData Central (Foundation + SR Legacy data types).
# These data types report nutrients per 100 g, so no serving-size normalisation needed.
_NUTRIENT_KCAL = 1008
_NUTRIENT_PROTEIN = 1003
_NUTRIENT_CARBS = 1005
_NUTRIENT_FAT = 1004


@dataclass(slots=True)
class Per100g:
    kcal: float
    protein_g: float
    carbs_g: float
    fat_g: float


@dataclass(slots=True)
class FoodSearchResult:
    name: str
    external_id: str
    per_100g: Per100g
    serving_g: float = 100.0


class USDAServiceError(Exception):
    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


def _pick_nutrient(nutrients: list[dict], nutrient_id: int) -> float:
    for n in nutrients:
        if n.get("nutrientId") == nutrient_id:
            try:
                return round(float(n["value"]), 2)
            except (KeyError, TypeError, ValueError):
                return 0.0
    return 0.0


async def search_foods(
    query: str,
    api_key: str,
    page: int = 1,
    page_size: int = 20,
) -> list[FoodSearchResult]:
    """Search USDA FoodData Central (Foundation + SR Legacy foods, per-100g data)."""
    key = api_key or "DEMO_KEY"
    payload = {
        "query": query,
        "dataType": ["Foundation", "SR Legacy"],
        "pageSize": page_size,
        "pageNumber": page,
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"{_BASE}/foods/search",
                params={"api_key": key},
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPStatusError as exc:
        status_code = exc.response.status_code if exc.response is not None else "unknown"
        raise USDAServiceError(f"USDA API request failed with status {status_code}.") from exc
    except httpx.HTTPError as exc:
        raise USDAServiceError("USDA API network error.") from exc
    except ValueError as exc:
        raise USDAServiceError("Invalid USDA API response format.") from exc

    results: list[FoodSearchResult] = []
    for food in data.get("foods", []):
        nutrients = food.get("foodNutrients", [])
        results.append(
            FoodSearchResult(
                name=food.get("description", ""),
                external_id=str(food.get("fdcId", "")),
                per_100g=Per100g(
                    kcal=_pick_nutrient(nutrients, _NUTRIENT_KCAL),
                    protein_g=_pick_nutrient(nutrients, _NUTRIENT_PROTEIN),
                    carbs_g=_pick_nutrient(nutrients, _NUTRIENT_CARBS),
                    fat_g=_pick_nutrient(nutrients, _NUTRIENT_FAT),
                ),
            )
        )
    return results
