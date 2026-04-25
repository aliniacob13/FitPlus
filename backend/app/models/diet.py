from datetime import datetime
from sqlalchemy import Float, Integer, String, Text, JSON, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class DietPreference(Base):
    __tablename__ = "diet_preferences"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    allergies: Mapped[list | None] = mapped_column(JSON, default=list, nullable=True)
    diet_style: Mapped[str] = mapped_column(String(50), default="omnivore", nullable=False)
    daily_budget: Mapped[float | None] = mapped_column(Float, nullable=True)
    custom_restrictions: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    user = relationship("User", backref="diet_preference")


class Prescription(Base):
    __tablename__ = "prescriptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    
    file_url: Mapped[str] = mapped_column(String(255), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", backref="prescriptions")