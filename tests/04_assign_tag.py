"""
Smoke test: assign one or more tags to a specific content item.

Usage:
    python tests/04_assign_tag.py <content_id> <tag_id> [tag_id ...]

Example: 
    python tests/04_assign_tag.py \
    b5f9279-fc37-40dd-9c94-15cd37d40b79 \
    niche:fitness \
    species:human \
    appearance:silver_skin

"""

import sys
import requests

API_BASE = "http://localhost:8000"


def main():
    if len(sys.argv) < 3:
        print("❌ Usage: python tests/04_assign_tag.py <content_id> <tag_id> [tag_id ...]")
        sys.exit(1)

    content_id = sys.argv[1]
    tag_ids = sys.argv[2:]

    payload = {
        "content_id": content_id,
        "tag_ids": tag_ids,
    }

    url = f"{API_BASE}/tags/assign"

    print(f"🔗 Assigning {len(tag_ids)} tags to content {content_id}")
    print("Tags:", tag_ids)

    resp = requests.post(url, json=payload)
    resp.raise_for_status()

    print("✅ Tags assigned successfully")


if __name__ == "__main__":
    main()
