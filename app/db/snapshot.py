from pathlib import Path
import duckdb
import shutil

DATA_DIR = Path("data")
BACKUP_DIR = DATA_DIR / "backups"
BACKUP_DIR.mkdir(exist_ok=True)

def snapshot_db(con: duckdb.DuckDBPyConnection) -> Path:
    """
    Create a single rolling DuckDB snapshot (latest.duckdb).
    """
    snapshot_path = BACKUP_DIR / "latest.duckdb"

    # Flush WAL → DB
    con.execute("CHECKPOINT")

    shutil.copy2(DATA_DIR / "live.duckdb", snapshot_path)

    return snapshot_path
