from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from database import Base


class Category(Base):
    __tablename__ = "category"

    id = Column(Integer, primary_key=True, autoincrement=True)
    category_name = Column(String(50), nullable=False, unique=True)

    category_types = relationship(
        "CategoryType", back_populates="category", cascade="all, delete-orphan"
    )
    types = relationship("EquipmentType", secondary="category_type", viewonly=True)
