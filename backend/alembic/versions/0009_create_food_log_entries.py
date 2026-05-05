"""create food_log_entries table

Revision ID: 0008
Revises: 0007
Create Date: 2026-05-02
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0009"
down_revision: Union[str, None] = "0008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "food_log_entries",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("grams", sa.Float(), nullable=False),
        sa.Column("kcal", sa.Float(), nullable=False),
        sa.Column("protein_g", sa.Float(), nullable=False),
        sa.Column("carbs_g", sa.Float(), nullable=False),
        sa.Column("fat_g", sa.Float(), nullable=False),
        sa.Column("source", sa.String(length=20), nullable=False, server_default="manual"),
        sa.Column("raw_payload", sa.JSON(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.CheckConstraint(
            "source IN ('manual', 'search', 'barcode', 'plate')",
            name="ck_food_log_entries_source",
        ),
    )
    op.create_index("ix_food_log_entries_user_id", "food_log_entries", ["user_id"], unique=False)
    op.create_index("ix_food_log_entries_date", "food_log_entries", ["date"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_food_log_entries_date", table_name="food_log_entries")
    op.drop_index("ix_food_log_entries_user_id", table_name="food_log_entries")
    op.drop_table("food_log_entries")
