"""
Bulk content creation test.

Usage:
    python3 tests/01_create_bulk_content.py 50
"""

import sys
import requests
from requests.exceptions import Timeout, RequestException

API_BASE = "http://localhost:8000"
TIMEOUT_SECONDS = 10


def main():
    if len(sys.argv) != 2:
        print("Usage: python3 tests/01_create_bulk_content.py <count>")
        sys.exit(1)

    try:
        count = int(sys.argv[1])
    except ValueError:
        print("❌ Count must be an integer")
        sys.exit(1)

    if count <= 0:
        print("❌ Count must be > 0")
        sys.exit(1)

    items = [
        {
            "url": f"https://example.com/bulk_item_{i+1}.jpg",
            "type": "image",
        }
        for i in range(count)
    ]

    payload = {"items": items}

    print(f"🚀 Creating {count} bulk content items...")
    print(f"⏱  Timeout set to {TIMEOUT_SECONDS}s")

    try:
        resp = requests.post(
            f"{API_BASE}/content/bulk",
            json=payload,
            timeout=TIMEOUT_SECONDS,
        )

    except Timeout:
        print("⏱️  Request timed out.")
        print(
            "   The server may still be processing the request in the background."
        )
        print(
            "   Check /debug/content/count to confirm how many items were created."
        )
        return

    except RequestException as e:
        print("❌ Request failed")
        print(f"   {e}")
        return

    if not resp.ok:
        print("❌ Server returned an error")
        print(f"   Status: {resp.status_code}")
        print(f"   Body:   {resp.text}")
        return

    data = resp.json()

    print("✅ Bulk insert successful")
    print(f"   Created: {data.get('created')}")
    print(f"   First ID: {data.get('ids', [None])[0]}")
    print(f"   Last ID:  {data.get('ids', [None])[-1]}")


if __name__ == "__main__":
    main()
