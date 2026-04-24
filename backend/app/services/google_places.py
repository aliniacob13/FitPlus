from __future__ import annotations

from math import atan2, cos, radians, sin, sqrt

import httpx

from app.core.config import settings
from app.schemas.places import GeocodeResponse, PlaceGymDetail, PlaceGymSummary

GOOGLE_PLACES_BASE_URL = "https://places.googleapis.com/v1"
GOOGLE_GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"


class GooglePlacesService:
    def __init__(self) -> None:
        self.api_key = settings.GOOGLE_MAPS_API_KEY

    @property
    def is_enabled(self) -> bool:
        return bool(self.api_key)

    async def geocode(self, query: str) -> GeocodeResponse | None:
        if not self.is_enabled:
            return None

        params = {"address": query, "key": self.api_key}
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(GOOGLE_GEOCODE_URL, params=params)
            response.raise_for_status()
            payload = response.json()

        results = payload.get("results", [])
        if not results:
            return None

        first = results[0]
        location = first["geometry"]["location"]
        city = None
        for component in first.get("address_components", []):
            if "locality" in component.get("types", []):
                city = component.get("long_name")
                break

        return GeocodeResponse(
            latitude=location["lat"],
            longitude=location["lng"],
            formatted_address=first.get("formatted_address", query),
            city=city,
        )

    async def search_nearby_gyms(self, latitude: float, longitude: float, radius_m: int = 20_000) -> list[PlaceGymSummary]:
        if not self.is_enabled:
            return []

        headers = {
            "X-Goog-Api-Key": self.api_key,
            "X-Goog-FieldMask": (
                "places.id,places.displayName,places.formattedAddress,places.location,"
                "places.rating,places.userRatingCount,places.googleMapsUri,places.websiteUri,"
                "places.regularOpeningHours.weekdayDescriptions,places.photos.name"
            ),
        }
        payload = {
            "includedTypes": ["gym"],
            "maxResultCount": 20,
            "locationRestriction": {
                "circle": {
                    "center": {"latitude": latitude, "longitude": longitude},
                    "radius": float(radius_m),
                }
            },
        }

        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(
                f"{GOOGLE_PLACES_BASE_URL}/places:searchNearby",
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
            data = response.json()

        places = data.get("places", [])
        results: list[PlaceGymSummary] = []
        for place in places:
            place_lat = place.get("location", {}).get("latitude")
            place_lng = place.get("location", {}).get("longitude")
            if place_lat is None or place_lng is None:
                continue
            photo_name = (place.get("photos") or [{}])[0].get("name")
            photo_url = self._build_photo_url(photo_name) if photo_name else None
            results.append(
                PlaceGymSummary(
                    place_id=place.get("id", ""),
                    name=(place.get("displayName") or {}).get("text", "Gym"),
                    address=place.get("formattedAddress"),
                    latitude=place_lat,
                    longitude=place_lng,
                    rating=place.get("rating"),
                    review_count=place.get("userRatingCount"),
                    website=place.get("websiteUri"),
                    google_maps_url=place.get("googleMapsUri"),
                    photo_url=photo_url,
                    opening_hours=((place.get("regularOpeningHours") or {}).get("weekdayDescriptions")),
                    distance_m=self._distance_m(latitude, longitude, place_lat, place_lng),
                )
            )

        results.sort(key=lambda item: item.distance_m or 10**9)
        return results

    async def get_place_details(self, place_id: str) -> PlaceGymDetail | None:
        if not self.is_enabled:
            return None

        headers = {
            "X-Goog-Api-Key": self.api_key,
            "X-Goog-FieldMask": (
                "id,displayName,formattedAddress,location,nationalPhoneNumber,websiteUri,"
                "googleMapsUri,rating,userRatingCount,regularOpeningHours.weekdayDescriptions,photos.name"
            ),
        }

        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.get(f"{GOOGLE_PLACES_BASE_URL}/places/{place_id}", headers=headers)
            if response.status_code == 404:
                return None
            response.raise_for_status()
            place = response.json()

        place_lat = place.get("location", {}).get("latitude")
        place_lng = place.get("location", {}).get("longitude")
        if place_lat is None or place_lng is None:
            return None

        photo_urls = [
            self._build_photo_url(photo.get("name"))
            for photo in (place.get("photos") or [])
            if photo.get("name")
        ]
        return PlaceGymDetail(
            place_id=place.get("id", place_id),
            name=(place.get("displayName") or {}).get("text", "Gym"),
            address=place.get("formattedAddress"),
            latitude=place_lat,
            longitude=place_lng,
            phone=place.get("nationalPhoneNumber"),
            website=place.get("websiteUri"),
            google_maps_url=place.get("googleMapsUri"),
            rating=place.get("rating"),
            review_count=place.get("userRatingCount"),
            opening_hours=((place.get("regularOpeningHours") or {}).get("weekdayDescriptions")),
            photo_urls=photo_urls,
        )

    def _build_photo_url(self, photo_name: str | None) -> str | None:
        if not photo_name or not self.api_key:
            return None
        return f"{GOOGLE_PLACES_BASE_URL}/{photo_name}/media?maxHeightPx=600&key={self.api_key}"

    @staticmethod
    def _distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        radius = 6_371_000
        d_lat = radians(lat2 - lat1)
        d_lon = radians(lon2 - lon1)
        lat1_r = radians(lat1)
        lat2_r = radians(lat2)
        hav = sin(d_lat / 2) ** 2 + cos(lat1_r) * cos(lat2_r) * sin(d_lon / 2) ** 2
        c = 2 * atan2(sqrt(hav), sqrt(1 - hav))
        return radius * c


google_places_service = GooglePlacesService()
