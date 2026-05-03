"""add place_id and source to gyms

Revision ID: 0006
Revises: 0005
Create Date: 2026-04-28
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0006"
down_revision: Union[str, None] = "0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("gyms", sa.Column("place_id", sa.String(length=128), nullable=True))
    op.add_column("gyms", sa.Column("source", sa.String(length=20), nullable=False, server_default="seed"))
    op.create_index("ix_gyms_place_id", "gyms", ["place_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_gyms_place_id", table_name="gyms")
    op.drop_column("gyms", "source")
    op.drop_column("gyms", "place_id")
