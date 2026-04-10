from geoalchemy2 import Geometry
from sqlalchemy import Float, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Gym(Base):
    __tablename__ = "gyms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    website: Mapped[str | None] = mapped_column(String(255), nullable=True)
    rating: Mapped[float | None] = mapped_column(Float, nullable=True)

    # SRID 4326 = WGS-84 (GPS coordinates — lat/lon)
    location: Mapped[Geometry] = mapped_column(
        Geometry(geometry_type="POINT", srid=4326),
        nullable=False,
    )

    __table_args__ = (
        # GIST index for fast spatial queries (ST_DWithin, ST_Distance, etc.)
        Index("ix_gyms_location_gist", "location", postgresql_using="gist"),
    )

    def __repr__(self) -> str:
        return f"<Gym id={self.id} name={self.name!r}>"
