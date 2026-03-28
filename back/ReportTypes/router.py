from fastapi import APIRouter

from ReportTypes.schemas import SReportType

router = APIRouter(prefix="/report_types", tags=["Типы отчётов"])

REPORT_TYPES: list[SReportType] = [
    SReportType(
        id=1, report_type_name="Поступившее оборудование за период (группировка)"
    ),
    SReportType(id=2, report_type_name="Сложносоставной отчёт по компьютерной технике"),
    SReportType(id=3, report_type_name="Полный список оборудования (таблица)"),
]

@router.get("/all", response_model=list[SReportType])
async def get_all_report_types():
    return REPORT_TYPES
