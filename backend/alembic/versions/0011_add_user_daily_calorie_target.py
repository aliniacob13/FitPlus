"""add daily calorie target fields to users

Revision ID: 0011
Revises: 0010
Create Date: 2026-05-03
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0011"
down_revision: Union[str, None] = "0010"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("daily_calorie_target", sa.Float(), nullable=True))
    op.add_column(
        "users",
        sa.Column("nutrition_target_updated_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "nutrition_target_updated_at")
    op.drop_column("users", "daily_calorie_target")
