import sys
import requests
import json

API = "http://localhost:8000"


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
