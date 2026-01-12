import asyncio
import logging
import shutil
from pathlib import Path
from datetime import datetime, timedelta, timezone
from contextlib import contextmanager
from sqlite3 import connect as sqlite_connect
import aiosqlite
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
import aiofiles
from aiofiles import os as async_os
from zoneinfo import ZoneInfo
import anyio
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from Database import crud
from Database.schemas import SBackupAutoSet, SBackupAutoGet


from User.depends import get_current_user
from User.models import User

router = APIRouter(
    prefix="/backup",
    tags=["Backup"],
)

BACKUP_DIR = Path("backups")
DB_FILE = Path("sats.db")
BACKUP_DIR.mkdir(exist_ok=True)
_scheduler: AsyncIOScheduler | None = None
JOB_ID = "auto_backup_job"


@router.get("/download", summary="Download backup file")
async def download_backup_endpoint(user: User = Depends(get_current_user)):
    if user.system_role_id < 4:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    if not DB_FILE.exists():
        raise HTTPException(status_code=404, detail="Database file not found")
    
    timestamp = datetime.now(tz=timezone(timedelta(hours=5))).strftime('%Y%m%d_%H%M%S')
    backup_filename = f"sats_{timestamp}.db"
    backup_path = BACKUP_DIR / backup_filename

    shutil.copy(DB_FILE, backup_path)
    
    return StreamingResponse(
        open(backup_path, "rb"),
        media_type="application/octet-stream",
        headers={"Content-Disposition": f"attachment; filename={backup_filename}"}
    )

@router.post("/restore/upload", summary="Restore database from uploaded file")
async def restore_backup_upload_endpoint(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user)
):
    if user.system_role_id < 4:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    temp_path = BACKUP_DIR / file.filename

    try:
        async with aiofiles.open(temp_path, "wb") as buffer:
            await buffer.write(await file.read())

        shutil.move(temp_path, DB_FILE)
        return {"message": "Database restored successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to restore database")

    finally:
        if temp_path.exists():
            temp_path.unlink(missing_ok=True)

@router.get("/auto", response_model=SBackupAutoGet, summary="Get auto-backup schedule")
async def get_auto_backup(user: User = Depends(get_current_user)):
    if user.system_role_id < 4:
        raise HTTPException(status_code=403, detail="Forbidden")

    cfg = await crud.get_auto_settings()
    if cfg is None:
        return SBackupAutoGet(cron="",
                             timezone="Asia/Yekaerinburg",
                             enabled=False,
                             last_backup_at=None,
                             next_backup_at=None)

    next_dt = None
    if cfg.enabled:
        try:
            next_dt = _compute_next(cfg.cron, cfg.timezone)
        except Exception:
            next_dt = None

    return SBackupAutoGet(
        cron=cfg.cron,
        timezone=cfg.timezone,
        enabled=cfg.enabled,
        last_backup_at=cfg.last_backup_at,
        next_backup_at=next_dt,
    )

@router.post("/auto", response_model=SBackupAutoGet, summary="Set auto-backup schedule")
async def set_auto_backup(body: SBackupAutoSet, user: User = Depends(get_current_user)):
    if user.system_role_id < 4:
        raise HTTPException(status_code=403, detail="Forbidden")
    try:
        ZoneInfo(body.timezone)
        _compute_next(body.cron, body.timezone)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid cron or timezone")

    cfg = await crud.upsert_auto_config(body.cron, body.timezone, body.enabled)
    await _ensure_scheduler_started()
    next_dt = _compute_next(cfg.cron, cfg.timezone) if cfg.enabled else None
    return SBackupAutoGet(
        cron=cfg.cron,
        timezone=cfg.timezone,
        enabled=cfg.enabled,
        last_backup_at=cfg.last_backup_at,
        next_backup_at=next_dt,
    )

def _now_utc():
    return datetime.now(timezone.utc)

def _compute_next(cron: str, tz: str):
    trigger = CronTrigger.from_crontab(cron, timezone=ZoneInfo(tz))
    now = datetime.now(ZoneInfo(tz))
    nxt = trigger.get_next_fire_time(None, now)
    return nxt

def _backup_filename(tz: str):
    ts = datetime.now(ZoneInfo(tz)).strftime("%Y%m%d_%H%M%S")
    return f"sats_{ts}.db"

def _sqlite_backup_sync(src_path: Path, dst_path: Path):
    from sqlite3 import connect as sqlite_connect
    with sqlite_connect(src_path) as src:
        with sqlite_connect(dst_path) as dst:
            src.backup(dst)

async def _do_backup():
    if not DB_FILE.exists():
        logging.warning("DB file not found, skip backup")
        return

    cfg = await crud.get_auto_settings()
    tz = "UTC"
    if cfg and cfg.timezone:
        try:
            ZoneInfo(cfg.timezone)
            tz = cfg.timezone
        except Exception:
            tz = "UTC"

    backup_path = BACKUP_DIR / _backup_filename(tz)
    await anyio.to_thread.run_sync(_sqlite_backup_sync, DB_FILE, backup_path)
    await crud.set_last_backup(_now_utc())

async def _ensure_scheduler_started():
    global _scheduler
    if _scheduler is None:
        _scheduler = AsyncIOScheduler()
        _scheduler.start()
    await _reschedule_job_from_db()

async def _reschedule_job_from_db():
    if _scheduler is None:
        return

    cfg = await crud.get_auto_settings()
    if cfg is None or not cfg.enabled:
        if _scheduler.get_job(JOB_ID):
            _scheduler.remove_job(JOB_ID)
        return

    trigger = CronTrigger.from_crontab(cfg.cron, timezone=ZoneInfo(cfg.timezone))

    if _scheduler.get_job(JOB_ID):
        _scheduler.reschedule_job(JOB_ID, trigger=trigger)
    else:
        _scheduler.add_job(_do_backup, trigger=trigger, id=JOB_ID, replace_existing=True)

async def start_auto_backup_scheduler():
    await _ensure_scheduler_started()

async def stop_auto_backup_scheduler():
    global _scheduler
    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        _scheduler = None