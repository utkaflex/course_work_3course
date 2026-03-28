from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


class SBackupAutoSet(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    cron: str
    timezone: str = "Asia/Yekaterinburg"
    username: Optional[str] = None
    password: Optional[str] = None
    net_path: Optional[str] = Field(default=None, alias="netPath")
    dir: Optional[str] = None


class SBackupAutoGet(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    cron: str
    timezone: str
    net_path: Optional[str] = Field(default=None, alias="netPath")
    dir: Optional[str] = None