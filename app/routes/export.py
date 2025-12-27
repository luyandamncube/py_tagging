from fastapi import APIRouter
from app.db import get_db
from pathlib import Path

router = APIRouter(prefix="/export", tags=["export"])

@router.post("/parquet")
def export_parquet():
    out = Path("data/exports/content.parquet")
    out.parent.mkdir(parents=True, exist_ok=True)

    con = get_db()
    con.execute(f"""
    COPY (
        SELECT
            c.*,
            list(t.label) AS tags
        FROM content c
        LEFT JOIN content_tag ct ON c.id = ct.content_id
        LEFT JOIN tag t ON ct.tag_id = t.id
        GROUP BY ALL
    )
    TO '{out}'
    (FORMAT PARQUET);
    """)

    return {"exported_to": str(out)}
