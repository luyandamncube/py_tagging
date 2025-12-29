#!/bin/sh
set -e

DB_PATH="data/live.duckdb"
BACKUP_REMOTE="gdrive:duckdb-backups/latest.duckdb"

echo "⬇️  Restoring DuckDB from Google Drive"
echo "   $BACKUP_REMOTE → $DB_PATH"

rclone copyto "$BACKUP_REMOTE" "$DB_PATH"

echo "✅ DuckDB restore complete"

exec "$@"
