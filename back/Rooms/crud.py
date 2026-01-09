from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from database import async_session

from Rooms.models import Rooms
from Building.models import Building
from RoomTypes.models import RoomTypes
from Rooms.schemas import SRoomCreate, SRoomUpdate


async def get_room_by_id(room_id: int) -> Rooms | None:
    async with async_session() as session:
        return await session.get(Rooms, room_id)

async def get_all_rooms() -> list[Rooms]:
    async with async_session() as session:
        res = await session.execute(select(Rooms))
        return list(res.scalars().all())

async def get_rooms_by_building(building_id: int) -> list[Rooms]:
    async with async_session() as session:
        res = await session.execute(select(Rooms).where(Rooms.building_id == building_id))
        return list(res.scalars().all())

async def create_room(body: SRoomCreate) -> Rooms:
    async with async_session() as session:
        if not await session.get(Building, body.building_id):
            raise LookupError("BUILDING_NOT_FOUND")
        if not await session.get(RoomTypes, body.room_type_id):
            raise LookupError("ROOM_TYPE_NOT_FOUND")

        room = Rooms(
            name=body.name,
            building_id=body.building_id,
            room_type_id=body.room_type_id,
        )
        session.add(room)
        await session.commit()
        await session.refresh(room)
        return room

async def update_room(room_id: int, body: SRoomUpdate) -> Rooms | None:
    async with async_session() as session:
        room = await session.get(Rooms, room_id)
        if not room:
            return None

        if body.building_id is not None:
            if not await session.get(Building, body.building_id):
                raise LookupError("BUILDING_NOT_FOUND")
            room.building_id = body.building_id

        if body.room_type_id is not None:
            if not await session.get(RoomTypes, body.room_type_id):
                raise LookupError("ROOM_TYPE_NOT_FOUND")
            room.room_type_id = body.room_type_id

        if body.name is not None:
            room.name = body.name

        await session.commit()
        await session.refresh(room)
        return room

async def delete_room(room_id: int) -> bool:
    async with async_session() as session:
        room = await session.get(Rooms, room_id)
        if not room:
            return False
        await session.delete(room)
        await session.commit()
        return True