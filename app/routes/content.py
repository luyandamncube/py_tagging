from fastapi import APIRouter, HTTPException
from uuid import uuid4
from datetime import datetime

from app.db import get_db
from app.schemas import (
    ContentCreate,
    ExpandRequest
)
from app.services.content_snapshot import get_content_snapshot
from app.db.snapshot import snapshot_db
from app.services.drive_sync import enqueue_drive_sync, LAST_SYNC_STATUS
from app.services.content_preview import build_and_store_preview
from app.services.tag_validation import (
    validate_content_completeness,
    validate_content_completeness_detailed,
    TagValidationError,
)

from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from app.services.content_expand import expand_urls

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
            source_url,
            created_at,
            status
        )
        VALUES (?, ?, ?, CURRENT_TIMESTAMP, 'draft')
        """,
        (content_id, payload.url, payload.url),
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
        SELECT id
        FROM content
        WHERE status != 'complete'
        ORDER BY created_at
        LIMIT 1
        """
    ).fetchone()

    if not row:
        return None

    content_id = row[0]

    snapshot = get_content_snapshot(content_id)

    if snapshot is None:
        return None

    return snapshot

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

        url = item["url"]
        source_url = item.get("source_url") or url

        try:
            # 1️⃣ Insert content (draft)
            con.execute(
                """
                INSERT INTO content (
                    id,
                    url,
                    source_url,
                    created_at,
                    status
                )
                VALUES (?, ?, ?, CURRENT_TIMESTAMP, 'draft')
                """,
                (content_id, url, source_url),
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
                    source_url=url,
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
    con = get_db()

    # --------------------------------------------------
    # Case 1: Expanded items (url + source_url)
    # --------------------------------------------------
    items = payload.get("items")
    if items:
        urls = []
        sources = []

        for item in items:
            url = item.get("url")
            source_url = item.get("source_url")

            if url and source_url:
                urls.append(url)
                sources.append(source_url)

        if not urls:
            return {"existing": []}

        placeholders = ",".join("?" * len(urls))

        rows = con.execute(
            f"""
            SELECT url, source_url
            FROM content
            WHERE url IN ({placeholders})
              AND source_url IN ({placeholders})
            """,
            (*urls, *sources),
        ).fetchall()

        return {
            "existing": [
                {"url": r[0], "source_url": r[1]}
                for r in rows
            ]
        }

    # --------------------------------------------------
    # Case 2: Root URL check (legacy behavior)
    # --------------------------------------------------
    urls = payload.get("urls", [])
    if not urls:
        return {"existing": []}

    placeholders = ",".join("?" * len(urls))

    rows = con.execute(
        f"""
        SELECT url
        FROM content
        WHERE url IN ({placeholders})
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

@router.post("/export")
def export_content(payload: dict):
    tag_ids = payload.get("tag_ids", [])
    fmt = payload.get("format", "txt")

    con = get_db()

    if not tag_ids:
        # Export everything (explicit decision)
        rows = con.execute(
            "SELECT url FROM content ORDER BY created_at"
        ).fetchall()
    else:
        placeholders = ",".join("?" * len(tag_ids))

        rows = con.execute(
            f"""
            SELECT DISTINCT c.url
            FROM content c
            JOIN content_tag ct ON ct.content_id = c.id
            WHERE ct.tag_id IN ({placeholders})
            GROUP BY c.id
            HAVING COUNT(DISTINCT ct.tag_id) = ?
            ORDER BY c.created_at
            """,
            (*tag_ids, len(tag_ids)),
        ).fetchall()

    urls = [r[0] for r in rows]

    if fmt == "json":
        return {"urls": urls}

    if fmt == "csv":
        return {
            "content": "url\n" + "\n".join(urls),
            "content_type": "text/csv",
        }

    # default: txt
    return {
        "content": "\n".join(urls),
        "content_type": "text/plain",
    }

@router.post("/delete")
def delete_content_bulk(payload: dict):
    content_ids = payload.get("content_ids", [])

    if not content_ids:
        raise HTTPException(status_code=400, detail="No content IDs provided")

    con = get_db()

    placeholders = ",".join("?" * len(content_ids))

    res = con.execute(
        f"""
        UPDATE content
        SET status = 'deleted'
        WHERE id IN ({placeholders})
        """,
        content_ids,
    )

    return {
        "status": "ok",
        "deleted": res.rowcount,
    }

@router.post("/expand")
def expand_content(req: ExpandRequest):
    return {
        "results": expand_urls(req.urls)
    }