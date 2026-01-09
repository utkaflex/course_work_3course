from fastapi import APIRouter, HTTPException
from Category.schemas import SCategory, SCategoryCreate, SCategoryUpdate, SCategoryWithTypes
from typing import List

from . import crud

router = APIRouter(
    prefix = "/categories",
    tags = ["Категории типов оборудования"],
)

@router.post("/create", response_model=SCategory)
async def create_category(category: SCategoryCreate):
    db_category = await crud.get_category_by_name(category.category_name)
    if db_category:
        raise HTTPException(status_code=409, detail="Category already exists")
    return await crud.create_category(category)

@router.get("/get_all", response_model=List[SCategory])
async def all_categories():
    return await crud.get_all_categories()

@router.get("/get_all_with_types", response_model=List[SCategoryWithTypes])
async def get_all_with_types():
    return await crud.get_all_categories_with_types()

@router.get("/{category_id}", response_model = SCategoryWithTypes)
async def get_category(category_id: int):
    category = await crud.get_category_with_types(category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category

@router.put("/{category_id}", response_model=SCategory)
async def edit_category_name(category_id: int, body: SCategoryUpdate):
    db_category = await crud.get_category_by_name(body.category_name)
    if db_category and db_category.id != category_id:
        raise HTTPException(status_code=409, detail="Category already exists")

    updated = await crud.rename_category(category_id, body.category_name)
    if not updated:
        raise HTTPException(status_code=404, detail="Category not found")
    return updated

@router.delete("/{category_id}")
async def delete_category(category_id: int):
    ok = await crud.delete_category(category_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"ok": True}