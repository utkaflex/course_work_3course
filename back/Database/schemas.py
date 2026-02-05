from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class SBackupAutoSet(BaseModel):
    cron: str
    timezone: str = "Asia/Yekaterinburg"
    enabled: bool = True
    username: Optional[str] = None
    password: Optional[str] = None
    ip: Optional[str] = None
    dir: Optional[str] = None


class SBackupAutoGet(SBackupAutoSet):
    last_backup_at: Optional[datetime] = None
    next_backup_at: Optional[datetime] = None
    password: Optional[str] = None
