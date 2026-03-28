from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from database import Base


class EquipmentStatus(Base):
    __tablename__ = "equipment_statuses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    equipment_id = Column(Integer, ForeignKey("equipment.id"), nullable=False)
    status_type_id = Column(
        Integer, ForeignKey("equipment_status_types.id"), nullable=False
    )
    doc_number = Column(String)
    status_change_date = Column(DateTime, nullable=False)
    responsible_user_id = Column(Integer, ForeignKey("responsible_users.id"))

    room_id = Column(
        Integer, ForeignKey("rooms.id", ondelete="SET NULL"), nullable=True
    )
    remarks = Column(String, nullable=False, default="", server_default="")

    equipment = relationship("Equipment", back_populates="statuses")
    status_type = relationship("EquipmentStatusType", back_populates="statuses")
    responsible_user = relationship("ResponsibleUser", back_populates="statuses")

    room = relationship("Rooms", back_populates="statuses")
