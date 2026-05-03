"""create gyms table

Revision ID: 0001
Revises:
Create Date: 2026-04-10
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from geoalchemy2 import Geometry

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Activăm extensia PostGIS (dacă nu există deja în DB).
    # Imaginea postgis/postgis o include built-in, dar CREATE EXTENSION este idempotentă.
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")

    op.create_table(
        "gyms",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("address", sa.String(length=500), nullable=True),
        sa.Column("phone", sa.String(length=50), nullable=True),
        sa.Column("website", sa.String(length=255), nullable=True),
        sa.Column("rating", sa.Float(), nullable=True),
        sa.Column(
            "location",
            Geometry(geometry_type="POINT", srid=4326),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # Index GIST pentru interogări spațiale rapide (ST_DWithin, ST_Distance etc.)
    op.create_index(
        "ix_gyms_location_gist",
        "gyms",
        ["location"],
        postgresql_using="gist",
    )


def downgrade() -> None:
    op.drop_index("ix_gyms_location_gist", table_name="gyms")
    op.drop_table("gyms")
    # Nu eliminăm extensia postgis — poate fi folosită de alte tabele.
