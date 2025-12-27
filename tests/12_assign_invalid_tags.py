"""
Smoke test: attempt to assign invalid tags to a content item.

Usage:
    python tests/12_assign_invalid_tags.py <content-id>
"""

import sys
import requests

API = "http://localhost:8000"


def main():
    if len(sys.argv) != 2:
        print("❌ Usage: python tests/12_assign_invalid_tags.py <content-id>")
        sys.exit(1)

    content_id = sys.argv[1]

    payload = {
        "content_id": content_id,
        # Example: violates species max=1 rule
        "tag_ids": [
            "species:human",
            "species:alien",
        ],
    }

    print(f"🚫 Assigning invalid tags to content {content_id}")

    resp = requests.post(
        f"{API}/tags/assign",
        json=payload,
    )

    print(f"Status: {resp.status_code}")
    print(resp.text)


if __name__ == "__main__":
    main()
