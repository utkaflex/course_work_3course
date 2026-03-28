"""drop enabled from backup

Revision ID: 413bcafa9acc
Revises: 1c527412613b
Create Date: 2026-03-28 16:48:22.033621

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '413bcafa9acc'
down_revision: Union[str, None] = '1c527412613b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # SQLite-safe drop column
    with op.batch_alter_table("backup_auto_settings", recreate="always") as batch_op:
        batch_op.drop_column("enabled")


def downgrade() -> None:
    # SQLite-safe add column back
    with op.batch_alter_table("backup_auto_settings", recreate="always") as batch_op:
        batch_op.add_column(
            sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.text("0"))
        )
