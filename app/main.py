from fastapi import FastAPI
# from app.db import init_db
from app.db import get_db
from app.routes import content, tags, export, debug, tag_groups



app = FastAPI(title="Pic-Vid Tags API")

# init_db()

app.include_router(content.router)
app.include_router(tags.router)
app.include_router(export.router)
app.include_router(debug.router)
app.include_router(tag_groups.router)

