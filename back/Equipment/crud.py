from typing import Dict, List

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import joinedload, selectinload

from Category.models import Category
from database import async_session
from Equipment.models import Equipment
from Equipment.schemas import SEquipmentCreate, SEquipmentWithResponsible
from EquipmentStatus.models import EquipmentStatus
from ResponsibleUser.models import ResponsibleUser
from Rooms.models import Rooms


async def get_equipment(equipment_id: int) -> SEquipmentWithResponsible | None:
    async with async_session() as session:
        query = (
            select(Equipment)
            .options(
                joinedload(Equipment.type),
                joinedload(Equipment.statuses).joinedload(EquipmentStatus.status_type),
                joinedload(Equipment.statuses)
                .joinedload(EquipmentStatus.responsible_user)
                .joinedload(ResponsibleUser.office),
                joinedload(Equipment.statuses)
                .joinedload(EquipmentStatus.room)
                .joinedload(Rooms.building),
                joinedload(Equipment.statuses)
                .joinedload(EquipmentStatus.room)
                .joinedload(Rooms.room_type),
                joinedload(Equipment.equipment_specification),
            )
            .filter(Equipment.id == equipment_id)
        )
        result = await session.execute(query)
        equipment = result.unique().scalar_one_or_none()

        if equipment is None:
            return None

        last_status_type = None
        last_status_color = None
        last_building_adress = None
        responsible_user_full_name = None
        responsible_user_office = None

        if equipment.statuses:
            sorted_statuses = sorted(
                equipment.statuses, key=lambda x: x.status_change_date, reverse=True
            )
            latest_status = sorted_statuses[0]
            last_status_type = latest_status.status_type.status_type_name
            last_status_color = latest_status.status_type.status_type_color
            last_building_adress = (
                latest_status.room.building.building_address
                if latest_status.room and latest_status.room.building
                else None
            )

            if latest_status.responsible_user:
                responsible_user_full_name = (
                    f"{latest_status.responsible_user.last_name} "
                    f"{latest_status.responsible_user.first_name} "
                    f"{latest_status.responsible_user.paternity}"
                )
                responsible_user_office = (
                    latest_status.responsible_user.office.office_name
                )

        return SEquipmentWithResponsible(
            id=equipment.id,
            type_id=equipment.type_id,
            model=equipment.model,
            serial_number=equipment.serial_number,
            inventory_number=equipment.inventory_number,
            network_name=equipment.network_name,
            remarks=equipment.remarks,
            accepted_date=equipment.accepted_date,
            last_status_type=last_status_type,
            last_status_color=last_status_color,
            responsible_user_full_name=responsible_user_full_name,
            type_name=equipment.type.type_name,
            building_adress=last_building_adress,
            responsible_user_office=responsible_user_office,
            statuses=equipment.statuses,
            specifications=equipment.equipment_specification,
        )


async def get_equipment_by_serial_number(serial_number: str):
    async with async_session() as session:
        query = select(Equipment).filter(Equipment.serial_number == serial_number)
        result = await session.execute(query)
        return result.scalar_one_or_none()


async def get_equipment_by_inventory_number(inventory_number: str):
    async with async_session() as session:
        query = select(Equipment).filter(Equipment.inventory_number == inventory_number)
        result = await session.execute(query)
        return result.scalar_one_or_none()


async def get_equipment_for_word(equipment_id: int) -> SEquipmentWithResponsible:
    async with async_session() as session:
        query = (
            select(Equipment)
            .options(
                joinedload(Equipment.type),
                joinedload(Equipment.statuses).joinedload(EquipmentStatus.status_type),
                joinedload(Equipment.statuses)
                .joinedload(EquipmentStatus.responsible_user)
                .joinedload(ResponsibleUser.office),
                joinedload(Equipment.statuses)
                .joinedload(EquipmentStatus.room)
                .joinedload(Rooms.building),
                joinedload(Equipment.statuses)
                .joinedload(EquipmentStatus.room)
                .joinedload(Rooms.room_type),
            )
            .filter(Equipment.id == equipment_id)
        )

        result = await session.execute(query)

        equipment = result.unique().scalar_one_or_none()

        last_status_type = "Статус отсутствует"
        last_status_color = "#FFFFFF"
        last_building_adress = "Адрес не указан"
        responsible_user_full_name = "Ответственный не указан"
        responsible_user_office = "Офис не указан"

        if equipment.statuses:
            sorted_statuses = sorted(
                equipment.statuses, key=lambda x: x.status_change_date, reverse=True
            )
            latest_status = sorted_statuses[0]
            last_status_type = latest_status.status_type.status_type_name
            last_status_color = latest_status.status_type.status_type_color
            last_building_adress = (
                latest_status.room.building.building_address
                if latest_status.room and latest_status.room.building
                else "Адрес не указан"
            )
            if latest_status.responsible_user:
                responsible_user_full_name = (
                    f"{latest_status.responsible_user.last_name} "
                    f"{latest_status.responsible_user.first_name} "
                    f"{latest_status.responsible_user.paternity}"
                )
                responsible_user_office = (
                    latest_status.responsible_user.office.office_name
                )

        return SEquipmentWithResponsible(
            id=equipment.id,
            type_id=equipment.type_id,
            model=equipment.model,
            serial_number=equipment.serial_number,
            inventory_number=equipment.inventory_number,
            network_name=equipment.network_name,
            remarks=equipment.remarks,
            accepted_date=equipment.accepted_date,
            last_status_type=last_status_type if last_status_type else None,
            last_status_color=last_status_color if last_status_color else None,
            responsible_user_full_name=(
                responsible_user_full_name if responsible_user_full_name else None
            ),
            type_name=equipment.type.type_name,
            building_adress=last_building_adress if last_building_adress else None,
            responsible_user_office=(
                responsible_user_office if responsible_user_office else None
            ),
        )


async def get_all_equipment(user_role_id: int) -> list[SEquipmentWithResponsible]:
    async with async_session() as session:
        if user_role_id < 2:
            raise HTTPException(status_code=403, detail="Forbidden")
        else:
            query = select(Equipment).options(
                joinedload(Equipment.type),
                joinedload(Equipment.statuses).joinedload(EquipmentStatus.status_type),
                joinedload(Equipment.statuses)
                .joinedload(EquipmentStatus.responsible_user)
                .joinedload(ResponsibleUser.office),
                joinedload(Equipment.statuses)
                .joinedload(EquipmentStatus.room)
                .joinedload(Rooms.building),
                joinedload(Equipment.statuses)
                .joinedload(EquipmentStatus.room)
                .joinedload(Rooms.room_type),
                joinedload(Equipment.equipment_specification),
            )
            result = await session.execute(query)
            equipment_list = result.unique().scalars().all()

            equipment_data = []
            for equipment in equipment_list:
                responsible_user_full_name = None

                if user_role_id > 2:
                    if equipment.statuses:
                        sorted_statuses = sorted(
                            equipment.statuses,
                            key=lambda x: x.status_change_date,
                            reverse=True,
                        )
                        latest_status = sorted_statuses[0]
                        last_status_type = latest_status.status_type.status_type_name
                        last_status_color = latest_status.status_type.status_type_color
                        last_building_adress = (
                            latest_status.room.building.building_address
                            if latest_status.room and latest_status.room.building
                            else None
                        )
                        if latest_status.responsible_user:
                            responsible_user_full_name = (
                                f"{latest_status.responsible_user.last_name} "
                                f"{latest_status.responsible_user.first_name} "
                                f"{latest_status.responsible_user.paternity}"
                            )
                            responsible_user_office = (
                                latest_status.responsible_user.office.office_name
                            )
                    else:
                        latest_status = None
                        last_status_type = None
                        last_status_color = None
                        last_building_adress = None
                        responsible_user_full_name = None
                        responsible_user_office = None
                else:
                    latest_status = None
                    last_status_type = None
                    last_status_color = None
                    last_building_adress = None
                    responsible_user_full_name = None
                    responsible_user_office = None

                equipment_data.append(
                    SEquipmentWithResponsible(
                        id=equipment.id,
                        type_id=equipment.type_id,
                        model=equipment.model,
                        serial_number=equipment.serial_number,
                        inventory_number=equipment.inventory_number,
                        network_name=equipment.network_name,
                        remarks=equipment.remarks,
                        accepted_date=equipment.accepted_date,
                        last_status_type=last_status_type if last_status_type else None,
                        last_status_color=(
                            last_status_color if last_status_color else None
                        ),
                        responsible_user_full_name=(
                            responsible_user_full_name
                            if responsible_user_full_name
                            else None
                        ),
                        type_name=equipment.type.type_name,
                        building_adress=(
                            last_building_adress if last_building_adress else None
                        ),
                        responsible_user_office=(
                            responsible_user_office if responsible_user_office else None
                        ),
                        statuses=equipment.statuses,
                        specifications=equipment.equipment_specification,
                    )
                )

        return equipment_data


async def get_equipment_for_excel(
    user_role_id: int, equipment_list: List[SEquipmentWithResponsible]
):
    async with async_session() as session:
        equipment_data = []
        equipment_ids = [eq.id for eq in equipment_list]

        query = (
            select(Equipment)
            .options(
                joinedload(Equipment.statuses).joinedload(EquipmentStatus.status_type),
                joinedload(Equipment.statuses)
                .joinedload(EquipmentStatus.responsible_user)
                .joinedload(ResponsibleUser.office),
                joinedload(Equipment.statuses)
                .joinedload(EquipmentStatus.room)
                .joinedload(Rooms.building),
                joinedload(Equipment.statuses)
                .joinedload(EquipmentStatus.room)
                .joinedload(Rooms.room_type),
                joinedload(Equipment.equipment_specification),
            )
            .where(Equipment.id.in_(equipment_ids))
        )

        result = await session.execute(query)
        db_equipment_list = result.unique().scalars().all()

        equipment_status_map = {eq.id: eq for eq in db_equipment_list}

        for equipment in equipment_list:
            equipment_info = {
                "ID": equipment.id,
                "Тип оборудования": equipment.type_name,
                "Модель": equipment.model,
                "Серийный номер": equipment.serial_number,
                "Инвентарный номер": equipment.inventory_number,
                "Сетевое имя": equipment.network_name,
                "Дата принятия к учету": (
                    equipment.accepted_date.strftime("%d-%m-%Y")
                    if equipment.accepted_date
                    else None
                ),
                "Примечания": equipment.remarks,
            }
            if user_role_id > 3:
                db_equipment = equipment_status_map.get(equipment.id)
                if db_equipment and db_equipment.statuses:
                    latest_status = sorted(
                        db_equipment.statuses,
                        key=lambda x: x.status_change_date,
                        reverse=True,
                    )[0]
                    equipment_info.update(
                        {
                            "Статус": (
                                latest_status.status_type.status_type_name
                                if latest_status.status_type
                                else None
                            ),
                            "Дата изменения статуса": latest_status.status_change_date,
                            "Подразделение": latest_status.responsible_user.office.office_name,
                            "Ответственный": (
                                f"{latest_status.responsible_user.last_name} {latest_status.responsible_user.first_name} {latest_status.responsible_user.paternity}"
                                if latest_status.responsible_user
                                else None
                            ),
                            "Здание": (
                                latest_status.room.building.building_address
                                if latest_status.room and latest_status.room.building
                                else None
                            ),
                            "Аудитория": (
                                latest_status.room.name if latest_status.room else None
                            ),
                        }
                    )
                else:
                    equipment_info.update(
                        {
                            "Статус": None,
                            "Дата изменения статуса": None,
                            "Ответственный": None,
                            "Здание": None,
                            "Аудитория": None,
                        }
                    )

                if db_equipment and db_equipment.equipment_specification:
                    for spec in db_equipment.equipment_specification:
                        equipment_info.update(
                            {
                                "Разрешение экрана": spec.screen_resolution,
                                "Тип процессора": spec.processor_type,
                                "Объем оперативной памяти": spec.ram_size,
                                "Тип и объем диска": spec.storage,
                                "Графический процессор": spec.gpu_info,
                            }
                        )
                else:
                    equipment_info.update(
                        {
                            "Разрешение экрана": None,
                            "Тип процессора": None,
                            "Объем оперативной памяти": None,
                            "Тип и объем диска": None,
                            "Графический процессор": None,
                        }
                    )

            equipment_data.append(equipment_info)

        return equipment_data


async def create_equipment(equipment: SEquipmentCreate):
    async with async_session() as session:
        db_equipment = Equipment(
            type_id=equipment.type_id,
            model=equipment.model,
            serial_number=equipment.serial_number,
            inventory_number=equipment.inventory_number,
            network_name=equipment.network_name,
            remarks=equipment.remarks,
            accepted_date=equipment.accepted_date,
        )
        session.add(db_equipment)
        await session.commit()
        await session.refresh(db_equipment)
        return db_equipment


async def update_equipment(equipment_id: int, updated_equipment: SEquipmentCreate):
    async with async_session() as session:
        db_equipment = await session.get(Equipment, equipment_id)
        if not db_equipment:
            raise HTTPException(status_code=404, detail="Equipment not found")

        db_equipment.type_id = updated_equipment.type_id
        db_equipment.model = updated_equipment.model
        db_equipment.serial_number = updated_equipment.serial_number
        db_equipment.inventory_number = updated_equipment.inventory_number
        db_equipment.network_name = updated_equipment.network_name
        db_equipment.remarks = updated_equipment.remarks
        db_equipment.accepted_date = updated_equipment.accepted_date

        await session.commit()

    return await get_equipment(equipment_id)


async def delete_equipment(equipment_id: int):
    async with async_session() as session:
        db_equipment = await session.get(Equipment, equipment_id)
        if not db_equipment:
            raise HTTPException(status_code=404, detail="Equipment not found")
        await session.delete(db_equipment)
        await session.commit()
        return {"detail": "Equipment deleted successfully"}


async def get_equipment_for_ready_report(ids: List[int]) -> list[Equipment]:
    async with async_session() as session:
        query = (
            select(Equipment)
            .options(joinedload(Equipment.type))
            .where(Equipment.id.in_(ids))
        )
        result = await session.execute(query)
        return list(result.scalars().all())


async def get_equipment_by_ids(ids: List[int]) -> list[Equipment]:
    async with async_session() as session:
        stmt = select(Equipment).where(Equipment.id.in_(ids))
        res = await session.execute(stmt)
        return list(res.scalars().all())


async def get_all_categories_with_types():
    async with async_session() as session:
        stmt = select(Category).options(selectinload(Category.types))
        res = await session.execute(stmt)
        return list(res.scalars().all())


async def count_equipment_by_type_ids(type_ids: List[int]) -> Dict[int, int]:
    async with async_session() as session:
        stmt = (
            select(Equipment.type_id, func.count(Equipment.id))
            .where(Equipment.type_id.in_(type_ids))
            .group_by(Equipment.type_id)
        )
        res = await session.execute(stmt)
        return {type_id: cnt for type_id, cnt in res.all()}


async def count_equipment_by_type_ids_in_ids(
    type_ids: List[int], equipment_ids: List[int]
) -> Dict[int, int]:
    async with async_session() as session:
        stmt = (
            select(Equipment.type_id, func.count(Equipment.id))
            .where(Equipment.type_id.in_(type_ids))
            .where(Equipment.id.in_(equipment_ids))
            .group_by(Equipment.type_id)
        )
        res = await session.execute(stmt)
        return {type_id: cnt for type_id, cnt in res.all()}

async def get_equipment_for_simple_table(ids: List[int]) -> list[Equipment]:
    async with async_session() as session:
        stmt = (
            select(Equipment)
            .options(
                joinedload(Equipment.type),
                joinedload(Equipment.statuses).joinedload(EquipmentStatus.status_type),
                joinedload(Equipment.statuses)
                .joinedload(EquipmentStatus.room)
                .joinedload(Rooms.building),
            )
            .where(Equipment.id.in_(ids))
        )
        res = await session.execute(stmt)
        return list(res.unique().scalars().all())