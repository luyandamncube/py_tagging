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

@router.get("/")
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

@router.get("/with-tags")
def list_tag_groups_with_tags():
    con = get_db()

    rows = con.execute(
        """
        SELECT
            tg.id            AS group_id,
            tg.description,
            tg.required,
            tg.min_count,
            tg.max_count,
            tg.position,

            t.id             AS tag_id,
            t.label,
            t.usage_count,
            t.last_used

        FROM tag_group tg
        LEFT JOIN tag t
          ON t.group_id = tg.id

        ORDER BY
            tg.position ASC,
            t.usage_count DESC NULLS LAST,
            t.label ASC
        """
    ).fetchall()

    groups = {}
    
    for (
        group_id,
        description,
        required,
        min_count,
        max_count,
        position,
        tag_id,
        label,
        usage_count,
        last_used,
    ) in rows:

        if group_id not in groups:
            groups[group_id] = {
                "id": group_id,
                "description": description,
                "required": required,
                "min": min_count,
                "max": max_count,
                "position": position,
                "tags": [],
            }

        if tag_id:
            groups[group_id]["tags"].append({
                "id": tag_id,
                "label": label,
                "usage_count": usage_count,
                "last_used": last_used,
            })

    return list(groups.values())

