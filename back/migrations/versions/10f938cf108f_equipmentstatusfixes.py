"""EquipmentStatusFixes

Revision ID: 10f938cf108f
Revises: 6c33a1ee9fee
Create Date: 2025-02-02 01:52:46.469534

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "10f938cf108f"
down_revision: Union[str, None] = "6c33a1ee9fee"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("equipment_statuses", recreate="always") as batch_op:
        batch_op.alter_column(
            "doc_number",
            existing_type=sa.INTEGER(),
            nullable=True,
        )
        batch_op.alter_column(
            "responsible_user_id",
            existing_type=sa.INTEGER(),
            nullable=True,
        )
        batch_op.alter_column(
            "building_id",
            existing_type=sa.INTEGER(),
            nullable=True,
        )


def downgrade() -> None:
    with op.batch_alter_table("equipment_statuses", recreate="always") as batch_op:
        batch_op.alter_column(
            "building_id",
            existing_type=sa.INTEGER(),
            nullable=False,
        )
        batch_op.alter_column(
            "responsible_user_id",
            existing_type=sa.INTEGER(),
            nullable=False,
        )
        batch_op.alter_column(
            "doc_number",
            existing_type=sa.INTEGER(),
            nullable=False,
        )
