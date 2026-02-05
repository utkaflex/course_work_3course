from __future__ import annotations

from sqlalchemy import select

from database import async_session
from Database.crypto import encrypt_str
from Database.models import BackupAutoSettings


async def get_auto_settings() -> BackupAutoSettings | None:
    async with async_session() as session:
        res = await session.execute(
            select(BackupAutoSettings).order_by(BackupAutoSettings.id.desc())
        )
        return res.scalar_one_or_none()


async def upsert_auto_config(
    cron: str,
    timezone: str,
    enabled: bool,
    username: str | None = None,
    password: str | None = None,
    net_path: str | None = None,
    dir: str | None = None,
) -> BackupAutoSettings:
    async with async_session() as session:
        row = await session.get(BackupAutoSettings, 1)
        if row is None:
            row = BackupAutoSettings(
                id=1, cron=cron, timezone=timezone, enabled=enabled
            )

            row.smb_username = encrypt_str(username)
            row.smb_password = encrypt_str(password)
            row.smb_net_path = encrypt_str(net_path)
            row.smb_dir = encrypt_str(dir)

            session.add(row)
        else:
            row.cron = cron
            row.timezone = timezone
            row.enabled = enabled

            if username is not None:
                row.smb_username = encrypt_str(username)
            if password is not None:
                row.smb_password = encrypt_str(password)
            if net_path is not None:
                row.smb_net_path = encrypt_str(net_path)
            if dir is not None:
                row.smb_dir = encrypt_str(dir)

        await session.commit()
        await session.refresh(row)
        return row


async def set_last_backup(dt) -> None:
    async with async_session() as session:
        res = await session.execute(
            select(BackupAutoSettings).order_by(BackupAutoSettings.id.desc())
        )
        row = res.scalar_one_or_none()
        if row is None:
            return
        row.last_backup_at = dt
        await session.commit()
