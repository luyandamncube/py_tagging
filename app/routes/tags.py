from fastapi import APIRouter, HTTPException, Query
from datetime import datetime

from app.db import get_db
from app.schemas import TagCreate, AssignTags, EnsureTagRequest
from app.services.tag_search import search_tags
from app.services.tag_ensure import ensure_tag
from app.services.tag_validation import (
    validate_tag_assignment_delta,
    TagValidationError,
)

router = APIRouter(prefix="/tags", tags=["tags"])


@router.post("/")
def create_tag(payload: TagCreate):
    con = get_db()

    con.execute(
        """
        INSERT OR IGNORE INTO tag (
            id,
            label,
            category,
            group_id,
            usage_count,
            last_used
        )
        VALUES (?, ?, ?, ?, 0, NULL)
        """,
        (
            payload.id,
            payload.label,
            payload.category,
            payload.group_id,
        ),
    )

    return {"status": "ok", "tag_id": payload.id}

@router.post("/assign")
def assign_tags(payload: AssignTags):
    """
    Assign one or more tags to a content item.
    Enforces tag group constraints incrementally (e.g. max limits).
    """
    con = get_db()

    # -------------------------------
    # 1. Validate group constraints (incremental)
    # -------------------------------
    try:
        validate_tag_assignment_delta(
            content_id=payload.content_id,
            tag_ids=payload.tag_ids,
        )
    except TagValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # -------------------------------
    # 2. Assign tags (transactional)
    # -------------------------------
    now = datetime.utcnow()

    try:
        con.execute("BEGIN")

        for tag_id in payload.tag_ids:
            rows = con.execute(
                """
                INSERT OR IGNORE INTO content_tag (content_id, tag_id)
                VALUES (?, ?)
                RETURNING tag_id
                """,
                (payload.content_id, tag_id),
            ).fetchall()

            if rows:
                con.execute(
                    """
                    UPDATE tag
                    SET usage_count = usage_count + 1,
                        last_used = ?
                    WHERE id = ?
                    """,
                    (now, tag_id),
                )

        con.execute("COMMIT")

    except Exception as e:
        con.execute("ROLLBACK")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to assign tags: {e}",
        )

    return {
        "status": "ok",
        "content_id": payload.content_id,
        "assigned": payload.tag_ids,
    }

@router.post("/unassign")
def unassign_tags(payload: AssignTags):
    con = get_db()

    try:
        con.execute("BEGIN")

        for tag_id in payload.tag_ids:
            con.execute(
                """
                DELETE FROM content_tag
                WHERE content_id = ? AND tag_id = ?
                """,
                (payload.content_id, tag_id),
            )

            con.execute(
                """
                UPDATE tag
                SET usage_count = GREATEST(usage_count - 1, 0)
                WHERE id = ?
                """,
                (tag_id,),
            )

        con.execute("COMMIT")

    except Exception as e:
        con.execute("ROLLBACK")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to unassign tags: {e}",
        )

    return {
        "status": "ok",
        "content_id": payload.content_id,
        "removed": payload.tag_ids,
    }


@router.get("/search")
def search_tags_endpoint(
    group: str = Query(..., description="Tag group id"),
    q: str | None = Query(None, description="Search query"),
):
    """
    Group-aware tag autocomplete.
    """
    return search_tags(group_id=group, query=q)


@router.post("/ensure")
def ensure_tag_endpoint(payload: EnsureTagRequest):
    """
    Create a tag if it doesn't exist, otherwise return existing.
    """
    return ensure_tag(
        group_id=payload.group_id,
        label=payload.label,
    )

@router.get("/{group_id}")
def get_tags_by_group(group_id: str):
    """
    Debug endpoint: list all tags in a given group.
    """
    con = get_db()

    rows = con.execute(
        """
        SELECT
            id,
            label,
            usage_count,
            last_used
        FROM tag
        WHERE group_id = ?
        ORDER BY usage_count DESC, label
        """,
        (group_id,),
    ).fetchall()

    return [
        {
            "id": r[0],
            "label": r[1],
            "usage_count": r[2],
            "last_used": r[3],
        }
        for r in rows
    ]
