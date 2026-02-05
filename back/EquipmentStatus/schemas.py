from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from Rooms.schemas import SRoom


class SEquipmentStatusBase(BaseModel):
    equipment_id: int
    status_type_id: int
    doc_number: str
    status_change_date: datetime
    responsible_user_id: int

    room_id: Optional[int] = None


class SEquipmentStatusCreate(SEquipmentStatusBase):
    pass


class SEquipmentStatus(SEquipmentStatusBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    room: Optional[SRoom] = None
