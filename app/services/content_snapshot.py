from app.db import get_db
from app.services.content_validation import validate_content


def get_content_snapshot(content_id: str):
    con = get_db()

    # -------------------------
    # Content
    # -------------------------
    row = con.execute(
        """
        SELECT id, url, status, created_at
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
        "status": row[2],
        "created_at": row[3],
    }

    # -------------------------
    # Preview (derived)
    # -------------------------
    preview_row = con.execute(
        """
        SELECT
            preview_type,
            preview_url,
            preview_url_normalized,
            title,
            description,
            preview_status,
            fetched_at
        FROM content_preview
        WHERE content_id = ?
        """,
        (content_id,),
    ).fetchone()


    if preview_row:
        preview = {
            "type": preview_row[0],
            "url": preview_row[1],
            "url_normalized": preview_row[2],
            "title": preview_row[3],
            "description": preview_row[4],
            "status": preview_row[5],
            "fetched_at": preview_row[6],
        }
    else:
        preview = {
            "status": "pending"
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
    # Validation
    # -------------------------
    validation = validate_content(content_id)

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
        "preview": preview,
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
        SELECT
            c.id,
            c.url,
            c.status,
            c.created_at,
            cp.preview_status,
            cp.preview_url,
            cp.preview_url_normalized
        FROM content c
        LEFT JOIN content_preview cp
            ON cp.content_id = c.id
        ORDER BY c.created_at DESC
        """
    ).fetchall()


    items = []

    for row in rows:
        content_id = row[0]

        content = {
            "id": row[0],
            "url": row[1],
            "status": row[2],
            "created_at": row[3],
            "preview": {
                "status": row[4] or "pending",
                "url": row[5],
                "url_normalized" : row[6]
            },
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

