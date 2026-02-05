import zoneinfo as zi
from datetime import datetime, timedelta, timezone

from pydantic import BaseModel


class SSessionLogBase(BaseModel):
    event_type: str
    user_agent: str
    time: datetime = datetime.now(tz=timezone(timedelta(hours=5)))


class SSessionLogCreate(SSessionLogBase):
    pass


class SSessionLog(SSessionLogBase):
    id: int
    user_id: int
    user_role: int

    class Config:
        from_attributes = True


class SSessionLogAll(SSessionLog):
    username: str
    role_name: str

    class Config:
        from_attributes = True
