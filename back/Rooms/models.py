from sqlalchemy import Column, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from database import Base


class Rooms(Base):
    __tablename__ = "rooms"

    __table_args__ = (
        UniqueConstraint("building_id", "name", name="uq_rooms_building_id_name"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), nullable=False)

    building_id = Column(
        Integer, ForeignKey("buildings.id", ondelete="CASCADE"), nullable=False
    )
    room_type_id = Column(
        Integer, ForeignKey("room_types.id", ondelete="RESTRICT"), nullable=False
    )

    building = relationship("Building", back_populates="rooms")
    room_type = relationship("RoomTypes", back_populates="rooms")
    statuses = relationship("EquipmentStatus", back_populates="room")
