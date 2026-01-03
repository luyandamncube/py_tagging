import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse, urlunparse
from datetime import datetime

from app.db import get_db

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; PicVidTags/1.0)"
}

IMAGE_EXTENSIONS = (".jpg", ".jpeg", ".png", ".webp", ".gif")
VIDEO_EXTENSIONS = (".mp4", ".webm", ".mov")


# --------------------------------------------------
# Utilities
# --------------------------------------------------

def is_image_url(url: str) -> bool:
    path = urlparse(url).path.lower()
    return path.endswith(IMAGE_EXTENSIONS)


def is_video_url(url: str) -> bool:
    path = urlparse(url).path.lower()
    return path.endswith(VIDEO_EXTENSIONS)


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


# --------------------------------------------------
# Preview extraction
# --------------------------------------------------

def extract_preview_from_url(url: str) -> dict:
    """
    Resolve preview metadata for a URL.

    - Direct image/video URLs short-circuit
    - HTML pages use OG / Twitter metadata
    """

    # --------------------------------------------------
    # 1️⃣ Direct image URL
    # --------------------------------------------------
    if is_image_url(url):
        return {
            "preview_type": "image",
            "preview_url": url,
            "preview_url_normalized": normalize_image_url(url),
            "title": None,
            "description": None,
        }

    # --------------------------------------------------
    # 2️⃣ Direct video URL
    # --------------------------------------------------
    if is_video_url(url):
        return {
            "preview_type": "video",
            "preview_url": url,
            "preview_url_normalized": None,
            "title": None,
            "description": None,
        }

    # --------------------------------------------------
    # 3️⃣ HTML page
    # --------------------------------------------------
    r = requests.get(url, headers=HEADERS, timeout=10)
    r.raise_for_status()

    content_type = r.headers.get("Content-Type", "")
    if "text/html" not in content_type:
        return {
            "preview_type": "unknown",
            "preview_url": None,
            "preview_url_normalized": None,
            "title": None,
            "description": None,
        }

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

    if video:
        return {
            "preview_type": "video",
            "preview_url": urljoin(url, video),
            "preview_url_normalized": None,
            "title": title,
            "description": description,
        }

    if image:
        preview_url = urljoin(url, image)
        return {
            "preview_type": "image",
            "preview_url": preview_url,
            "preview_url_normalized": normalize_image_url(preview_url),
            "title": title,
            "description": description,
        }

    return {
        "preview_type": "page",
        "preview_url": None,
        "preview_url_normalized": None,
        "title": title,
        "description": description,
    }


# --------------------------------------------------
# DB integration
# --------------------------------------------------

def build_and_store_preview(content_id: str, source_url: str) -> dict:
    con = get_db()

    try:
        preview = extract_preview_from_url(source_url)

        status = (
            "ready"
            if preview["preview_type"] != "unknown"
            else "failed"
        )

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
