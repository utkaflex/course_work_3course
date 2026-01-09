from pydantic import BaseModel, ConfigDict
from typing import Optional

class SRoomCreate(BaseModel):
    name: str
    building_id: int
    room_type_id: int

class SRoom(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str

    building_id:int
    room_type_id:int

class SRoomUpdate(BaseModel):
    name: Optional[str] = None
    building_id: Optional[int] = None
    room_type_id: Optional[int] = None