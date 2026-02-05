from pydantic import BaseModel, ConfigDict


class SCategoryTypeCreate(BaseModel):
    category_id: int
    type_id: int


class SCategoryType(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    category_id: int
    type_id: int
