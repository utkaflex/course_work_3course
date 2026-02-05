"""rename smb_ip to smb_net_path

Revision ID: d6df8b78ea77
Revises: c59d05b1476e
Create Date: 2026-02-05 19:02:28.701091

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "d6df8b78ea77"
down_revision: Union[str, None] = "c59d05b1476e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("backup_auto_settings", recreate="always") as batch_op:
        batch_op.alter_column("smb_ip", new_column_name="smb_net_path")


def downgrade() -> None:
    with op.batch_alter_table("backup_auto_settings", recreate="always") as batch_op:
        batch_op.alter_column("smb_net_path", new_column_name="smb_ip")
