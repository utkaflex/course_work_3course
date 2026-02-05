import sys
from logging.config import fileConfig
from os.path import abspath, dirname
from pathlib import Path

from alembic import context
from sqlalchemy import engine_from_config, pool

from Building.models import Building
from Category.models import Category
from CategoryType.models import CategoryType
from config import settings
from Contract.models import Contract
from database import Base
from Database.models import BackupAutoSettings
from Equipment.models import Equipment
from EquipmentSpecification.models import EquipmentSpecification
from EquipmentStatus.models import EquipmentStatus
from EquipmentStatusType.models import EquipmentStatusType
from EquipmentType.models import EquipmentType
from Job.models import Job
from License.models import License
from Office.models import Office
from ResponsibleUser.models import ResponsibleUser
from ResponsibleUserJob.models import ResponsibleUserJob
from ResponsibleUserOffice.models import ResponsibleUserOffice
from Rooms.models import Rooms
from RoomTypes.models import RoomTypes
from SessionLog.models import SessionLog
from Software.models import Software
from SoftwareContract.models import SoftwareContract
from SystemRole.models import SystemRole
from User.models import User

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

from config import settings

url = config.get_main_option("sqlalchemy.url")
if not url or url.startswith("sqlite+aiosqlite"):
    config.set_main_option("sqlalchemy.url", f"sqlite:///{settings.DB_NAME}")

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
