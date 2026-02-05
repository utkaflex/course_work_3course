"""added rooms to statuses

Revision ID: baa3ba63396a
Revises: 75992a70d395
Create Date: 2026-01-10 14:39:27.893519

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "baa3ba63396a"
down_revision: Union[str, None] = "75992a70d395"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("equipment_statuses", recreate="always") as batch_op:
        batch_op.add_column(sa.Column("room_id", sa.Integer(), nullable=True))
        batch_op.create_foreign_key(
            "fk_equipment_statuses_room_id_rooms",
            "rooms",
            ["room_id"],
            ["id"],
            ondelete="SET NULL",
        )


def downgrade() -> None:
    with op.batch_alter_table("equipment_statuses", recreate="always") as batch_op:
        batch_op.drop_constraint(
            "fk_equipment_statuses_room_id_rooms", type_="foreignkey"
        )
        batch_op.drop_column("room_id")
