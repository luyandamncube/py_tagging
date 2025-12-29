from fastapi import APIRouter, HTTPException
from uuid import uuid4
from app.db import get_db
from app.schemas import ContentCreate
from app.services.content_validation import validate_content
from app.services.content_snapshot import get_content_snapshot

from app.db.snapshot import snapshot_db
from app.services.drive_sync import enqueue_drive_sync, LAST_SYNC_STATUS


router = APIRouter(prefix="/content", tags=["content"])


@router.post("/")
def create_content(payload: ContentCreate):
    con = get_db()
    content_id = str(uuid4())

    con.execute(
        """
        INSERT INTO content (id, url, site, creator, type)
        VALUES (?, ?, ?, ?, ?)
        """,
        (content_id, payload.url, payload.site, payload.creator, payload.type),
    )

    return {"id": content_id}


@router.get("/next")
def get_next_content():
    con = get_db()

    row = con.execute(
        """
        SELECT
            id,
            url,
            site,
            creator,
            type,
            created_at
        FROM content
        WHERE status != 'complete'
        ORDER BY created_at
        LIMIT 1
        """
    ).fetchone()

    if not row:
        return None

    return {
        "id": row[0],
        "url": row[1],
        "site": row[2],
        "creator": row[3],
        "type": row[4],
        "created_at": row[5],
    }


@router.post("/{content_id}/complete")
def complete_content(content_id: str):
    con = get_db()

    res = con.execute(
        """
        UPDATE content
        SET status = 'complete'
        WHERE id = ?
        """,
        (content_id,),
    )

    if res.rowcount == 0:
        raise HTTPException(status_code=404, detail="Content not found")

    return {
        "status": "ok",
        "content_id": content_id,
    }


@router.get("/{content_id}/validation")
def get_content_validation(content_id: str):
    """
    Return tag-group validation status for a content item.
    """
    return validate_content(content_id)


@router.get("/{content_id}")
def get_content(content_id: str):
    snapshot = get_content_snapshot(content_id)

    if snapshot is None:
        raise HTTPException(status_code=404, detail="Content not found")

    return snapshot


# ------------------------------------------------------------------
# BULK CREATE (with snapshot + async Drive sync)
# ------------------------------------------------------------------

@router.post("/bulk")
def create_content_bulk(payload: dict):
    items = payload.get("items", [])
    if not items:
        raise HTTPException(status_code=400, detail="No items provided")

    con = get_db()
    created = []
    skipped = []

    for item in items:
        content_id = str(uuid4())
        tag_ids = item.get("tag_ids", [])

        try:
            # 1️⃣ Insert content
            con.execute(
                """
                INSERT INTO content (
                    id,
                    url,
                    site,
                    creator,
                    type,
                    created_at
                )
                VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                """,
                (
                    content_id,
                    item["url"],
                    item.get("site"),
                    item.get("creator"),
                    item.get("type", "image"),
                ),
            )

            # 2️⃣ Insert content ↔ tag relations
            for tag_id in tag_ids:
                con.execute(
                    """
                    INSERT OR IGNORE INTO content_tag (
                        content_id,
                        tag_id
                    )
                    VALUES (?, ?)
                    """,
                    (content_id, tag_id),
                )

            created.append(content_id)

        except Exception:
            # Likely UNIQUE violation on content.url
            skipped.append(item.get("url"))

    # --------------------------------------------------------------
    # 📸 Snapshot + async Google Drive sync
    # --------------------------------------------------------------
    backup_scheduled = False
    snapshot_name = None

    if created:
        snapshot_path = snapshot_db(con)
        enqueue_drive_sync(snapshot_path)

        backup_scheduled = True
        snapshot_name = snapshot_path.name

    return {
        "created": len(created),
        "skipped": len(skipped),
        "skipped_urls": skipped,
        "backup": {
            "scheduled": backup_scheduled,
            "snapshot": snapshot_name,
            "last_sync": LAST_SYNC_STATUS,
        },
    }


@router.post("/check-duplicates")
def check_duplicates(payload: dict):
    urls = payload.get("urls", [])
    if not urls:
        return {"existing": []}

    con = get_db()

    rows = con.execute(
        f"""
        SELECT url
        FROM content
        WHERE url IN ({",".join("?" * len(urls))})
        """,
        urls,
    ).fetchall()

    return {
        "existing": [r[0] for r in rows]
    }
