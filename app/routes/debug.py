from fastapi import APIRouter
from app.db import get_db
from app.services.content_snapshot import get_content_snapshot

router = APIRouter(prefix="/debug", tags=["debug"])

@router.get("/content")
def list_content():
    con = get_db()
    rows = con.execute("SELECT * FROM content").fetchall()
    return rows

@router.get("/content/count")
def get_content_count():
    con = get_db()

    # Total count
    total = con.execute(
        "SELECT COUNT(*) FROM content"
    ).fetchone()[0]

    # Status-aware counts (safe if status exists)
    rows = con.execute(
        """
        SELECT
            COALESCE(status, 'pending') AS status,
            COUNT(*) AS cnt
        FROM content
        GROUP BY COALESCE(status, 'pending')
        """
    ).fetchall()

    by_status = {row[0]: row[1] for row in rows}

    return {
        "total": total,
        "pending": by_status.get("pending", 0),
        "complete": by_status.get("complete", 0),
    }

@router.get("/content/recent")
def get_recent_content(limit: int = 5):
    con = get_db()

    rows = con.execute(
        """
        SELECT id
        FROM content
        ORDER BY created_at DESC
        LIMIT ?
        """,
        (limit,),
    ).fetchall()

    snapshots = []

    for (content_id,) in rows:
        snapshot = get_content_snapshot(content_id)
        if snapshot:
            snapshots.append(snapshot)

    return {
        "count": len(snapshots),
        "items": snapshots,
    }
