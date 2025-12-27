from fastapi import APIRouter,HTTPException
from uuid import uuid4
from app.db import get_db
from app.schemas import ContentCreate
from app.services.content_validation import validate_content
from app.services.content_snapshot import get_content_snapshot


router = APIRouter(prefix="/content", tags=["content"])

@router.post("/")
def create_content(payload: ContentCreate):
    con = get_db()
    content_id = uuid4()

    con.execute("""
        INSERT INTO content (id, url, site, creator, type)
        VALUES (?, ?, ?, ?, ?)
    """, (content_id, payload.url, payload.site, payload.creator, payload.type))

    return {"id": content_id}

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
