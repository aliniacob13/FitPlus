"""add physical activity logs and daily water intake

Revision ID: 0014
Revises: 0013
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0014"
down_revision: Union[str, None] = "0013"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "physical_activity_logs",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("activity_date", sa.Date(), nullable=False),
        sa.Column("activity_type", sa.String(length=32), nullable=False),
        sa.Column("duration_min", sa.Integer(), nullable=False),
        sa.Column("distance_km", sa.Float(), nullable=True),
        sa.Column("calories_burned", sa.Float(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_physical_activity_logs_user_id",
        "physical_activity_logs",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        "ix_physical_activity_logs_activity_date",
        "physical_activity_logs",
        ["activity_date"],
        unique=False,
    )

    op.create_table(
        "daily_water_intakes",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("log_date", sa.Date(), nullable=False),
        sa.Column("ml_total", sa.Integer(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "log_date", name="uq_daily_water_user_date"),
    )
    op.create_index(
        "ix_daily_water_intakes_user_id",
        "daily_water_intakes",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        "ix_daily_water_intakes_log_date",
        "daily_water_intakes",
        ["log_date"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_daily_water_intakes_log_date", table_name="daily_water_intakes")
    op.drop_index("ix_daily_water_intakes_user_id", table_name="daily_water_intakes")
    op.drop_table("daily_water_intakes")
    op.drop_index("ix_physical_activity_logs_activity_date", table_name="physical_activity_logs")
    op.drop_index("ix_physical_activity_logs_user_id", table_name="physical_activity_logs")
    op.drop_table("physical_activity_logs")
