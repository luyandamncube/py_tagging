import duckdb
import os
from threading import Lock

from app.db.schema import init_schema

DB_PATH = "data/live.duckdb"

_schema_initialized = False
_schema_lock = Lock()


def get_db():
    """
    Return a NEW DuckDB connection per request.

    DuckDB does NOT support concurrent queries on the same connection.
    """
    global _schema_initialized

    con = duckdb.connect(DB_PATH)

    # Ensure schema is initialized exactly once
    if not _schema_initialized:
        with _schema_lock:
            if not _schema_initialized:
                init_schema(con)
                _schema_initialized = True

    return con
