"""drop building_id and audience_id from equipment_statuses

Revision ID: c59d05b1476e
Revises: c064f93dac5f
Create Date: 2026-02-05 14:38:39.339118

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c59d05b1476e'
down_revision: Union[str, None] = 'c064f93dac5f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("equipment_statuses", recreate="always") as batch_op:
        batch_op.drop_column("audience_id")
        batch_op.drop_column("building_id")


def downgrade() -> None:
    with op.batch_alter_table("equipment_statuses", recreate="always") as batch_op:
        batch_op.add_column(sa.Column("building_id", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("audience_id", sa.Integer(), nullable=True))
        batch_op.create_foreign_key(
            "fk_equipment_statuses_building_id_buildings",
            "buildings",
            ["building_id"],
            ["id"],
        )

    conn = op.get_bind()
    conn.execute(
        sa.text(
            """
            UPDATE equipment_statuses
            SET building_id = (
                SELECT building_id FROM rooms WHERE rooms.id = equipment_statuses.room_id
            ),
            audience_id = CAST((
                SELECT name FROM rooms WHERE rooms.id = equipment_statuses.room_id
            ) AS INTEGER)
            WHERE room_id IS NOT NULL
            """
        )
    )
