from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from database import async_session
from EquipmentStatus.models import EquipmentStatus
from EquipmentStatus.schemas import SEquipmentStatusCreate
from EquipmentStatusType import crud as crud_status_type
from ResponsibleUser import crud as crud_responsible_user
from Equipment import crud as crud_equipment
from Rooms.models import Rooms

def _status_with_room_stmt():
    return (
        select(EquipmentStatus)
        .options(
            selectinload(EquipmentStatus.room).selectinload(Rooms.building),
            selectinload(EquipmentStatus.room).selectinload(Rooms.room_type),
        )
    )

async def get_equipment_status(status_id: int) -> EquipmentStatus | None:
    async with async_session() as session:
        stmt = _status_with_room_stmt().where(EquipmentStatus.id == status_id)
        res = await session.execute(stmt)
        return res.scalar_one_or_none()

async def get_equipment_statuses_by_equipment(equipment_id: int) -> list[EquipmentStatus]:
    async with async_session() as session:
        stmt = _status_with_room_stmt().where(EquipmentStatus.equipment_id == equipment_id)
        res = await session.execute(stmt)
        return list(res.scalars().all())

async def create_equipment_status(status: SEquipmentStatusCreate) -> EquipmentStatus:
    async with async_session() as session:
        if not await crud_status_type.get_equipment_status_type(status.status_type_id):
            raise HTTPException(status_code=404, detail="Status type not found")
        if not await crud_responsible_user.get_responsible_user(status.responsible_user_id):
            raise HTTPException(status_code=404, detail="Responsible user not found")
        if not await crud_equipment.get_equipment(status.equipment_id):
            raise HTTPException(status_code=404, detail="Equipment not found")

        if status.room_id is not None:
            room = await session.get(Rooms, status.room_id)
            if not room:
                raise HTTPException(status_code=404, detail="Room not found")

        db_status = EquipmentStatus(
            equipment_id=status.equipment_id,
            status_type_id=status.status_type_id,
            doc_number=status.doc_number,
            status_change_date=status.status_change_date,
            responsible_user_id=status.responsible_user_id,
            room_id=status.room_id,
        )
        session.add(db_status)
        await session.flush()
        new_id = db_status.id
        await session.commit()

    return await get_equipment_status(new_id)

async def update_equipment_status(status_id: int, updated_status: SEquipmentStatusCreate) -> EquipmentStatus:
    async with async_session() as session:
        db_status = await session.get(EquipmentStatus, status_id)
        if not db_status:
            raise HTTPException(status_code=404, detail="Equipment status not found")

        if not await crud_status_type.get_equipment_status_type(updated_status.status_type_id):
            raise HTTPException(status_code=404, detail="Status type not found")
        if not await crud_responsible_user.get_responsible_user(updated_status.responsible_user_id):
            raise HTTPException(status_code=404, detail="Responsible user not found")
        if not await crud_equipment.get_equipment(updated_status.equipment_id):
            raise HTTPException(status_code=404, detail="Equipment not found")

        if updated_status.room_id is not None:
            room = await session.get(Rooms, updated_status.room_id)
            if not room:
                raise HTTPException(status_code=404, detail="Room not found")

        db_status.equipment_id = updated_status.equipment_id
        db_status.status_type_id = updated_status.status_type_id
        db_status.doc_number = updated_status.doc_number
        db_status.status_change_date = updated_status.status_change_date
        db_status.responsible_user_id = updated_status.responsible_user_id
        db_status.room_id = updated_status.room_id
        await session.commit()

    return await get_equipment_status(status_id)

async def delete_equipment_status(status_id: int) -> dict:
    async with async_session() as session:
        status = await session.get(EquipmentStatus, status_id)
        if not status:
            raise HTTPException(status_code=404, detail="Equipment status not found")
        await session.delete(status)
        await session.commit()
        return {"detail": "Equipment status deleted successfully"}