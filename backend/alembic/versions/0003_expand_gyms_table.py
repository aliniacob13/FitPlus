"""expand gyms table with discovery fields

Revision ID: 0003
Revises: 0002
Create Date: 2026-04-17
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("gyms", sa.Column("description", sa.Text(), nullable=True))
    op.add_column("gyms", sa.Column("image_url", sa.String(length=500), nullable=True))
    op.add_column(
        "gyms",
        sa.Column("opening_hours", postgresql.JSON(astext_type=sa.Text()), nullable=True),
    )
    op.add_column(
        "gyms",
        sa.Column("equipment", postgresql.JSON(astext_type=sa.Text()), nullable=True),
    )
    op.add_column(
        "gyms",
        sa.Column("pricing_plans", postgresql.JSON(astext_type=sa.Text()), nullable=True),
    )
    op.add_column("gyms", sa.Column("review_count", sa.Integer(), nullable=False, server_default="0"))


def downgrade() -> None:
    op.drop_column("gyms", "review_count")
    op.drop_column("gyms", "pricing_plans")
    op.drop_column("gyms", "equipment")
    op.drop_column("gyms", "opening_hours")
    op.drop_column("gyms", "image_url")
    op.drop_column("gyms", "description")
