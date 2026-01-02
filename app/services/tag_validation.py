from typing import List
from app.db import get_db


class TagValidationError(Exception):
    pass


def validate_tag_assignment_delta(content_id: str, tag_ids: List[str]):
    """
    Validate that assigning tag_ids to content_id does not violate
    tag group constraints *incrementally*.
    """
    con = get_db()

    if not tag_ids:
        return

    # Map tags → groups
    rows = con.execute(
        f"""
        SELECT id, group_id
        FROM tag
        WHERE id IN ({",".join("?" * len(tag_ids))})
        """,
        tag_ids,
    ).fetchall()

    if len(rows) != len(tag_ids):
        found_ids = {r[0] for r in rows}
        missing = [t for t in tag_ids if t not in found_ids]
        raise TagValidationError(
            f"Unknown tag(s): {', '.join(missing)}"
        )

    tag_to_group = {r[0]: r[1] for r in rows}

    incoming_counts = {}
    for group_id in tag_to_group.values():
        incoming_counts[group_id] = incoming_counts.get(group_id, 0) + 1

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

        # Skip untouched groups
        if incoming == 0 and current == 0:
            continue

        total = current + incoming

        if max_c is not None and total > max_c:
            violations.append(
                f"group '{group_id}' allows at most {max_c} tags"
            )

    if violations:
        raise TagValidationError("; ".join(violations))

def validate_content_completeness(content_id: str):
    """
    Validate that content satisfies all tag group min_count constraints.
    Intended for publish / finalize / export.
    """
    con = get_db()

    rows = con.execute(
        """
        SELECT
            tg.id,
            tg.min_count,
            COUNT(ct.tag_id) AS current_count
        FROM tag_group tg
        LEFT JOIN tag t ON t.group_id = tg.id
        LEFT JOIN content_tag ct
          ON ct.tag_id = t.id
         AND ct.content_id = ?
        GROUP BY tg.id, tg.min_count
        """,
        (content_id,),
    ).fetchall()

    violations = []

    for group_id, min_c, current in rows:
        if min_c is not None and current < min_c:
            violations.append(
                f"group '{group_id}' requires at least {min_c} tags"
            )

    if violations:
        raise TagValidationError("; ".join(violations))

def validate_content_completeness_detailed(content_id: str):
    """
    Return structured per-group completeness validation for content.
    """
    con = get_db()

    rows = con.execute(
        """
        SELECT
            tg.id AS group_id,
            tg.min_count,
            COUNT(ct.tag_id) AS current_count
        FROM tag_group tg
        LEFT JOIN tag t ON t.group_id = tg.id
        LEFT JOIN content_tag ct
          ON ct.tag_id = t.id
         AND ct.content_id = ?
        GROUP BY tg.id, tg.min_count
        """,
        (content_id,),
    ).fetchall()

    results = []
    all_valid = True

    for group_id, min_c, current in rows:
        if min_c is None or min_c == 0:
            valid = True
        else:
            valid = current >= min_c

        if not valid:
            all_valid = False

        results.append({
            "group_id": group_id,
            "min_required": min_c or 0,
            "current": current,
            "valid": valid,
        })

    return {
        "valid": all_valid,
        "groups": results,
    }
