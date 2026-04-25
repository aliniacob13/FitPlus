from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# ==========================================
# SCHEME PENTRU PREFERINȚELE DE DIETĂ
# ==========================================

class DietPreferenceBase(BaseModel):
    allergies: Optional[List[str]] = Field(default_factory=list, description="Lista de alergii, ex: ['gluten', 'lactoză']")
    diet_style: str = Field(default="omnivore", description="Stilul dietei: omnivore, vegetarian, vegan, pescatarian")
    daily_budget: Optional[float] = Field(default=None, description="Bugetul zilnic în RON")
    custom_restrictions: Optional[str] = Field(default=None, description="Alte restricții scrise de utilizator")

# Schema folosită când utilizatorul își creează sau actualizează preferințele
class DietPreferenceCreateUpdate(DietPreferenceBase):
    pass

# Schema folosită când trimitem datele înapoi către telefon (include ID-urile din baza de date)
class DietPreferenceResponse(DietPreferenceBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

# ==========================================
# SCHEME PENTRU REȚETE MEDICALE (PRESCRIPTIONS)
# ==========================================

class PrescriptionBase(BaseModel):
    notes: Optional[str] = Field(default=None, description="Notițe opționale extrase sau adăugate manual")

class PrescriptionCreate(PrescriptionBase):
    file_url: str
    original_filename: str

class PrescriptionResponse(PrescriptionBase):
    id: int
    user_id: int
    file_url: str
    original_filename: str
    uploaded_at: datetime

    class Config:
        from_attributes = True