from fastapi import APIRouter, UploadFile
from pathlib import Path
import tempfile

from app.db import get_db
from app.services.taggroups import parse_taggroups

router = APIRouter(
    prefix="/tag-groups",
    tags=["tag-groups"],
)


@router.post("/import")
def import_tag_groups(file: UploadFile):
    """
    Import tag group definitions from a .taggroups file.
    """
    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        tmp.write(file.file.read())
        tmp_path = Path(tmp.name)

    groups = parse_taggroups(tmp_path)

    con = get_db()

    for g in groups:
        con.execute(
            """
            INSERT OR REPLACE INTO tag_group
            (id, description, required, min_count, max_count, position)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                g["id"],
                g["description"],
                g["required"],
                g["min_count"],
                g["max_count"],
                g["position"],
            ),
        )

    return {
        "imported": len(groups),
        "groups": [g["id"] for g in groups],
    }

@router.get("")
def list_tag_groups():
    """
    List all tag groups in display order.
    """
    con = get_db()

    rows = con.execute(
        """
        SELECT
            id,
            description,
            required,
            min_count,
            max_count,
            position
        FROM tag_group
        ORDER BY position
        """
    ).fetchall()

    return [
        {
            "id": r[0],
            "description": r[1],
            "required": r[2],
            "min": r[3],
            "max": r[4],
            "position": r[5],
        }
        for r in rows
    ]
