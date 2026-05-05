"""repair missing ai chat tables

Revision ID: 0008
Revises: fa4037776ef3
Create Date: 2026-05-04
"""

from typing import Sequence, Union

from alembic import op

revision: str = "0008"
down_revision: Union[str, None] = "fa4037776ef3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Idempotent repair migration for environments where alembic_version was
    # advanced but the conversations/messages tables were not created.
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS conversations (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            agent_type VARCHAR(20) NOT NULL,
            title VARCHAR(120) NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        """
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_conversations_user_id ON conversations (user_id);"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_conversations_agent_type ON conversations (agent_type);"
    )
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_constraint
                WHERE conname = 'ck_conversations_agent_type'
            ) THEN
                ALTER TABLE conversations
                ADD CONSTRAINT ck_conversations_agent_type
                CHECK (agent_type IN ('workout', 'diet'));
            END IF;
        END$$;
        """
    )

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS messages (
            id SERIAL PRIMARY KEY,
            conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        """
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_messages_conversation_id ON messages (conversation_id);"
    )
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_constraint
                WHERE conname = 'ck_messages_role'
            ) THEN
                ALTER TABLE messages
                ADD CONSTRAINT ck_messages_role
                CHECK (role IN ('user', 'assistant'));
            END IF;
        END$$;
        """
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS messages;")
    op.execute("DROP TABLE IF EXISTS conversations;")
