import sys
import requests
import json

API = "http://localhost:8000"


def main():
    if len(sys.argv) != 2:
        print("Usage: python tests/15_get_content_snapshot.py <content-id>")
        sys.exit(1)

    cid = sys.argv[1]

    resp = requests.get(f"{API}/content/{cid}")
    resp.raise_for_status()

    print(json.dumps(resp.json(), indent=2, default=str))


if __name__ == "__main__":
    main()
