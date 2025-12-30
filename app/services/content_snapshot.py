from app.db import get_db
from app.services.content_validation import validate_content


def get_content_snapshot(content_id: str):
    con = get_db()

    # -------------------------
    # Content
    # -------------------------
    row = con.execute(
        """
        SELECT id, url, site, creator, type, status, created_at
        FROM content
        WHERE id = ?
        """,
        (content_id,),
    ).fetchone()

    if row is None:
        return None

    content = {
        "id": row[0],
        "url": row[1],
        "site": row[2],
        "creator": row[3],
        "type": row[4],
        "status" : row[5],
        "created_at": row[6],
    }

    # -------------------------
    # Tags (grouped)
    # -------------------------
    rows = con.execute(
        """
        SELECT
            tg.id AS group_id,
            t.id AS tag_id,
            t.label
        FROM content_tag ct
        JOIN tag t ON t.id = ct.tag_id
        JOIN tag_group tg ON tg.id = t.group_id
        WHERE ct.content_id = ?
        ORDER BY tg.position, t.usage_count DESC
        """,
        (content_id,),
    ).fetchall()

    tags = {}
    for group_id, tag_id, label in rows:
        tags.setdefault(group_id, []).append(
            {"id": tag_id, "label": label}
        )

    # -------------------------
    # Validation (reuse existing)
    # -------------------------
    validation = validate_content(content_id)

    # Completion %
    total_required = sum(
        1 for g in validation["groups"] if g["required"]
    )
    satisfied = sum(
        1
        for g in validation["groups"]
        if g["required"] and g["status"] == "ok"
    )

    completion_pct = (
        int((satisfied / total_required) * 100)
        if total_required > 0
        else 100
    )

    missing_required_groups = [
        g["id"]
        for g in validation["groups"]
        if g["required"] and g["status"] == "missing"
    ]

    return {
        "content": content,
        "tags": tags,
        "validation": {
            "valid": validation["valid"],
            "completion_pct": completion_pct,
            "missing_required_groups": missing_required_groups,
            "summary": validation["summary"],
        },
    }

def list_content_snapshots():
    con = get_db()

    rows = con.execute(
        """
        SELECT id, url, site, creator, type, status, created_at
        FROM content
        ORDER BY created_at DESC
        """
    ).fetchall()

    items = []

    for row in rows:
        content_id = row[0]

        content = {
            "id": row[0],
            "url": row[1],
            "site": row[2],
            "creator": row[3],
            "type": row[4],
            "status": row[5],
            "created_at": row[6],
        }

        tag_rows = con.execute(
            """
            SELECT
                t.id,
                t.label,
                tg.id AS group_id
            FROM content_tag ct
            JOIN tag t ON t.id = ct.tag_id
            JOIN tag_group tg ON tg.id = t.group_id
            WHERE ct.content_id = ?
            ORDER BY tg.position, t.usage_count DESC
            """,
            (content_id,),
        ).fetchall()

        tags = [
            {
                "id": tag_id,
                "label": label,
                "group_id": group_id,
            }
            for tag_id, label, group_id in tag_rows
        ]

        items.append({
            **content,
            "tags": tags,
        })

    return items
