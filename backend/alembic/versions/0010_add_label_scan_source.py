"""add label_scan to food_log_entries source check constraint

Revision ID: 0009
Revises: 0008
Create Date: 2026-05-03
"""
from typing import Sequence, Union

from alembic import op

revision: str = "0010"
down_revision: Union[str, None] = "0009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint("ck_food_log_entries_source", "food_log_entries", type_="check")
    op.create_check_constraint(
        "ck_food_log_entries_source",
        "food_log_entries",
        "source IN ('manual', 'search', 'barcode', 'plate', 'label_scan')",
    )


def downgrade() -> None:
    op.drop_constraint("ck_food_log_entries_source", "food_log_entries", type_="check")
    op.create_check_constraint(
        "ck_food_log_entries_source",
        "food_log_entries",
        "source IN ('manual', 'search', 'barcode', 'plate')",
    )