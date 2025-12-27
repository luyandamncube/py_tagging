from app.db import get_db


def validate_content(content_id: str):
    """
    Return validation status for all tag groups for a content item.
    """
    con = get_db()

    rows = con.execute(
        """
        SELECT
            tg.id,
            tg.required,
            tg.min_count,
            tg.max_count,
            COUNT(ct.tag_id) AS tag_count
        FROM tag_group tg
        LEFT JOIN tag t ON t.group_id = tg.id
        LEFT JOIN content_tag ct
          ON ct.tag_id = t.id
         AND ct.content_id = ?
        GROUP BY
            tg.id,
            tg.required,
            tg.min_count,
            tg.max_count,
            tg.position
        ORDER BY tg.position
        """,
        (content_id,),
    ).fetchall()

    groups = []
    missing_required = 0
    over_limit = 0

    for group_id, required, min_c, max_c, count in rows:
        if count < min_c:
            status = "missing"
            if required:
                missing_required += 1
        elif max_c != -1 and count > max_c:
            status = "over_limit"
            over_limit += 1
        else:
            status = "ok"

        groups.append({
            "id": group_id,
            "required": required,
            "min": min_c,
            "max": max_c,
            "count": count,
            "status": status,
        })

    valid = (missing_required == 0 and over_limit == 0)

    return {
        "content_id": content_id,
        "valid": valid,
        "summary": {
            "missing_required": missing_required,
            "over_limit": over_limit,
        },
        "groups": groups,
    }
