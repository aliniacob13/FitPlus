from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class FavoriteGym(Base):
    __tablename__ = "favorite_gyms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    gym_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("gyms.id", ondelete="CASCADE"), nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user: Mapped[User] = relationship("User", back_populates="favorites")
    gym: Mapped[Gym] = relationship("Gym", back_populates="favorited_by")

    __table_args__ = (
        UniqueConstraint("user_id", "gym_id", name="uq_favorite_gyms_user_gym"),
    )
