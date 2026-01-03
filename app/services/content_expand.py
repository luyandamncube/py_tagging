# app/services/content_expand.py

import requests
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup
import json
import re

from app.services.content_preview import extract_preview_from_url
import logging

logger = logging.getLogger("content_expand")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}


IMAGE_EXTENSIONS = (".jpg", ".jpeg", ".png", ".webp", ".gif")

# --------------------------------------------------
# Provider stubs (safe placeholders)
# --------------------------------------------------

def expand_flickr(url: str) -> list[str]:

    return []
# --------------------------------------------------
# Provider: Imgur
# --------------------------------------------------

def imgur_id_from_url(url: str) -> str | None:
    """
    Extract Imgur ID from image, album, or gallery URLs.

    Handles:
    - /a/<id>
    - /gallery/<id>
    - /gallery/<slug>-<id>
    - /<id>
    """

    path = urlparse(url).path.strip("/")

    # /a/<id> or /gallery/<something>
    parts = path.split("/")

    if parts[0] in {"a", "gallery"} and len(parts) >= 2:
        token = parts[1]
    elif len(parts) == 1:
        token = parts[0]
    else:
        return None

    # Slugged form: extract trailing -<ID>
    match = re.search(r"([a-zA-Z0-9]{5,8})$", token)
    if match:
        return match.group(1)

    return None


def expand_imgur(url: str) -> list[str]:
    """
    Expand Imgur gallery / album / image URLs.
    Uses unauthenticated gallery JSON endpoints.
    """

    # Direct image URL
    if urlparse(url).netloc.startswith("i.imgur.com"):
        return [url]

    imgur_id = imgur_id_from_url(url)
    if not imgur_id:
        return []

    images: list[str] = []

    # --------------------------------------------------
    # 1️⃣ Gallery JSON (most reliable)
    # --------------------------------------------------
    gallery_url = f"https://imgur.com/gallery/{imgur_id}.json"
    try:
        res = requests.get(
            gallery_url,
            headers={**HEADERS, "Accept": "application/json"},
            timeout=10,
        )

        if res.ok:
            data = res.json()
            items = data.get("data", {}).get("images", [])

            if isinstance(items, list):
                for img in items:
                    link = img.get("link")
                    if link:
                        images.append(link)

            if images:
                return images
    except Exception:
        pass

    # --------------------------------------------------
    # 2️⃣ Single image JSON fallback
    # --------------------------------------------------
    image_url = f"https://imgur.com/image/{imgur_id}.json"
    try:
        res = requests.get(
            image_url,
            headers={**HEADERS, "Accept": "application/json"},
            timeout=10,
        )

        if res.ok:
            data = res.json()
            link = data.get("data", {}).get("link")
            if link:
                return [link]
    except Exception:
        pass

    return []

# --------------------------------------------------
# Provider: Artisan
# --------------------------------------------------

def artstation_project_id(url: str) -> str | None:
    """
    ArtStation artwork URLs typically look like:
      https://www.artstation.com/artwork/<ID>
    where <ID> is something like K3GgL4.
    """
    path = urlparse(url).path.strip("/")
    parts = path.split("/")
    if len(parts) >= 2 and parts[0] == "artwork":
        return parts[1]
    return None

def expand_artstation(url: str) -> list[str]:
    logger.info("\n[ArtStation] Expanding:", url)

    """
    Robust ArtStation expander.

    Strategy:
    1) Prefer ArtStation's project JSON endpoint:
         https://www.artstation.com/projects/<ID>.json
    2) Fallback: parse Next.js __NEXT_DATA__ if present
    """

    proj_id = artstation_project_id(url)

    # --------------------------------------------------
    # 1) JSON endpoint (preferred)
    # --------------------------------------------------
    if proj_id:
        api_url = f"https://www.artstation.com/projects/{proj_id}.json"
        try:
            res = requests.get(
                api_url,
                headers={**HEADERS, "Accept": "application/json"},
                timeout=10,
            )

            logger.info("[ArtStation] JSON status:", res.status_code)
            logger.info("[ArtStation] JSON content-type:", res.headers.get("Content-Type"))
            logger.info("[ArtStation] JSON body (first 300 chars):")
            logger.info(res.text[:300])

            if res.ok:
                data = res.json()
                assets = data.get("assets", [])
                logger.info("[ArtStation] assets count:", len(assets))

                assets = data.get("assets", [])
                if isinstance(assets, list):
                    images: list[str] = []
                    for asset in assets:
                        if not isinstance(asset, dict):
                            continue
                        img = asset.get("image_url")
                        if img:
                            images.append(img)

                    # Deduplicate preserve order
                    seen = set()
                    out = []
                    for u in images:
                        if u not in seen:
                            seen.add(u)
                            out.append(u)
                    return out
        except Exception:
            pass

    # --------------------------------------------------
    # 2) Fallback: HTML -> __NEXT_DATA__
    # --------------------------------------------------
    html = fetch_html(url)
    if html:
        logger.info("[ArtStation] HTML length:", len(html))
        logger.info("[ArtStation] HTML snippet:")
        logger.info(html[:300])


    soup = BeautifulSoup(html, "html.parser")
    script = soup.find("script", id="__NEXT_DATA__")

    if script and script.string:
        try:
            data = json.loads(script.string)
            artwork = (
                data.get("props", {})
                .get("pageProps", {})
                .get("artwork", {})
            )
            assets = artwork.get("assets", [])
            if isinstance(assets, list):
                images: list[str] = []
                for asset in assets:
                    if not isinstance(asset, dict):
                        continue
                    img = asset.get("image_url")
                    if img:
                        images.append(img)

                seen = set()
                out = []
                for u in images:
                    if u not in seen:
                        seen.add(u)
                        out.append(u)
                return out
        except Exception:
            return []

    return []

# --------------------------------------------------
# Provider registry
# --------------------------------------------------

GALLERY_HANDLERS = {
    "imgur.com": expand_imgur,
    "flickr.com": expand_flickr,
    "artstation.com": expand_artstation,
}


# --------------------------------------------------
# Helpers
# --------------------------------------------------

def get_provider_handler(url: str):
    host = urlparse(url).netloc.lower()

    for domain, handler in GALLERY_HANDLERS.items():
        if domain in host:
            return handler

    return None


def is_image_url(url: str) -> bool:
    path = urlparse(url).path.lower()
    return path.endswith(IMAGE_EXTENSIONS)


def fetch_html(url: str) -> str | None:
    try:
        res = requests.get(url, headers=HEADERS, timeout=8)
        if not res.ok or "text/html" not in res.headers.get("Content-Type", ""):
            return None
        return res.text
    except Exception:
        return None


def extract_images_from_html(html: str, base_url: str) -> list[str]:
    soup = BeautifulSoup(html, "html.parser")

    urls: list[str] = []

    # OpenGraph hint
    og = soup.find("meta", property="og:image")
    if og and og.get("content"):
        urls.append(urljoin(base_url, og["content"]))

    # <img> tags
    for img in soup.find_all("img"):
        src = img.get("src") or img.get("data-src")
        if not src:
            continue

        abs_url = urljoin(base_url, src)
        if is_image_url(abs_url):
            urls.append(abs_url)

    # Deduplicate (preserve order)
    seen = set()
    out = []
    for u in urls:
        if u not in seen:
            seen.add(u)
            out.append(u)

    return out


# --------------------------------------------------
# Generic expansion fallback
# --------------------------------------------------

def expand_generic(url: str) -> list[str]:
    """
    Generic expansion:
    - direct image URL → single item
    - HTML page → extract <img> + og:image
    """

    if is_image_url(url):
        return [url]

    html = fetch_html(url)
    if not html:
        return []

    return extract_images_from_html(html, url)


# --------------------------------------------------
# Core expansion logic
# --------------------------------------------------

def expand_url(url: str) -> dict:
    handler = get_provider_handler(url)

    # 1️⃣ Provider-specific expansion
    if handler:
        media_urls = handler(url)
    else:
        media_urls = expand_generic(url)

    if not media_urls:
        return {
            "input_url": url,
            "type": "unknown",
            "items": [],
        }

    items = []
    for media_url in media_urls:
        preview = extract_preview_from_url(media_url)

        items.append({
            "url": media_url,
            "preview_type": preview["preview_type"],
            "preview_url": preview["preview_url"],
            "preview_url_normalized": preview["preview_url_normalized"],
            "source_url": url,
        })

    return {
        "input_url": url,
        "type": "gallery" if len(items) > 1 else "single",
        "items": items,
    }


def expand_urls(urls: list[str]) -> list[dict]:
    return [expand_url(url) for url in urls]
