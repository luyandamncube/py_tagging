import sys
import requests
import json

API = "http://localhost:8000"

import re
from app.db import get_db


def slugify(label: str) -> str:
    slug = label.strip().lower()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_-]+", "_", slug)
    return slug


def ensure_tag(group_id: str, label: str):
    con = get_db()

    slug = slugify(label)
    tag_id = f"{group_id}:{slug}"

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
            tag_id,
            label,
            group_id,
            group_id,
        ),
    )

    row = con.execute(
        "SELECT COUNT(*) FROM tag WHERE id = ?",
        (tag_id,),
    ).fetchone()

    created = row[0] == 1

    return {
        "id": tag_id,
        "label": label,
        "group_id": group_id,
        "created": created,
    }

def main():
    if len(sys.argv) < 2:
        print("Usage: python tests/16_search_tags.py <group> [query]")
        sys.exit(1)

    group = sys.argv[1]
    query = sys.argv[2] if len(sys.argv) > 2 else None

    params = {"group": group}
    if query:
        params["q"] = query

    resp = requests.get(f"{API}/tags/search", params=params)
    resp.raise_for_status()

    print(json.dumps(resp.json(), indent=2, default=str))


if __name__ == "__main__":
    main()
