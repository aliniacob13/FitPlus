"""create exercise_log table

Revision ID: 0019
Revises: 0018
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0019"
down_revision: Union[str, None] = "0018"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_VALID_TYPES = (
    "'running','walking','cycling','swimming','jump_rope',"
    "'yoga','weight_training','hiit','dancing','hiking','rowing','elliptical'"
)


def upgrade() -> None:
    op.create_table(
        "exercise_logs",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("exercise_type", sa.String(50), nullable=False),
        sa.Column("duration_minutes", sa.Integer(), nullable=False),
        sa.Column("kcal_burned", sa.Float(), nullable=False),
        sa.Column("notes", sa.String(500), nullable=True),
        sa.Column(
            "logged_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.CheckConstraint(f"exercise_type IN ({_VALID_TYPES})", name="ck_exercise_log_type"),
        sa.CheckConstraint("duration_minutes > 0", name="ck_exercise_log_duration"),
        sa.CheckConstraint("kcal_burned >= 0", name="ck_exercise_log_kcal"),
    )
    op.create_index("ix_exercise_logs_user_id", "exercise_logs", ["user_id"])
    op.create_index("ix_exercise_logs_logged_at", "exercise_logs", ["logged_at"])


def downgrade() -> None:
    op.drop_index("ix_exercise_logs_logged_at", table_name="exercise_logs")
    op.drop_index("ix_exercise_logs_user_id", table_name="exercise_logs")
    op.drop_table("exercise_logs")
