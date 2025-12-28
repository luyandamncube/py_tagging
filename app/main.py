from fastapi import FastAPI
# from app.db import init_db
from app.db import get_db
from app.routes import content, tags, export, debug, tag_groups
from fastapi.middleware.cors import CORSMiddleware
from app.services.taggroup_loader import seed_taggroups

app = FastAPI(title="Pic-Vid Tags API")

@app.on_event("startup")
def startup():
    seed_taggroups()

# init_db()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React UI
        "http://localhost:5173",  # Vite direct (optional)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(content.router)
app.include_router(tags.router)
app.include_router(export.router)
app.include_router(debug.router)
app.include_router(tag_groups.router)

