import requests

API = "http://localhost:8000"

with open(".taggroups", "rb") as f:
    resp = requests.post(
        f"{API}/tag-groups/import",
        files={"file": f},
    )

resp.raise_for_status()
print(resp.json())
