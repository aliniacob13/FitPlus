"""add nutrition_vision to conversations agent_type check constraint

Revision ID: 0010
Revises: 0009
Create Date: 2026-05-03
"""
from typing import Sequence, Union

from alembic import op

revision: str = "0010"
down_revision: Union[str, None] = "0009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint("ck_conversations_agent_type", "conversations", type_="check")
    op.create_check_constraint(
        "ck_conversations_agent_type",
        "conversations",
        "agent_type IN ('workout', 'diet', 'nutrition_vision')",
    )


def downgrade() -> None:
    op.drop_constraint("ck_conversations_agent_type", "conversations", type_="check")
    op.create_check_constraint(
        "ck_conversations_agent_type",
        "conversations",
        "agent_type IN ('workout', 'diet')",
    )