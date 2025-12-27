import duckdb
import os

from app.db.schema import init_schema

DB_PATH = "data/live.duckdb"

_connection = None


def get_db():
    global _connection

    if _connection is None:
        _connection = duckdb.connect(DB_PATH)
        init_schema(_connection)

    return _connection
