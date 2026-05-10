from contextlib import asynccontextmanager
from pathlib import Path
from tempfile import gettempdir

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import router as v1_router
from app.core.config import settings
from app.core.database import ensure_conversations_updated_at_column


@asynccontextmanager
async def lifespan(app: FastAPI):  # noqa: ARG001 — FastAPI signature
    await ensure_conversations_updated_at_column()
    yield


app = FastAPI(
    title="FitPlus API",
    version="0.1.0",
    debug=settings.DEBUG,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(v1_router, prefix="/api/v1")

# Mount static files for prescription images (mkdir required — e.g. fresh Docker container /tmp is empty)
temp_prescriptions_dir = Path(gettempdir()) / "fitplus_prescriptions"
temp_prescriptions_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(temp_prescriptions_dir)), name="prescriptions")

@app.get("/")
async def root() -> dict[str, str]:
    return {"message": "FitPlus API is running"}
