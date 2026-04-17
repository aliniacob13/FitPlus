from fastapi import APIRouter

from app.schemas.auth import LoginRequest, RefreshRequest, RegisterRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["Auth"])


def _build_tokens(seed: str) -> TokenResponse:
    normalized = seed.replace("@", "_at_").replace(".", "_dot_")
    return TokenResponse(
        access_token=f"access_{normalized}",
        refresh_token=f"refresh_{normalized}",
    )


@router.post("/register", response_model=TokenResponse)
async def register(payload: RegisterRequest) -> TokenResponse:
    return _build_tokens(payload.email)


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest) -> TokenResponse:
    return _build_tokens(payload.email)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(_payload: RefreshRequest) -> TokenResponse:
    return TokenResponse(access_token="access_refreshed", refresh_token="refresh_refreshed")
