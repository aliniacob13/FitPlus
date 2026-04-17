from pydantic import BaseModel, EmailStr


class UserProfileResponse(BaseModel):
    id: str
    email: EmailStr
    name: str
    age: int | None = None
    weight_kg: float | None = None
    height_cm: float | None = None
    fitness_level: str | None = None
    goals: str | None = None
