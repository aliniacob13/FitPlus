"""add daily calorie target fields to users

Revision ID: 0012
Revises: 0011
Create Date: 2026-05-03
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

revision: str = "0012"
down_revision: Union[str, None] = "0011"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Safe if columns already exist (e.g. DB migrated before revision chain was reordered)."""
    bind = op.get_bind()
    insp = inspect(bind)
    existing = {c["name"] for c in insp.get_columns("users")}

    if "daily_calorie_target" not in existing:
        op.add_column("users", sa.Column("daily_calorie_target", sa.Float(), nullable=True))
    if "nutrition_target_updated_at" not in existing:
        op.add_column(
            "users",
            sa.Column("nutrition_target_updated_at", sa.DateTime(timezone=True), nullable=True),
        )


def downgrade() -> None:
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS nutrition_target_updated_at")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS daily_calorie_target")
