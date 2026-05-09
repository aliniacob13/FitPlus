from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from tempfile import gettempdir
from pathlib import Path

from app.api.v1.router import router as v1_router
from app.core.config import settings
from app.api.payments import router as payments_router

app = FastAPI(
    title="FitPlus API",
    version="0.1.0",
    debug=settings.DEBUG,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(v1_router, prefix="/api/v1")

app.include_router(payments_router)

# Mount static files for prescription images (mkdir required — e.g. fresh Docker container /tmp is empty)
temp_prescriptions_dir = Path(gettempdir()) / "fitplus_prescriptions"
temp_prescriptions_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(temp_prescriptions_dir)), name="prescriptions")

@app.get("/")
async def root() -> dict[str, str]:
    return {"message": "FitPlus API is running"}
