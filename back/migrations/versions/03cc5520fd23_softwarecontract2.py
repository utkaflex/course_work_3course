"""Softwarecontract2

Revision ID: 03cc5520fd23
Revises: a70d273263ef
Create Date: 2025-01-25 18:30:02.361171

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '03cc5520fd23'
down_revision: Union[str, None] = 'a70d273263ef'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("software", recreate="always") as batch_op:
        batch_op.drop_column("contract_id")


def downgrade() -> None:
    with op.batch_alter_table("software", recreate="always") as batch_op:
        batch_op.add_column(sa.Column("contract_id", sa.INTEGER(), nullable=True))
        batch_op.create_foreign_key(
            None,
            "contracts",
            ["contract_id"],
            ["id"],
            ondelete="CASCADE",
        )