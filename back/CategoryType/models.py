from sqlalchemy import Column, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import relationship

from database import Base


class CategoryType(Base):
    __tablename__ = "category_type"

    id = Column(Integer, primary_key=True, autoincrement=True)
    category_id = Column(
        Integer, ForeignKey("category.id", ondelete="CASCADE"), nullable=False
    )
    type_id = Column(
        Integer, ForeignKey("equipment_types.id", ondelete="CASCADE"), nullable=False
    )

    __table_args__ = (
        UniqueConstraint(
            "category_id", "type_id", name="uq_category_type_category_id_type_id"
        ),
    )

    category = relationship("Category", back_populates="category_types")
    type = relationship("EquipmentType", back_populates="category_types")
