from fastapi import APIRouter, HTTPException
from typing import List

from Rooms.schemas import SRoom, SRoomCreate, SRoomUpdate
from Rooms import crud

router = APIRouter(
    prefix="/room",
    tags=["Аудитории"],
)

@router.post("/create", response_model=SRoom)
async def create_room(body: SRoomCreate):
    try:
        return await crud.create_room(body)
    except LookupError as e:
        if str(e) == "BUILDING_NOT_FOUND":
            raise HTTPException(status_code=404, detail="Building not found")
        if str(e) == "ROOM_TYPE_NOT_FOUND":
            raise HTTPException(status_code=404, detail="Room type not found")
        raise

@router.get("/all", response_model=List[SRoom])
async def get_all_rooms():
    return await crud.get_all_rooms()

@router.get("/by_building/{building_id}", response_model=List[SRoom])
async def get_rooms_by_building(building_id: int):
    return await crud.get_rooms_by_building(building_id)

@router.get("/{room_id}", response_model=SRoom)
async def get_room(room_id: int):
    room = await crud.get_room_by_id(room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room

@router.put("/{room_id}", response_model=SRoom)
async def update_room(room_id: int, body: SRoomUpdate):
    try:
        updated = await crud.update_room(room_id, body)
    except LookupError as e:
        if str(e) == "BUILDING_NOT_FOUND":
            raise HTTPException(status_code=404, detail="Building not found")
        if str(e) == "ROOM_TYPE_NOT_FOUND":
            raise HTTPException(status_code=404, detail="Room type not found")
        raise

    if not updated:
        raise HTTPException(status_code=404, detail="Room not found")
    return updated

@router.delete("/{room_id}")
async def delete_room(room_id: int):
    ok = await crud.delete_room(room_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Room not found")
    return {"ok": True}
