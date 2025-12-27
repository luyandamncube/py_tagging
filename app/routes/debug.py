from fastapi import APIRouter
from app.db import get_db

router = APIRouter(prefix="/debug", tags=["debug"])

@router.get("/content")
def list_content():
    con = get_db()
    rows = con.execute("SELECT * FROM content").fetchall()
    return rows
