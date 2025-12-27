"""
Quick smoke test: fetch content from the API.

Usage:
    python tests/01_get_content.py
"""

import requests
import json

API_BASE = "http://localhost:8000"


def main():
    url = f"{API_BASE}/debug/content"

    print(f"🔎 Fetching content from {url}")

    resp = requests.get(url)
    resp.raise_for_status()

    data = resp.json()

    print(f"\n✅ Retrieved {len(data)} rows\n")
    print(json.dumps(data, indent=2, default=str))


if __name__ == "__main__":
    main()
