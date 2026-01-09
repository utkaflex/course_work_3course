from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from database import Base

class EquipmentType(Base):
    __tablename__ = "equipment_types"

    id = Column(Integer, primary_key=True, autoincrement=True)
    type_name = Column(String(50), nullable=False, unique=True)

    equipment = relationship("Equipment", back_populates="type", cascade="all, delete")
    category_types = relationship("CategoryType", back_populates = "type", cascade = "all, delete-orphan")

    categories = relationship("Category", secondary="category_type", viewonly=True)