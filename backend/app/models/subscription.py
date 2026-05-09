from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    gym_id: Mapped[int] = mapped_column(Integer, ForeignKey("gyms.id", ondelete="CASCADE"), nullable=False)
    
    plan_type: Mapped[str] = mapped_column(String(100), nullable=False) # e.g., "Monthly", "Annual"
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="pending") # pending, active, canceled
    stripe_subscription_id: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    
    start_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    end_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="subscriptions")
    gym: Mapped["Gym"] = relationship("Gym", back_populates="subscriptions")

    def __repr__(self) -> str:
        return f"<Subscription id={self.id} status={self.status}>"  