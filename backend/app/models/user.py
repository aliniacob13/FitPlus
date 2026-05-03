from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    name: Mapped[str] = mapped_column(String(120), nullable=False, default="FitPlus User")
    age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    height_cm: Mapped[float | None] = mapped_column(Float, nullable=True)
    fitness_level: Mapped[str | None] = mapped_column(String(50), nullable=True)
    goals: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Last computed daily calorie target (from nutrition calculator). Null = not set.
    daily_calorie_target: Mapped[float | None] = mapped_column(Float, nullable=True)
    nutrition_target_updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
