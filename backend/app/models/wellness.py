from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class PhysicalActivityLog(Base):
    __tablename__ = "physical_activity_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    activity_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    activity_type: Mapped[str] = mapped_column(String(32), nullable=False)
    duration_min: Mapped[int] = mapped_column(Integer, nullable=False)
    distance_km: Mapped[float | None] = mapped_column(Float, nullable=True)
    calories_burned: Mapped[float | None] = mapped_column(Float, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user = relationship("User", backref="physical_activity_logs")


class DailyWaterIntake(Base):
    __tablename__ = "daily_water_intakes"
    __table_args__ = (UniqueConstraint("user_id", "log_date", name="uq_daily_water_user_date"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    log_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    ml_total: Mapped[int] = mapped_column(Integer, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", backref="daily_water_intakes")
