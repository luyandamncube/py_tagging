import subprocess
import threading
import logging
from pathlib import Path

log = logging.getLogger(__name__)

def _sync(snapshot_path: Path):
    try:
        subprocess.run(
            [
                "rclone",
                "copyto",
                str(snapshot_path),
                "gdrive:duckdb-backups/latest.duckdb",
                "--checksum",
            ],
            check=True,
        )
        log.info("✅ Drive sync completed (latest.duckdb)")
    except Exception:
        log.exception("❌ Drive sync failed")

def enqueue_drive_sync(snapshot_path: Path):
    threading.Thread(
        target=_sync,
        args=(snapshot_path,),
        daemon=True,
    ).start()
