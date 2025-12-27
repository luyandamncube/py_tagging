"""
Smoke test: create content via POST /content/

Equivalent to:
curl -X POST http://localhost:8000/content/ \
  -H "Content-Type: application/json" \
  -d '{ ... }'
"""

import requests
import json

API_BASE = "http://localhost:8000"


def main():
    payload = {
        "url": "https://example.com/test.jpg",
        "site": "example",
        "creator": "tester",
        "type": "image",
    }

    url = f"{API_BASE}/content/"

    print(f"🚀 POST {url}")
    print(json.dumps(payload, indent=2))

    resp = requests.post(url, json=payload)
    resp.raise_for_status()

    data = resp.json()

    print("\n✅ Content created")
    print(json.dumps(data, indent=2))


if __name__ == "__main__":
    main()
