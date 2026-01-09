from fastapi import APIRouter, HTTPException
from RoomTypes.schemas import SRoomTypeCreate, SRoomTypeUpdate, SRoomType, SRoomTypeWithRooms
from RoomTypes import crud
from typing import List

router = APIRouter(
    prefix = "/room_type",
    tags = ["Типы аудиторий"],
)

@router.post("/create", response_model=SRoomType)
async def create_room_type(body: SRoomTypeCreate):
    exists = await crud.get_room_type_by_name(body.room_type)
    if exists:
        raise HTTPException(status_code=409, detail="Room type already exists")
    return await crud.create_room_type(body)

@router.get("/all", response_model= List[SRoomType])
async def get_all_room_types():
    return await crud.get_all_room_types()

@router.get("/get_all_with_types", response_model=List[SRoomTypeWithRooms])
async def get_all_with_rooms():
    return await crud.get_all_room_types_with_rooms()

@router.get("/{room_type_id}", response_model = SRoomTypeWithRooms)
async def get_room_type(room_type_id: int):
    room_type = await crud.get_room_type_with_rooms(room_type_id)
    if not room_type:
        raise HTTPException(status_code=404, detail="Room type not found")
    return room_type

@router.put("/{room_type_id}", response_model=SRoomType)
async def edit_room_type_name(room_type_id: int, body: SRoomTypeUpdate):
    db_room_type = await crud.get_room_type_by_name(body.room_type)
    if db_room_type and db_room_type.id != room_type_id:
        raise HTTPException(status_code=409, detail="Room type already exists")

    updated = await crud.rename_room_type(room_type_id, body.room_type)
    if not updated:
        raise HTTPException(status_code=404, detail="Room type not found")
    return updated

@router.delete("/{room_type_id}")
async def delete_room_type(room_type_id: int):
    ok = await crud.delete_room_type(room_type_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Room type not found")
    return {"ok": True}