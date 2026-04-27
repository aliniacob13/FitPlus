# Import all models here so Alembic can detect them via Base.metadata.
from app.models.conversation import Conversation  # noqa: F401
from app.models.gym import Gym  # noqa: F401
from app.models.message import Message  # noqa: F401
from app.models.user import User  # noqa: F401
