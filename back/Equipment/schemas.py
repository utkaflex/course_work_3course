from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from EquipmentSpecification.schemas import SEquipmentSpecification
from EquipmentStatus.schemas import SEquipmentStatus
from Rooms.schemas import SRoom


class SEquipmentBase(BaseModel):
    model: str
    serial_number: str
    inventory_number: str
    network_name: str
    remarks: Optional[str] = None
    type_id: int
    accepted_date: Optional[datetime] = None


class SEquipmentCreate(SEquipmentBase):
    pass


class SEquipment(SEquipmentBase):
    id: int

    class Config:
        from_attributes = True


class SEquipmentWithResponsible(SEquipment):
    responsible_user_full_name: Optional[str] = None
    building_adress: Optional[str] = None
    last_status_type: Optional[str] = None
    last_status_color: Optional[str] = None
    type_name: Optional[str] = None
    statuses: Optional[List[SEquipmentStatus]] = None
    specifications: Optional[List[SEquipmentSpecification]] = None
    responsible_user_office: Optional[str] = None

    class Config:
        from_attributes = True

class SReportFilter(BaseModel):
    name: str
    value: str

class SEquipmentExcelReport(BaseModel):
    report_type_id: int
    ids: List[int] = Field(min_length=1)
    filters: List[SReportFilter] = Field(default_factory=list)
