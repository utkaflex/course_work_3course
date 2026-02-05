from pydantic import BaseModel


class SReportType(BaseModel):
    id: int
    report_type_name: str
