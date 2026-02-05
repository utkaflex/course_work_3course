from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload

from database import async_session
from Rooms.models import Rooms
from RoomTypes.models import RoomTypes
from RoomTypes.schemas import SRoomTypeCreate


async def get_room_type_by_name(name: str) -> RoomTypes | None:
    async with async_session() as session:
        query = select(RoomTypes).where(RoomTypes.room_type == name)
        result = await session.execute(query)
        return result.scalar_one_or_none()


async def create_room_type(rtype: SRoomTypeCreate) -> RoomTypes:
    async with async_session() as session:
        db_room_type = RoomTypes(room_type=rtype.room_type)
        session.add(db_room_type)
        await session.commit()
        await session.refresh(db_room_type)
        return db_room_type


async def get_all_room_types() -> list[RoomTypes]:
    async with async_session() as session:
        result = await session.execute(select(RoomTypes))
        return list(result.scalars().all())


async def get_room_type(room_type_id: int) -> RoomTypes | None:
    async with async_session() as session:
        query = select(RoomTypes).where(RoomTypes.id == room_type_id)
        result = await session.execute(query)
        return result.scalar_one_or_none()


async def rename_room_type(room_type_id: int, new_name: str) -> RoomTypes | None:
    async with async_session() as session:
        room_type = await session.get(RoomTypes, room_type_id)
        if not room_type:
            return None

        room_type.room_type = new_name
        try:
            await session.commit()
        except IntegrityError:
            await session.rollback()
            raise
        await session.refresh(room_type)
        return room_type


async def delete_room_type(room_type_id: int) -> bool:
    async with async_session() as session:
        room_type = await session.get(RoomTypes, room_type_id)
        if not room_type:
            return False

        rooms_count = await session.scalar(
            select(func.count())
            .select_from(Rooms)
            .where(Rooms.room_type_id == room_type_id)
        )
        if (rooms_count or 0) > 0:
            return False

        await session.delete(room_type)
        await session.commit()
        return True
