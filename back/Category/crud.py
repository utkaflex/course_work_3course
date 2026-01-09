from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload
from database import async_session

from Category.models import Category
from Category.schemas import SCategoryCreate

async def get_category_by_name(name: str) -> Category|None:
    async with async_session() as session:
        query = select(Category).where(Category.category_name == name)
        result = await session.execute(query)
        return result.scalar_one_or_none()
    
async def create_category(category: SCategoryCreate) -> Category:
    async with async_session() as session:
        db_category = Category(category_name=category.category_name)
        session.add(db_category)
        await session.commit()
        await session.refresh(db_category)
        return db_category

async def get_all_categories_with_types() -> list[Category]:
    async with async_session() as session:
        stmt = select(Category).options(selectinload(Category.types))
        res = await session.execute(stmt)
        return list(res.scalars().all())

async def get_all_categories() -> list[Category]:
    async with async_session() as session:
        result = await session.execute(select(Category))
        return list(result.scalars().all())

async def get_category_with_types(category_id: int) -> Category | None:
    async with async_session() as session:
        query = (
            select(Category)
            .where(Category.id == category_id)
            .options(selectinload(Category.types))
        )
        result = await session.execute(query)
        return result.scalar_one_or_none()

async def delete_category(category_id: int) -> bool:
    async with async_session() as session:
        category = await session.get(Category, category_id)
        if not category:
            return False
        await session.delete(category)
        await session.commit()
        return True

async def rename_category(category_id: int, new_name: str) -> Category | None:
    async with async_session() as session:
        category = await session.get(Category, category_id)
        if not category:
            return None

        category.category_name = new_name
        try:
            await session.commit()
        except IntegrityError:
            await session.rollback()
            raise
        await session.refresh(category)
        return category
