import sys
import requests
import json

API = "http://localhost:8000"


def main():
    if len(sys.argv) != 3:
        print("Usage: python tests/17_ensure_tag.py <group> <label>")
        sys.exit(1)

    group = sys.argv[1]
    label = sys.argv[2]

    resp = requests.post(
        f"{API}/tags/ensure",
        json={
            "group_id": group,
            "label": label,
        },
    )

    resp.raise_for_status()
    print(json.dumps(resp.json(), indent=2))


if __name__ == "__main__":
    main()
