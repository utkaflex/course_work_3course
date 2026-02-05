from typing import List

from pydantic import BaseModel, ConfigDict


class SRoomTypeCreate(BaseModel):
    room_type: str


class SRoomTypeUpdate(BaseModel):
    room_type: str


class SRoomType(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    room_type: str
