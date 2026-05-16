from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
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
    OLLAMA_BASE_URL: str = "http://localhost:11434/api/chat"  # NEW
    VISION_LLM_MODEL: str = "gpt-4o"
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""

    # Stripe
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    # Redirect URLs for Checkout (Stripe replaces {CHECKOUT_SESSION_ID} in success URL).
    STRIPE_CHECKOUT_SUCCESS_URL: str = (
        "https://example.com/fitplus/payment-success?session_id={CHECKOUT_SESSION_ID}"
    )
    STRIPE_CHECKOUT_CANCEL_URL: str = "https://example.com/fitplus/payment-cancel"

    # Gyms synced from Google Places often have no pricing_plans; fallback fills demo plans for tests.
    SUBSCRIPTION_FALLBACK_PRICING: bool = False

    # POST /gyms/{id}/pricing/import-from-url — HTML fetch limits (bytes before decode, chars sent to LLM).
    GYM_PRICING_IMPORT_MAX_BYTES: int = 1_500_000
    GYM_PRICING_IMPORT_MAX_TEXT_CHARS: int = 56_000
    # Per-page plain text cap before merging (keeps memory stable on large SPAs).
    GYM_PRICING_IMPORT_PAGE_TEXT_CHARS: int = 24_000
    GYM_PRICING_IMPORT_MERGE_MAX_CHUNKS: int = 10
    # Same-site crawl (priority queue by path keywords). Depth 0 = seed paths only.
    GYM_PRICING_CRAWL_MAX_PAGES: int = 28
    GYM_PRICING_CRAWL_MAX_DEPTH: int = 2
    GYM_PRICING_CRAWL_MAX_LINKS_PER_PAGE: int = 45
    # Headless Chromium (requires `playwright install chromium` in Docker / dev machines).
    GYM_PRICING_PLAYWRIGHT_ENABLED: bool = True
    GYM_PRICING_PLAYWRIGHT_TIMEOUT_MS: int = 35_000
    GYM_PRICING_PLAYWRIGHT_SETTLE_S: float = 1.5  # seconds to wait after domcontentloaded for JS

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

    @property
    def subscription_pricing_fallback_enabled(self) -> bool:
        """Use placeholder plans when a gym has no pricing_plans JSON."""
        return self.SUBSCRIPTION_FALLBACK_PRICING or self.DEBUG


settings = Settings()
