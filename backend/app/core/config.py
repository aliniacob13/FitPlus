from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Database
    POSTGRES_USER: str = "fitplus"
    POSTGRES_PASSWORD: str = "fitplus_secret"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5433
    POSTGRES_DB: str = "fitplus_db"

    @property
    def DATABASE_URL(self) -> str:
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    # FastAPI
    SECRET_KEY: str = "change_me"
    DEBUG: bool = True
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 10080

    # AI
    LLM_PROVIDER: str = "openai"
    LLM_MODEL: str = "gpt-4o-mini"
    # Vision model used for plate coach (Phase 4). Must support image input.
    # OpenAI: gpt-4o or gpt-4o-mini  |  Anthropic: claude-3-5-sonnet-20241022
    VISION_LLM_MODEL: str = "gpt-4o"
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""

    # Stripe
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""

    # Maps / Places
    GOOGLE_MAPS_API_KEY: str = ""

    # Nutrition / Food search
    # USDA FoodData Central API key — get a free key at https://fdc.nal.usda.gov/api-key-signup
    # Falls back to "DEMO_KEY" (30 req/hr, 50 req/day) when left empty.
    USDA_API_KEY: str = ""

    # Nutrition images (label scan / plate coach). 0 = no app-level size cap (still subject to proxy limits).
    NUTRITION_LABEL_SCAN_MAX_IMAGE_MB: int = 10
    NUTRITION_PLATE_MAX_IMAGE_MB: int = 15
    # Downscale large plate images before sending to the vision LLM (reduces Anthropic request size).
    NUTRITION_PLATE_VISION_MAX_EDGE_PX: int = 1600

    # Dev / seeding (disable in production)
    SEED_ENABLED: bool = False
    SEED_TOKEN: str = ""


settings = Settings()
