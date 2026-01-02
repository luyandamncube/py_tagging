from fastapi import APIRouter, HTTPException
from uuid import uuid4
from datetime import datetime

from app.db import get_db
from app.schemas import ContentCreate
from app.services.content_snapshot import get_content_snapshot
from app.db.snapshot import snapshot_db
from app.services.drive_sync import enqueue_drive_sync, LAST_SYNC_STATUS
from app.services.content_preview import build_and_store_preview
from app.services.tag_validation import (
    validate_content_completeness,
    validate_content_completeness_detailed,
    TagValidationError,
)

router = APIRouter(prefix="/content", tags=["content"])


# ------------------------------------------------------------------
# CREATE SINGLE CONTENT (draft)
# ------------------------------------------------------------------

@router.post("/")
def create_content(payload: ContentCreate):
    con = get_db()
    content_id = str(uuid4())

    con.execute(
        """
        INSERT INTO content (
            id,
            url,
            created_at,
            status
        )
        VALUES (?, ?, CURRENT_TIMESTAMP, 'draft')
        """,
        (content_id, payload.url),
    )

    # --------------------------------------------------
    # 🖼️ Build preview (best-effort, non-blocking)
    # --------------------------------------------------
    try:
        build_and_store_preview(
            content_id=content_id,
            source_url=payload.url,
        )
    except Exception as e:
        # Never fail content creation
        print(f"⚠️ Preview build failed for {payload.url}: {e}")

    return {"id": content_id}


# ------------------------------------------------------------------
# GET NEXT INCOMPLETE CONTENT
# ------------------------------------------------------------------

@router.get("/next")
def get_next_content():
    con = get_db()

    row = con.execute(
        """
        SELECT
            id,
            url,
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
        "created_at": row[2],
    }


# ------------------------------------------------------------------
# COMPLETE / FINALISE CONTENT (STRICT)
# ------------------------------------------------------------------

@router.post("/{content_id}/complete")
def complete_content(content_id: str):
    con = get_db()

    try:
        validate_content_completeness(content_id)
    except TagValidationError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Content incomplete: {e}",
        )

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


# ------------------------------------------------------------------
# CONTENT COMPLETENESS VALIDATION (UI-FRIENDLY)
# ------------------------------------------------------------------



@router.get("/{content_id}/validation")
def get_content_validation(content_id: str):
    """
    Return structured per-group completeness validation for a content item.
    """
    return validate_content_completeness_detailed(content_id)


# ------------------------------------------------------------------
# GET FULL CONTENT SNAPSHOT
# ------------------------------------------------------------------

@router.get("/{content_id}")
def get_content(content_id: str):
    snapshot = get_content_snapshot(content_id)

    if snapshot is None:
        raise HTTPException(status_code=404, detail="Content not found")

    return snapshot


# ------------------------------------------------------------------
# BULK CREATE (DRAFT + TAGS + SNAPSHOT + ASYNC DRIVE SYNC)
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
            # 1️⃣ Insert content (draft)
            con.execute(
                """
                INSERT INTO content (
                    id,
                    url,
                    created_at,
                    status
                )
                VALUES (?, ?, CURRENT_TIMESTAMP, 'draft')
                """,
                (content_id, item["url"]),
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

            # --------------------------------------------------
            # 🖼️ Build preview (best-effort)
            # --------------------------------------------------
            try:
                build_and_store_preview(
                    content_id=content_id,
                    source_url=item["url"],
                )
            except Exception:
                pass

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


# ------------------------------------------------------------------
# CHECK URL DUPLICATES
# ------------------------------------------------------------------

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


# ------------------------------------------------------------------
# PREVIEW REBUILD
# ------------------------------------------------------------------

@router.post("/{content_id}/preview/rebuild")
def rebuild_preview(content_id: str):
    con = get_db()

    row = con.execute(
        "SELECT url FROM content WHERE id = ?",
        (content_id,),
    ).fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Content not found")

    try:
        preview = build_and_store_preview(
            content_id=content_id,
            source_url=row[0],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {
        "status": "ok",
        "preview": preview,
    }
