from pydantic import BaseModel, ConfigDict


class SEquipmentTypeBase(BaseModel):
    type_name: str


class SEquipmentTypeCreate(SEquipmentTypeBase):
    pass


class SEquipmentType(SEquipmentTypeBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
