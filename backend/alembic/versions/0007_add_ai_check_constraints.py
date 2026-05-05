"""add check constraints for ai tables

Revision ID: 0007
Revises: 0006
Create Date: 2026-04-28
"""
from typing import Sequence, Union

from alembic import op

revision: str = "0007"
down_revision: Union[str, None] = "0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_check_constraint(
        "ck_conversations_agent_type",
        "conversations",
        "agent_type IN ('workout', 'diet')",
    )
    op.create_check_constraint(
        "ck_messages_role",
        "messages",
        "role IN ('user', 'assistant')",
    )


def downgrade() -> None:
    op.drop_constraint("ck_messages_role", "messages", type_="check")
    op.drop_constraint("ck_conversations_agent_type", "conversations", type_="check")
