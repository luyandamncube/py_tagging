"""
Smoke test: export content to Parquet.
"""

import requests

API_BASE = "http://localhost:8000"


def main():
    url = f"{API_BASE}/export/parquet"

    print(f"📦 POST {url}")

    resp = requests.post(url)
    resp.raise_for_status()

    data = resp.json()

    print("✅ Export complete")
    print(data)


if __name__ == "__main__":
    main()
