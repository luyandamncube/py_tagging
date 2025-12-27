from fastapi import APIRouter, HTTPException, Query
from datetime import datetime

from app.db import get_db
from app.schemas import TagCreate, AssignTags, EnsureTagRequest
from app.services.tag_search import search_tags
from app.services.tag_ensure import ensure_tag
from app.services.tag_validation import (
    validate_tag_assignment,
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
    Assign one or more tags to a content item,
    enforcing tag group min/max constraints.
    """
    con = get_db()

    # -------------------------------
    # 0. Ensure all tags exist
    # -------------------------------
    placeholders = ",".join("?" * len(payload.tag_ids))
    rows = con.execute(
        f"""
        SELECT id
        FROM tag
        WHERE id IN ({placeholders})
        """,
        payload.tag_ids,
    ).fetchall()

    existing_ids = {r[0] for r in rows}
    missing_ids = set(payload.tag_ids) - existing_ids

    if missing_ids:
        raise HTTPException(
            status_code=400,
            detail=(
                "Unknown tag(s): "
                + ", ".join(sorted(missing_ids))
                + ". Create them first via /tags/ensure."
            ),
        )

    # -------------------------------
    # 1. Validate group constraints
    # -------------------------------
    try:
        validate_tag_assignment(
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
            # Idempotent content-tag assignment
            con.execute(
                """
                INSERT OR IGNORE INTO content_tag (
                    content_id,
                    tag_id
                )
                VALUES (?, ?)
                """,
                (
                    payload.content_id,
                    tag_id,
                ),
            )

            # Update tag usage metadata
            con.execute(
                """
                UPDATE tag
                SET
                    usage_count = usage_count + 1,
                    last_used = ?
                WHERE id = ?
                """,
                (
                    now,
                    tag_id,
                ),
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
