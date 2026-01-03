import requests
import json

API_BASE = "http://localhost:8000"


def run_expand_test(name: str, urls: list[str]):
    print(f"\n🧪 {name}")
    print("=" * 60)

    res = requests.post(
        f"{API_BASE}/content/expand",
        json={"urls": urls},
        timeout=30,
    )

    if not res.ok:
        print("❌ Request failed")
        print(res.status_code, res.text)
        return

    data = res.json()

    for r in data["results"]:
        print(f"\n🔗 Input URL: {r['input_url']}")
        print(f"   Type: {r['type']}")
        print(f"   Items: {len(r['items'])}")

        for i, item in enumerate(r["items"][:5]):
            print(f"     [{i+1}] {item['url']}")

        if len(r["items"]) > 5:
            print(f"     … +{len(r['items']) - 5} more")

    print("\n✅ Done\n")
