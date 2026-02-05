from sqlalchemy import Column, Integer, Boolean, String, DateTime
from database import Base

class BackupAutoSettings(Base):
    __tablename__ = "backup_auto_settings"

    id = Column(Integer, primary_key=True)
    enabled = Column(Boolean, nullable=False, default=False)
    cron = Column(String, nullable=True)
    timezone = Column(String, nullable=False, default="Asia/Yekaterinburg")
    last_backup_at = Column(DateTime, nullable=True)
    smb_username = Column(String, nullable = True)
    smb_password = Column(String, nullable = True)
    smb_ip = Column(String, nullable = True)
    smb_dir = Column(String, nullable = True)