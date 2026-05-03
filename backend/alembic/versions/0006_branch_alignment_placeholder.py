"""branch alignment placeholder revision

Revision ID: 0006
Revises: 0004
Create Date: 2026-04-28
"""
from typing import Sequence, Union

revision: str = "0006"
down_revision: Union[str, None] = "0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # This revision keeps Alembic history consistent across parallel branches
    # where 0006 was already stamped in shared databases.
    pass


def downgrade() -> None:
    pass
