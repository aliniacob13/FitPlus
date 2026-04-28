# Import all models here so Alembic can detect them via Base.metadata.
from app.models.favorite import FavoriteGym  # noqa: F401
from app.models.gym import Gym  # noqa: F401
from app.models.review import GymReview  # noqa: F401
from app.models.user import User  # noqa: F401
