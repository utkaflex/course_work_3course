import logging
import ntpath
import shutil
import sqlite3
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo
import os
import gc
import errno

import aiofiles
import anyio
import smbclient
from alembic import command as alembic_command
from alembic.config import Config as AlembicConfig
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

from config import settings
from Database import crud
from database import engine as async_engine
from Database.crypto import decrypt_str
from Database.schemas import SBackupAutoGet, SBackupAutoSet
from User.depends import get_current_user
from User.models import User

router = APIRouter(
    prefix="/backup",
    tags=["Backup"],
)

BACK_ROOT = Path(__file__).resolve().parents[1]
ALEMBIC_INI = BACK_ROOT / "alembic.ini"
MIGRATIONS_DIR = BACK_ROOT / "migrations"
BACKUP_DIR = BACK_ROOT / "backups"
BACKUP_DIR.mkdir(exist_ok=True)
DB_FILE = (BACK_ROOT / settings.DB_NAME).resolve()

logging.info("Backup paths: DB_FILE=%s BACKUP_DIR=%s", DB_FILE, BACKUP_DIR)

_scheduler: AsyncIOScheduler | None = None
JOB_ID = "auto_backup_job"


@router.get("/download", summary="Download backup file")
async def download_backup_endpoint(user: User = Depends(get_current_user)):
    if user.system_role_id < 4:
        raise HTTPException(status_code=403, detail="Forbidden")
    if not DB_FILE.exists():
        raise HTTPException(status_code=404, detail="Database file not found")
    timestamp = datetime.now(tz=timezone(timedelta(hours=5))).strftime("%Y%m%d_%H%M%S")
    backup_filename = f"sats_{timestamp}.db"
    backup_path = BACKUP_DIR / backup_filename
    shutil.copy(DB_FILE, backup_path)
    return StreamingResponse(
        open(backup_path, "rb"),
        media_type="application/octet-stream",
        headers={"Content-Disposition": f"attachment; filename={backup_filename}"},
    )


@router.post("/restore/upload", summary="Restore database from uploaded file")
async def restore_backup_upload_endpoint(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
):
    if user.system_role_id < 4:
        raise HTTPException(status_code=403, detail="Forbidden")

    temp_path = BACKUP_DIR / f"restore_{uuid.uuid4().hex}.db"
    swapped = False

    try:
        async with aiofiles.open(temp_path, "wb") as out:
            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break
                await out.write(chunk)
        size = temp_path.stat().st_size
        if size < 100:
            raise HTTPException(
                status_code=400, detail="Backup file is empty or too small"
            )

        if not _is_sqlite_file(temp_path):
            raise HTTPException(
                status_code=400, detail="Uploaded file is not a SQLite database"
            )

        if not await anyio.to_thread.run_sync(_sqlite_integrity_ok, temp_path):
            raise HTTPException(
                status_code=400,
                detail="Uploaded database is corrupted (integrity_check failed)",
            )
        try:
            await anyio.to_thread.run_sync(_alembic_upgrade_to_head, temp_path)
        except Exception:
            logging.exception("Restore rejected: migrations failed on uploaded DB")
            raise HTTPException(
                status_code=400, detail="Invalid backup: migrations failed"
            )
        is_empty = await anyio.to_thread.run_sync(_db_looks_empty, temp_path)
        try:
            await async_engine.dispose()
            gc.collect()
            _cleanup_sqlite_sidecars(DB_FILE)

            if DB_FILE.exists():
                ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
                shutil.copy2(DB_FILE, BACKUP_DIR / f"before_restore_{ts}.db")

            try:
                os.replace(str(temp_path), str(DB_FILE))
                swapped = True
            except OSError as e:
                if e.errno != errno.EBUSY:
                    raise

                logging.warning(
                    "DB file is busy/mounted; falling back to sqlite backup copy into existing DB file"
                )

                for attempt in range(5):
                    try:
                        await anyio.to_thread.run_sync(
                            _sqlite_backup_sync, temp_path, DB_FILE
                        )
                        swapped = True
                        break
                    except sqlite3.OperationalError as ex:
                        if "locked" in str(ex).lower():
                            await anyio.sleep(0.2 * (attempt + 1))
                            continue
                        raise

            if swapped and temp_path.exists():
                temp_path.unlink(missing_ok=True)

        except Exception:
            logging.exception("Restore failed during DB swap (dispose/copy/replace)")
            raise HTTPException(status_code=500, detail="Failed to swap database file")

        resp = {"message": "Database restored successfully"}
        if is_empty:
            resp["warning"] = (
                "Restored database looks empty (no rows). Check that you uploaded the correct backup."
            )
        return resp

    finally:
        if temp_path.exists() and not swapped:
            failed = BACKUP_DIR / f"restore_failed_{uuid.uuid4().hex}.db"
            try:
                temp_path.rename(failed)
                logging.error("Kept failed restore file at %s", failed)
            except Exception:
                temp_path.unlink(missing_ok=True)


@router.get("/auto", response_model=SBackupAutoGet, summary="Get auto-backup schedule")
async def get_auto_backup(user: User = Depends(get_current_user)):
    if user.system_role_id < 4:
        raise HTTPException(status_code=403, detail="Forbidden")

    cfg = await crud.get_auto_settings()
    if cfg is None:
        return SBackupAutoGet(
            cron="",
            timezone="Asia/Yekaterinburg",
            net_path=None,
            dir=None,
        )

    return SBackupAutoGet(
        cron=cfg.cron or "",
        timezone=cfg.timezone,
        net_path=decrypt_str(getattr(cfg, "smb_net_path", None)),
        dir=decrypt_str(getattr(cfg, "smb_dir", None)),
    )

@router.post("/auto", response_model=SBackupAutoGet, summary="Set auto-backup schedule")
async def set_auto_backup(body: SBackupAutoSet, user: User = Depends(get_current_user)):
    if user.system_role_id < 4:
        raise HTTPException(status_code=403, detail="Forbidden")

    if body.cron.strip():
        try:
            ZoneInfo(body.timezone)
            _compute_next(body.cron, body.timezone)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid cron or timezone")

        missing = [
            name
            for name, val in [
                ("username", body.username),
                ("password", body.password),
                ("netPath", body.net_path),
            ]
            if not val
        ]
        if missing:
            raise HTTPException(
                status_code=400,
                detail=f"SMB connection settings required: {', '.join(missing)}",
            )

    cfg = await crud.upsert_auto_config(
        cron=body.cron,
        timezone=body.timezone,
        username=body.username,
        password=body.password,
        net_path=body.net_path,
        dir=body.dir,
    )

    await _ensure_scheduler_started()

    return SBackupAutoGet(
        cron=cfg.cron or "",
        timezone=cfg.timezone,
        net_path=decrypt_str(cfg.smb_net_path),
        dir=decrypt_str(cfg.smb_dir),
    )

def _now_utc():
    return datetime.now(timezone.utc)


def _compute_next(cron: str, tz: str):
    trigger = CronTrigger.from_crontab(cron, timezone=ZoneInfo(tz))
    now = datetime.now(ZoneInfo(tz))
    return trigger.get_next_fire_time(None, now)


def _backup_filename(tz: str):
    ts = datetime.now(ZoneInfo(tz)).strftime("%Y%m%d_%H%M%S")
    return f"sats_{ts}.db"


def _sqlite_backup_sync(src_path: Path, dst_path: Path):
    from sqlite3 import connect as sqlite_connect

    with sqlite_connect(src_path) as src:
        with sqlite_connect(dst_path) as dst:
            src.backup(dst)


def _resolve_unc_dir(net_path: str, subdir: str | None) -> tuple[str, str]:
    base = (net_path or "").replace("/", "\\").strip()
    if not base:
        raise ValueError("netPath is empty")

    # разрешаем "192.168.10.53\\bckp$"
    if not base.startswith("\\\\"):
        base = "\\\\" + base.lstrip("\\")

    base = base.rstrip("\\")
    parts = [p for p in base[2:].split("\\") if p]
    if len(parts) < 2:
        raise ValueError("netPath must be like \\\\server\\share")

    server = parts[0]
    path_parts = parts[:2]

    if subdir:
        s = subdir.replace("/", "\\").strip().strip("\\")
        if s:
            path_parts.extend([p for p in s.split("\\") if p])

    unc_dir = "\\\\" + "\\".join(path_parts)
    return server, unc_dir


def _upload_to_smb(
    local_path: Path,
    username: str,
    password: str,
    net_path: str,
    remote_dir: str | None,
):
    server, unc_dir = _resolve_unc_dir(net_path, remote_dir)

    smbclient.register_session(server, username=username, password=password)
    parts = [p for p in unc_dir[2:].split("\\") if p]
    if len(parts) > 2:
        smbclient.makedirs(unc_dir, exist_ok=True)

    remote_path = ntpath.join(unc_dir, local_path.name)

    with open(local_path, "rb") as src_fd:
        with smbclient.open_file(remote_path, mode="wb") as dst_fd:
            shutil.copyfileobj(src_fd, dst_fd, length=1024 * 1024)


async def _do_backup():
    if not DB_FILE.exists():
        logging.warning("DB file not found, skip backup")
        return

    cfg = await crud.get_auto_settings()
    if cfg is None or not (cfg.cron or "").strip():
        logging.warning("Auto-backup config missing/cron empty, skip backup")
        return

    tz = "UTC"
    if cfg.timezone:
        try:
            ZoneInfo(cfg.timezone)
            tz = cfg.timezone
        except Exception:
            tz = "UTC"

    backup_path = BACKUP_DIR / _backup_filename(tz)

    await anyio.to_thread.run_sync(_sqlite_backup_sync, DB_FILE, backup_path)

    try:
        if backup_path.stat().st_size <= 0:
            logging.error("Backup file is empty: %s", backup_path)
            backup_path.unlink(missing_ok=True)
            return
    except Exception:
        logging.exception("Failed to stat backup file: %s", backup_path)
        return

    username = decrypt_str(cfg.smb_username)
    password = decrypt_str(cfg.smb_password)
    net_path = decrypt_str(cfg.smb_net_path)
    remote_dir = decrypt_str(cfg.smb_dir)

    if not (username and password and net_path):
        logging.error(
            "SMB settings are not configured; created local backup only: %s",
            backup_path,
        )
        return

    try:
        await anyio.to_thread.run_sync(
            _upload_to_smb, backup_path, username, password, net_path, remote_dir
        )
    except Exception:
        logging.exception("Failed to upload backup to SMB share")
        return

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
    if cfg is None or not (cfg.cron or "").strip():
        if _scheduler.get_job(JOB_ID):
            _scheduler.remove_job(JOB_ID)
        return

    trigger = CronTrigger.from_crontab(cfg.cron, timezone=ZoneInfo(cfg.timezone))

    if _scheduler.get_job(JOB_ID):
        _scheduler.reschedule_job(JOB_ID, trigger=trigger)
    else:
        _scheduler.add_job(
            _do_backup, trigger=trigger, id=JOB_ID, replace_existing=True
        )


async def start_auto_backup_scheduler():
    await _ensure_scheduler_started()


async def stop_auto_backup_scheduler():
    global _scheduler
    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        _scheduler = None


def _is_sqlite_file(path: Path) -> bool:
    try:
        with open(path, "rb") as f:
            return f.read(16) == b"SQLite format 3\x00"
    except Exception:
        return False


def _sqlite_sync_url(path: Path) -> str:
    p = path.resolve()
    if p.drive:
        return f"sqlite:///{p.as_posix()}"
    return f"sqlite:////{p.as_posix().lstrip('/')}"


def _alembic_upgrade_to_head(db_path: Path) -> None:
    cfg = AlembicConfig(str(ALEMBIC_INI))
    cfg.set_main_option("script_location", str(MIGRATIONS_DIR))
    cfg.set_main_option("sqlalchemy.url", _sqlite_sync_url(db_path))
    alembic_command.upgrade(cfg, "head")


def _db_looks_empty(db_path: Path) -> bool:
    conn = sqlite3.connect(db_path)
    try:
        cur = conn.cursor()
        tables = [
            r[0]
            for r in cur.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
            ).fetchall()
        ]
        tables = [t for t in tables if t != "alembic_version"]
        if not tables:
            return True

        for t in tables:
            cnt = cur.execute(f"SELECT COUNT(1) FROM {t}").fetchone()[0]
            if int(cnt) > 0:
                return False
        return True
    finally:
        conn.close()


def _cleanup_sqlite_sidecars(db_file: Path) -> None:
    for suffix in ("-wal", "-shm"):
        side = Path(str(db_file) + suffix)
        side.unlink(missing_ok=True)


def _sqlite_integrity_ok(db_path: Path) -> bool:
    conn = sqlite3.connect(db_path)
    try:
        res = conn.execute("PRAGMA integrity_check;").fetchone()[0]
        return str(res).lower() == "ok"
    finally:
        conn.close()
