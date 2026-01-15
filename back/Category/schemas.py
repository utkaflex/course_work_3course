from pydantic import BaseModel, ConfigDict
from EquipmentType.schemas import SEquipmentType
from typing import List, Optional

class SCategory(BaseModel):

    model_config = ConfigDict(from_attributes=True)

    id: int
    category_name: str

class SCategoryCreate(BaseModel):
    category_name: str

class SCategoryWithTypes(SCategory):
    types: list[SEquipmentType] = []

class SCategoryUpdate(BaseModel):
    category_name: str

class SCategoryCreateWithTypes(BaseModel):
    category_name: str
    type_ids: List[int] = []

class SCategoryUpdateWithTypes(BaseModel):
    category_name: str
    type_ids: Optional[List[int]] = None