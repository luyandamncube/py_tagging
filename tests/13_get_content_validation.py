"""
Smoke test: fetch validation status for a content item.

Usage:
    python tests/13_get_content_validation.py <content-id>
"""

import sys
import requests
import json

API = "http://localhost:8000"


def main():
    if len(sys.argv) != 2:
        print("❌ Usage: python tests/13_get_content_validation.py <content-id>")
        sys.exit(1)

    content_id = sys.argv[1]

    url = f"{API}/content/{content_id}/validation"
    print(f"🔎 GET {url}")

    resp = requests.get(url)
    resp.raise_for_status()

    data = resp.json()

    print(json.dumps(data, indent=2))


if __name__ == "__main__":
    main()
