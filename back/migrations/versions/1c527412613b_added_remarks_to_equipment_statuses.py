"""added remarks to equipment_statuses

Revision ID: 1c527412613b
Revises: d6df8b78ea77
Create Date: 2026-03-28 15:00:04.700385

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1c527412613b'
down_revision: Union[str, None] = 'd6df8b78ea77'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("equipment_statuses", recreate="always") as batch_op:
        batch_op.add_column(sa.Column("remarks", sa.String(), nullable=True))

    op.execute("UPDATE equipment_statuses SET remarks = '' WHERE remarks IS NULL")

    with op.batch_alter_table("equipment_statuses", recreate="always") as batch_op:
        batch_op.alter_column(
            "remarks",
            existing_type=sa.String(),
            nullable=False,
            server_default="",
        )

def downgrade() -> None:
    with op.batch_alter_table("equipment_statuses", recreate="always") as batch_op:
        batch_op.drop_column("remarks")
