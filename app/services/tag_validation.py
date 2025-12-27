from typing import List
from app.db import get_db


class TagValidationError(Exception):
    pass


def validate_tag_assignment(content_id: str, tag_ids: List[str]):
    """
    Validate that assigning tag_ids to content_id does not violate
    tag group min/max constraints.
    """
    con = get_db()

    # Map incoming tags → group_id
    rows = con.execute(
        """
        SELECT id, group_id
        FROM tag
        WHERE id IN ({})
        """.format(",".join("?" * len(tag_ids))),
        tag_ids,
    ).fetchall()

    if len(rows) != len(tag_ids):
        found_ids = {r[0] for r in rows}
        missing = [t for t in tag_ids if t not in found_ids]
        raise TagValidationError(
            f"Unknown tag(s): {', '.join(missing)}"
        )
    
    tag_to_group = {r[0]: r[1] for r in rows}

    # Count incoming tags per group
    incoming_counts = {}
    for group_id in tag_to_group.values():
        incoming_counts[group_id] = incoming_counts.get(group_id, 0) + 1

    # Fetch existing counts per group for this content
    rows = con.execute(
        """
        SELECT
            tg.id,
            tg.min_count,
            tg.max_count,
            COUNT(ct.tag_id) AS current_count
        FROM tag_group tg
        LEFT JOIN tag t ON t.group_id = tg.id
        LEFT JOIN content_tag ct
          ON ct.tag_id = t.id
         AND ct.content_id = ?
        GROUP BY tg.id, tg.min_count, tg.max_count
        """,
        (content_id,),
    ).fetchall()

    violations = []

    for group_id, min_c, max_c, current in rows:
        incoming = incoming_counts.get(group_id, 0)
        total = current + incoming

        if total < min_c:
            violations.append(
                f"group '{group_id}' requires at least {min_c} tags"
            )

        # if max_c != -1 and total > max_c:
        if max_c is not None and total > max_c:

            violations.append(
                f"group '{group_id}' allows at most {max_c} tags"
            )

    if violations:
        raise TagValidationError("; ".join(violations))
