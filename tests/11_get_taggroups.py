"""
Smoke test: fetch tag groups.
"""

import requests
import json

API = "http://localhost:8000"


def main():
    url = f"{API}/tag-groups"
    print(f"🔎 GET {url}")

    resp = requests.get(url)
    resp.raise_for_status()

    data = resp.json()

    print(f"\n✅ Retrieved {len(data)} tag groups\n")
    print(json.dumps(data, indent=2))


if __name__ == "__main__":
    main()
