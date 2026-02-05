from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError

from Category.models import Category
from CategoryType.models import CategoryType
from database import async_session
from EquipmentType.models import EquipmentType


async def add_type_to_category(category_id: int, type_id: int) -> CategoryType:
    async with async_session() as session:
        if not await session.get(Category, category_id):
            raise LookupError("CATEGORY_NOT_FOUND")
        if not await session.get(EquipmentType, type_id):
            raise LookupError("TYPE_NOT_FOUND")

        link = CategoryType(category_id=category_id, type_id=type_id)
        session.add(link)
        try:
            await session.commit()
        except IntegrityError:
            await session.rollback()
            raise
        await session.refresh(link)
        return link


async def remove_type_from_category(category_id: int, type_id: int) -> bool:
    async with async_session() as session:
        stmt = delete(CategoryType).where(
            CategoryType.category_id == category_id,
            CategoryType.type_id == type_id,
        )
        res = await session.execute(stmt)
        await session.commit()
        return (res.rowcount or 0) > 0
