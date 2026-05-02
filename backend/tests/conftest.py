"""
Shared pytest fixtures for integration tests.

Isolation strategy: each test runs inside a database transaction that is
rolled back at the end, so the real DB is never permanently modified.
`join_transaction_mode="create_savepoint"` lets the app code call
session.commit() (which releases a savepoint) without issuing a real COMMIT,
so the outer ROLLBACK at teardown undoes everything.
"""
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token, hash_password
from app.main import app
from app.models.gym import Gym
from app.models.user import User
from geoalchemy2.elements import WKTElement

_engine = create_async_engine(settings.DATABASE_URL, echo=False)


@pytest_asyncio.fixture
async def db():
    """Async session wrapped in a transaction that is always rolled back."""
    async with _engine.connect() as conn:
        await conn.begin()
        session = AsyncSession(
            bind=conn,
            expire_on_commit=False,
            join_transaction_mode="create_savepoint",
        )
        try:
            yield session
        finally:
            await session.close()
            await conn.rollback()


@pytest_asyncio.fixture
async def client(db: AsyncSession):
    """ASGI test client with the DB dependency overridden to the test session."""
    async def _override_get_db():
        yield db

    app.dependency_overrides[get_db] = _override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def test_user(db: AsyncSession) -> User:
    user = User(
        email="test_reviews_favorites@fitplus.test",
        password_hash=hash_password("TestPass123!"),
        name="Test User",
    )
    db.add(user)
    await db.flush()
    return user


@pytest_asyncio.fixture
def auth_headers(test_user: User) -> dict:
    token = create_access_token(str(test_user.id))
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def test_gym(db: AsyncSession) -> Gym:
    gym = Gym(
        name="Test Gym Bucharest",
        address="Str. Exemplu 1, Bucharest",
        location=WKTElement("POINT(26.1025 44.4268)", srid=4326),
    )
    db.add(gym)
    await db.flush()
    return gym


@pytest_asyncio.fixture
async def second_user(db: AsyncSession) -> User:
    """A second authenticated user for multi-user scenarios."""
    user = User(
        email="test_second_user@fitplus.test",
        password_hash=hash_password("TestPass123!"),
        name="Second User",
    )
    db.add(user)
    await db.flush()
    return user


@pytest_asyncio.fixture
def second_auth_headers(second_user: User) -> dict:
    token = create_access_token(str(second_user.id))
    return {"Authorization": f"Bearer {token}"}
