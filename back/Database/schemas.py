from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SBackupAutoSet(BaseModel):
    cron: str
    timezone: str = "Asia/Yekaterinburg"
    enabled: bool = True

class SBackupAutoGet(SBackupAutoSet):
    last_backup_at: Optional[datetime] = None
    next_backup_at: Optional[datetime] = None