from datetime import datetime

from pydantic import BaseModel


class SContractBase(BaseModel):
    contract_number: str
    contract_date: datetime


class SContractCreate(SContractBase):
    pass


class SContract(SContractBase):
    id: int

    class Config:
        from_attributes = True
