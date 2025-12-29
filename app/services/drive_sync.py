import subprocess
import threading
import logging
from pathlib import Path
from datetime import datetime

log = logging.getLogger(__name__)

# Simple in-memory status (Phase 1)
LAST_SYNC_STATUS = {
    "status": "never",
    "timestamp": None,
    "error": None,
}

def _sync(snapshot_path: Path):
    global LAST_SYNC_STATUS

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
            capture_output=True,
            text=True,
        )

        LAST_SYNC_STATUS.update({
            "status": "success",
            "timestamp": datetime.utcnow().isoformat(),
            "error": None,
        })

        log.info("✅ Drive sync successful")

    except subprocess.CalledProcessError as e:
        LAST_SYNC_STATUS.update({
            "status": "failed",
            "timestamp": datetime.utcnow().isoformat(),
            "error": e.stderr,
        })

        log.error("❌ Drive sync failed")

def enqueue_drive_sync(snapshot_path: Path):
    threading.Thread(
        target=_sync,
        args=(snapshot_path,),
        daemon=True,
    ).start()
