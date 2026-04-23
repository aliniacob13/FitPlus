import asyncio
import sys
from pathlib import Path


def _bootstrap_import_path() -> None:
    backend_root = Path(__file__).resolve().parents[1]
    sys.path.insert(0, str(backend_root))


async def _main() -> None:
    _bootstrap_import_path()

    from app.core.database import AsyncSessionLocal
    from app.services.gym_seed import seed_bucharest_gyms

    async with AsyncSessionLocal() as session:
        inserted = await seed_bucharest_gyms(session)
        print(f"Seeded gyms: {inserted}")


if __name__ == "__main__":
    asyncio.run(_main())
