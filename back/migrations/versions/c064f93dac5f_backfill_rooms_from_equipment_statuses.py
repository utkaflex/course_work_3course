"""backfill rooms from equipment_statuses

Revision ID: c064f93dac5f
Revises: 4983c4d6b518
Create Date: 2026-02-05 14:36:41.143986

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c064f93dac5f"
down_revision: Union[str, None] = "4983c4d6b518"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    room_type_name = "Аудитория"
    conn.execute(
        sa.text("""
            INSERT INTO room_types (room_type)
            SELECT :name
            WHERE NOT EXISTS (
                SELECT 1 FROM room_types WHERE room_type = :name
            )
            """),
        {"name": room_type_name},
    )

    room_type_id = conn.execute(
        sa.text("SELECT id FROM room_types WHERE room_type = :name"),
        {"name": room_type_name},
    ).scalar()

    if room_type_id is None:
        raise RuntimeError("Failed to ensure default room_type='Аудитория'")
    pairs = conn.execute(sa.text("""
            SELECT DISTINCT building_id, audience_id
            FROM equipment_statuses
            WHERE room_id IS NULL
              AND building_id IS NOT NULL
              AND audience_id IS NOT NULL
            """)).fetchall()
    for building_id, audience_id in pairs:
        room_name = str(audience_id)

        room_id = conn.execute(
            sa.text("""
                SELECT id
                FROM rooms
                WHERE building_id = :bid AND name = :name
                """),
            {"bid": building_id, "name": room_name},
        ).scalar()

        if room_id is None:
            conn.execute(
                sa.text("""
                    INSERT INTO rooms (name, building_id, room_type_id)
                    VALUES (:name, :bid, :rtid)
                    """),
                {"name": room_name, "bid": building_id, "rtid": room_type_id},
            )
            room_id = conn.execute(
                sa.text(
                    "SELECT id FROM rooms WHERE building_id = :bid AND name = :name"
                ),
                {"bid": building_id, "name": room_name},
            ).scalar()

        conn.execute(
            sa.text("""
                UPDATE equipment_statuses
                SET room_id = :rid
                WHERE room_id IS NULL
                  AND building_id = :bid
                  AND audience_id = :aud
                """),
            {"rid": room_id, "bid": building_id, "aud": audience_id},
        )
    remaining = conn.execute(sa.text("""
            SELECT COUNT(1)
            FROM equipment_statuses
            WHERE building_id IS NOT NULL
              AND audience_id IS NOT NULL
              AND room_id IS NULL
            """)).scalar()

    if remaining and int(remaining) > 0:
        raise RuntimeError(
            f"Rooms backfill incomplete: {remaining} equipment_statuses rows still have no room_id"
        )


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("""
            UPDATE equipment_statuses
            SET room_id = NULL
            WHERE building_id IS NOT NULL
              AND audience_id IS NOT NULL
            """))
