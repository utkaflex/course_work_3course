from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from database import Base


class RoomTypes(Base):
    __tablename__ = "room_types"

    id = Column(Integer, primary_key=True, autoincrement=True)
    room_type = Column(String(200), nullable=False, unique=True)

    rooms = relationship("Rooms", back_populates="room_type")
