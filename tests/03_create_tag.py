"""
Smoke test: create a tag via POST /tags/
"""

import requests
import json

API_BASE = "http://localhost:8000"


def main():
    payload = {
        "id": "niche:fitness",
        "label": "Fitness",
        "category": "niche",
    }

    url = f"{API_BASE}/tags/"

    print(f"🏷️  POST {url}")
    print(json.dumps(payload, indent=2))

    resp = requests.post(url, json=payload)
    resp.raise_for_status()

    print("\n✅ Tag created (or already existed)")
    print(resp.json())


if __name__ == "__main__":
    main()
