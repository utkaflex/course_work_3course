from fastapi import APIRouter, HTTPException
from CategoryType.schemas import SCategoryType, SCategoryTypeCreate
from . import crud
from sqlalchemy.exc import IntegrityError

router = APIRouter(
   prefix="/category_type",
   tags=["Типы по категориям"],
)

##@router.post("/add", response_model=SCategoryType)
##async def add(body: SCategoryTypeCreate):
##    try:
##        return await crud.add_type_to_category(body.category_id, body.type_id)
##    except LookupError as e:
##        if str(e) == "CATEGORY_NOT_FOUND":
##            raise HTTPException(status_code=404, detail="Category not found")
##        if str(e) == "TYPE_NOT_FOUND":
##            raise HTTPException(status_code=404, detail="Type not found")
##        raise
##    except IntegrityError:
##        raise HTTPException(status_code=409, detail="Link already exists")

##@router.delete("/remove")
##async def remove(body: SCategoryTypeCreate):
##    ok = await crud.remove_type_from_category(body.category_id, body.type_id)
##    if not ok:
##        raise HTTPException(status_code=404, detail="Link not found")
##    return {"ok": True}