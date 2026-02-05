from datetime import datetime

from pydantic import BaseModel


class SSoftwareContractBase(BaseModel):
    software_id: int
    contract_id: int


class SSoftwareContractCreate(SSoftwareContractBase):
    pass


class SSoftwareContract(SSoftwareContractBase):
    id: int

    class Config:
        from_attributes = True
