import io
from collections import defaultdict
from datetime import date, datetime

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side

DATE_FMT = "DD-MM-YYYY"


def _as_date(v):
    if v is None:
        return None
    if isinstance(v, datetime):
        return v.date()
    if isinstance(v, date):
        return v
    return None


def _dt(v):
    """Для сортировок: date/datetime -> datetime; None -> datetime.min"""
    if v is None:
        return datetime.min
    if isinstance(v, datetime):
        return v
    if isinstance(v, date):
        return datetime(v.year, v.month, v.day)
    return datetime.min


def build_grouped_report(equipment_items) -> bytes:
    """
    Группировка
    equipment_items: список Equipment с полями:
      - e.model / e.name
      - e.inventory_number
      - e.accepted_date / e.accepted_at
      - e.type.type_name / e.type.name
    """
    wb = Workbook()
    ws = wb.active
    ws.title = "Группировка"

    header_font = Font(bold=True)
    group_font = Font(bold=True)
    base_font = Font(bold=False)

    center = Alignment(horizontal="center", vertical="center", wrap_text=True)
    left = Alignment(horizontal="left", vertical="center", wrap_text=True)

    thin = Side(style="thin")
    border = Border(left=thin, right=thin, top=thin, bottom=thin)

    header_fill = PatternFill("solid", fgColor="D9E1F2")
    group_fill = PatternFill("solid", fgColor="F2F2F2")

    widths = {"A": 40, "B": 22, "C": 18, "D": 25, "E": 16}
    for col, w in widths.items():
        ws.column_dimensions[col].width = w

    headers = [
        "Наименование / модель",
        "Инвентарный номер",
        "Дата принятия к учету",
        "Тип оборудования",
        "Итого за период",
    ]
    ws.append(headers)

    for col in range(1, 6):
        cell = ws.cell(row=1, column=col)
        cell.font = header_font
        cell.alignment = center
        cell.fill = header_fill
        cell.border = border
    ws.row_dimensions[1].height = 22

    rows = []
    for e in equipment_items:
        t = getattr(e, "type", None)
        type_name = getattr(t, "type_name", "") or getattr(t, "name", "") or ""
        model = getattr(e, "model", "") or getattr(e, "name", "") or ""
        inv = getattr(e, "inventory_number", "") or ""
        accepted_raw = getattr(e, "accepted_date", None) or getattr(e, "accepted_at", None)
        accepted = _as_date(accepted_raw)

        rows.append((type_name, model, inv, accepted))

    rows.sort(key=lambda r: (r[0], _dt(r[3]), r[2]))

    grouped = defaultdict(list)
    for type_name, model, inv, accepted in rows:
        grouped[type_name].append((model, inv, accepted, type_name))

    current_row = 2
    for type_name, items in grouped.items():
        ws.append([type_name, "", "", "", len(items)])
        for col in range(1, 6):
            cell = ws.cell(row=current_row, column=col)
            cell.font = group_font
            cell.alignment = left if col == 1 else center
            cell.fill = group_fill
            cell.border = border
        ws.row_dimensions[current_row].height = 18
        current_row += 1

        items.sort(key=lambda x: (_dt(x[2]), x[1]))

        for model, inv, accepted, tname in items:
            ws.append([model, inv, accepted, tname, ""])

            # формат даты в колонке C
            date_cell = ws.cell(row=current_row, column=3)
            date_cell.number_format = DATE_FMT

            for col in range(1, 6):
                cell = ws.cell(row=current_row, column=col)
                cell.font = base_font
                cell.alignment = left if col in (1, 4) else center
                cell.border = border

            ws.row_dimensions[current_row].height = 18
            current_row += 1

    ws.freeze_panes = "A2"
    ws.auto_filter.ref = f"A1:E{max(1, ws.max_row)}"

    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


def build_complex_report_all_categories(
    blocks: list[tuple[str, list[tuple[str, int, int]]]],
) -> bytes:
    """
    blocks: [(category_name, [(type_name, total_all, total_period), ...]),...]
    """
    wb = Workbook()
    ws = wb.active
    ws.title = "Сложносоставной"

    header_font = Font(bold=True)
    bold_font = Font(bold=True)

    center = Alignment(horizontal="center", vertical="center", wrap_text=True)
    left = Alignment(horizontal="left", vertical="center", wrap_text=True)

    thin = Side(style="thin")
    border = Border(left=thin, right=thin, top=thin, bottom=thin)

    header_fill = PatternFill("solid", fgColor="D9E1F2")
    total_fill = PatternFill("solid", fgColor="F2F2F2")

    ws.column_dimensions["A"].width = 45
    ws.column_dimensions["B"].width = 12
    ws.column_dimensions["C"].width = 30

    ws.append(["Наименование", "Всего", "Поступившие за указанный период"])
    for col in range(1, 4):
        c = ws.cell(1, col)
        c.font = header_font
        c.alignment = center
        c.fill = header_fill
        c.border = border
    ws.row_dimensions[1].height = 22

    r = 2
    for category_name, rows in blocks:
        if not rows:
            continue

        total_all = sum(x[1] for x in rows)
        total_period = sum(x[2] for x in rows)

        ws.append([f"{category_name}, всего", total_all, total_period])
        for col in range(1, 4):
            c = ws.cell(r, col)
            c.font = bold_font
            c.alignment = left if col == 1 else center
            c.fill = total_fill
            c.border = border
        r += 1

        for type_name, all_cnt, period_cnt in rows:
            ws.append([f"из них {type_name.lower()}", all_cnt, period_cnt])
            for col in range(1, 4):
                c = ws.cell(r, col)
                c.alignment = left if col == 1 else center
                c.border = border
            r += 1

        ws.append(["", "", ""])
        r += 1

    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()

def build_simple_table_report(equipment_items) -> bytes:
    """
    Таблица (тип 3):
    Тип, Модель, Серийный, Инвентарный, Дата принятия,
    Аудитория (последняя), Адрес (последний), Статус (текущий)
    """
    wb = Workbook()
    ws = wb.active
    ws.title = "Таблица"

    header_font = Font(bold=True)
    center = Alignment(horizontal="center", vertical="center", wrap_text=True)
    left = Alignment(horizontal="left", vertical="center", wrap_text=True)

    thin = Side(style="thin")
    border = Border(left=thin, right=thin, top=thin, bottom=thin)
    header_fill = PatternFill("solid", fgColor="D9E1F2")

    headers = [
        "Тип оборудования",
        "Модель",
        "Серийный номер",
        "Инвентарный номер",
        "Дата принятия к учету",
        "Аудитория (последняя)",
        "Адрес (последний)",
        "Текущий статус",
    ]
    ws.append(headers)

    for col in range(1, len(headers) + 1):
        c = ws.cell(1, col)
        c.font = header_font
        c.alignment = center
        c.fill = header_fill
        c.border = border
    ws.row_dimensions[1].height = 22

    ws.column_dimensions["A"].width = 28
    ws.column_dimensions["B"].width = 24
    ws.column_dimensions["C"].width = 18
    ws.column_dimensions["D"].width = 20
    ws.column_dimensions["E"].width = 18
    ws.column_dimensions["F"].width = 18
    ws.column_dimensions["G"].width = 34
    ws.column_dimensions["H"].width = 22

    def _latest_status(e):
        statuses = list(getattr(e, "statuses", None) or [])
        if not statuses:
            return None
        return sorted(statuses, key=lambda s: s.status_change_date, reverse=True)[0]

    row_idx = 2
    for e in equipment_items:
        t = getattr(e, "type", None)
        type_name = getattr(t, "type_name", "") or getattr(t, "name", "") or ""
        accepted = _as_date(getattr(e, "accepted_date", None))

        latest = _latest_status(e)

        room_name = None
        building_addr = None
        status_name = None

        if latest is not None:
            room = getattr(latest, "room", None)
            if room is not None:
                room_name = getattr(room, "name", None)
                b = getattr(room, "building", None)
                if b is not None:
                    building_addr = getattr(b, "building_address", None)

            st = getattr(latest, "status_type", None)
            if st is not None:
                status_name = getattr(st, "status_type_name", None)

        ws.append(
            [
                type_name,
                getattr(e, "model", None),
                getattr(e, "serial_number", None),
                getattr(e, "inventory_number", None),
                accepted,
                room_name,
                building_addr,
                status_name,
            ]
        )

        # формат даты в колонке E
        date_cell = ws.cell(row=row_idx, column=5)
        date_cell.number_format = DATE_FMT

        for col in range(1, len(headers) + 1):
            c = ws.cell(row_idx, col)
            c.border = border
            c.alignment = left if col in (1, 2, 6, 7, 8) else center

        ws.row_dimensions[row_idx].height = 18
        row_idx += 1

    ws.freeze_panes = "A2"
    ws.auto_filter.ref = f"A1:H{max(1, ws.max_row)}"

    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()