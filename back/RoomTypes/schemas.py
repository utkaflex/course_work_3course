from pydantic import BaseModel, ConfigDict
from typing import List
from Rooms.schemas import SRoom

class SRoomTypeCreate(BaseModel):
    room_type: str

class SRoomTypeUpdate(BaseModel):
    room_type: str

class SRoomType(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    room_type: str

class SRoomTypeWithRooms(SRoomType):
    rooms: List[SRoom] = []