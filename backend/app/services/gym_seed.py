from geoalchemy2.elements import WKTElement
from sqlalchemy import delete

from app.data.bucharest_gyms_seed import BUCHAREST_GYMS_SEED
from app.models.gym import Gym


async def seed_bucharest_gyms(db) -> int:
    await db.execute(delete(Gym))

    inserted = 0
    for row in BUCHAREST_GYMS_SEED:
        latitude = float(row["latitude"])
        longitude = float(row["longitude"])
        location = WKTElement(f"POINT ({longitude} {latitude})", srid=4326)

        gym = Gym(
            name=row["name"],
            address=row.get("address"),
            phone=row.get("phone"),
            website=row.get("website"),
            rating=row.get("rating"),
            description=row.get("description"),
            image_url=row.get("image_url"),
            opening_hours=row.get("opening_hours"),
            equipment=row.get("equipment"),
            pricing_plans=row.get("pricing_plans"),
            review_count=int(row.get("review_count") or 0),
            location=location,
        )
        db.add(gym)
        inserted += 1

    await db.commit()
    return inserted
