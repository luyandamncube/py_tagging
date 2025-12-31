import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse, urlunparse
from datetime import datetime
from app.db import get_db


HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; PicVidTags/1.0)"
}

def normalize_image_url(url: str | None) -> str | None:
    """
    Strip query params from image URLs.
    Safe for static CDN-hosted images.
    """
    if not url:
        return None

    parsed = urlparse(url)
    return urlunparse(parsed._replace(query=""))

def _get_meta(soup, *, prop=None, name=None):
    if prop:
        tag = soup.find("meta", property=prop)
    elif name:
        tag = soup.find("meta", attrs={"name": name})
    else:
        return None

    return tag["content"].strip() if tag and tag.get("content") else None


def extract_preview_from_url(url: str) -> dict:
    """
    Extract preview metadata from a webpage using OG / Twitter tags.
    HTML-only, no JS execution.
    """

    r = requests.get(url, headers=HEADERS, timeout=10)
    r.raise_for_status()

    soup = BeautifulSoup(r.text, "html.parser")

    image = (
        _get_meta(soup, prop="og:image")
        or _get_meta(soup, name="twitter:image")
    )

    video = (
        _get_meta(soup, prop="og:video")
        or _get_meta(soup, name="twitter:player")
    )

    title = (
        _get_meta(soup, prop="og:title")
        or _get_meta(soup, name="twitter:title")
        or (soup.title.string.strip() if soup.title else None)
    )

    description = (
        _get_meta(soup, prop="og:description")
        or _get_meta(soup, name="twitter:description")
        or _get_meta(soup, name="description")
    )

    preview_type = "unknown"
    preview_url = None
    preview_url_normalized = None

    if video:
        preview_type = "video"
        preview_url = urljoin(url, video)

    elif image:
        preview_type = "image"
        preview_url = urljoin(url, image)
        preview_url_normalized = normalize_image_url(preview_url)

    else:
        preview_type = "page"

    return {
        "preview_type": preview_type,
        "preview_url": preview_url,
        "preview_url_normalized": preview_url_normalized,
        "title": title,
        "description": description,
    }

def build_and_store_preview(content_id: str, source_url: str) -> dict:
    con = get_db()

    try:
        preview = extract_preview_from_url(source_url)
        status = "ready"
    except Exception:
        preview = {
            "preview_type": "unknown",
            "preview_url": None,
            "preview_url_normalized": None,
            "title": None,
            "description": None,
        }
        status = "failed"

    con.execute(
        """
        INSERT INTO content_preview (
            content_id,
            preview_type,
            preview_url,
            preview_url_normalized,
            title,
            description,
            preview_status,
            fetched_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(content_id) DO UPDATE SET
            preview_type = excluded.preview_type,
            preview_url = excluded.preview_url,
            preview_url_normalized = excluded.preview_url_normalized,
            title = excluded.title,
            description = excluded.description,
            preview_status = excluded.preview_status,
            fetched_at = excluded.fetched_at
        """,
        (
            content_id,
            preview["preview_type"],
            preview["preview_url"],
            preview["preview_url_normalized"],
            preview["title"],
            preview["description"],
            status,
            datetime.utcnow(),
        ),
    )

    preview["preview_status"] = status
    return preview
