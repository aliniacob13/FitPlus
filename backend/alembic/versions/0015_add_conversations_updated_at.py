"""add conversations.updated_at (ORM sync)

Revision ID: 0015
Revises: 0014

Idempotent raw SQL: safe if column already exists (avoids inspect/async edge cases).
"""

from typing import Sequence, Union

from alembic import op

revision: str = "0015"
down_revision: Union[str, None] = "0014"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_ADD_CONVERSATIONS_UPDATED_AT = """
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'conversations'
      AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE conversations
      ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
    UPDATE conversations SET updated_at = created_at;
  END IF;
END $$;
"""


def upgrade() -> None:
    op.execute(_ADD_CONVERSATIONS_UPDATED_AT)


def downgrade() -> None:
    op.execute("ALTER TABLE conversations DROP COLUMN IF EXISTS updated_at")
