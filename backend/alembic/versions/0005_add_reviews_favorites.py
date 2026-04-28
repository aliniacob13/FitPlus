"""add gym_reviews and favorite_gyms tables

Revision ID: 0005
Revises: 0004
Create Date: 2026-04-27
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0005"
down_revision: Union[str, None] = "0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "gym_reviews",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("gym_id", sa.Integer(), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("rating >= 1 AND rating <= 5", name="ck_gym_reviews_rating"),
        sa.ForeignKeyConstraint(["gym_id"], ["gyms.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "gym_id", name="uq_gym_reviews_user_gym"),
    )
    op.create_index("ix_gym_reviews_gym_id", "gym_reviews", ["gym_id"])
    op.create_index("ix_gym_reviews_user_id", "gym_reviews", ["user_id"])

    op.create_table(
        "favorite_gyms",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("gym_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["gym_id"], ["gyms.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "gym_id", name="uq_favorite_gyms_user_gym"),
    )
    op.create_index("ix_favorite_gyms_gym_id", "favorite_gyms", ["gym_id"])
    op.create_index("ix_favorite_gyms_user_id", "favorite_gyms", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_favorite_gyms_user_id", table_name="favorite_gyms")
    op.drop_index("ix_favorite_gyms_gym_id", table_name="favorite_gyms")
    op.drop_table("favorite_gyms")

    op.drop_index("ix_gym_reviews_user_id", table_name="gym_reviews")
    op.drop_index("ix_gym_reviews_gym_id", table_name="gym_reviews")
    op.drop_table("gym_reviews")
