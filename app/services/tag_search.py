from app.db import get_db


def search_tags(group_id: str, query: str | None, limit: int = 10):
    q = query.lower()
    max_distance = max(2, len(q) // 2)

    con = get_db()

    # ------------------------------------
    # No query → top used
    # ------------------------------------
    if not query:
        rows = con.execute(
            """
            SELECT
                id,
                label,
                usage_count,
                last_used
            FROM tag
            WHERE group_id = ?
            ORDER BY
                usage_count DESC,
                last_used DESC
            LIMIT ?
            """,
            (group_id, limit),
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

    # ------------------------------------
    # Prefix + fuzzy ranking (FIXED)
    # ------------------------------------
    q = query.lower()

    rows = con.execute(
        """
        SELECT
            id,
            label,
            usage_count,
            last_used,
            CASE
                WHEN lower(label) LIKE ? THEN 1
                ELSE 0
            END AS prefix_match,
            editdist3(
                replace(lower(label), ' ', '_'),
                ?
            ) AS distance
        FROM tag
        WHERE group_id = ?
        AND (
            lower(label) LIKE ?
            OR editdist3(
                replace(lower(label), ' ', '_'),
                ?
            ) <= ?
        )
        ORDER BY
            prefix_match DESC,
            distance ASC,
            usage_count DESC,
            last_used DESC
        LIMIT ?
        """,
        (
            f"{q}%",
            q,
            group_id,
            f"{q}%",
            q,
            max_distance,
            limit,
        ),
    ).fetchall()


    return [
        {
            "id": r[0],
            "label": r[1],
            "usage_count": r[2],
            "last_used": r[3],
            "distance": r[5],
        }
        for r in rows
    ]
