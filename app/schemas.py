from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID

class AssignTags(BaseModel):
    content_id: str
    tag_ids: List[str]

class ContentCreate(BaseModel):
    url: str
    source_url: Optional[str] = None

class TagCreate(BaseModel):
    id: str
    label: str
    category: str
    group_id: str

class EnsureTagRequest(BaseModel):
    group_id: str
    label: str

class ExpandRequest(BaseModel):
    urls: List[str]