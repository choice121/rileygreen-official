"""
Merch crawler — crawl4ai on the official Riley Green store.

Tries multiple known store URLs with multiple CSS extraction schemas.

Populates:
  • merch_items (name, description, price, image, category,
                 shop_url, is_available, is_featured)
"""

import asyncio
import json
import logging
import re

from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode
from crawl4ai.extraction_strategy import JsonCssExtractionStrategy

from config import Config
from supabase_client import SupabaseClient
from utils import truncate

logger = logging.getLogger(__name__)

STORE_URLS = [
    "https://store.rileygreen.com/",
    "https://www.rileygreen.com/store/",
    "https://rileygreen.com/store/",
]

# Multiple schema attempts — different stores use different markup
LISTING_SCHEMAS = [
    # Shopify-style product grid
    {
        "name": "Products",
        "baseSelector": ".product-item, .grid-item, .product-card, .product-grid-item",
        "fields": [
            {"name": "name", "selector": ".product-item__title, .product-title, h3, h4, .grid-item__title", "type": "text"},
            {"name": "price", "selector": ".price, .product-price, .money", "type": "text"},
            {"name": "image", "selector": "img", "type": "attribute", "attribute": "src"},
            {"name": "url", "selector": "a", "type": "attribute", "attribute": "href"},
            {"name": "description", "selector": ".product-item__description, p", "type": "text"},
        ],
    },
    # Generic e-commerce grid
    {
        "name": "Products",
        "baseSelector": "li[class*='product'], div[class*='product'], article[class*='product']",
        "fields": [
            {"name": "name", "selector": "h2, h3, h4, [class*='title'], [class*='name']", "type": "text"},
            {"name": "price", "selector": "[class*='price'], [class*='cost']", "type": "text"},
            {"name": "image", "selector": "img", "type": "attribute", "attribute": "src"},
            {"name": "url", "selector": "a", "type": "attribute", "attribute": "href"},
        ],
    },
]

CATEGORY_KEYWORDS = {
    "apparel": ["shirt", "tee", "hoodie", "sweatshirt", "jacket", "flannel", "tank", "long sleeve", "crewneck", "zip"],
    "hat": ["hat", "cap", "trucker", "snapback", "beanie"],
    "vinyl": ["vinyl", "record", "lp", "album"],
    "poster": ["poster", "print", "flag", "banner"],
    "accessories": ["cup", "mug", "bottle", "bag", "tote", "keychain", "patch", "sticker", "pin", "phone"],
    "bundle": ["bundle", "package", "set", "collection"],
}


def _infer_category(name: str) -> str:
    name_lower = name.lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        if any(k in name_lower for k in keywords):
            return category
    return "accessories"


def _parse_price(price_str: str | None) -> float:
    if not price_str:
        return 0.0
    m = re.search(r"[\d,]+\.?\d*", price_str.replace(",", ""))
    return float(m.group()) if m else 0.0


def _normalize_url(url: str, base: str) -> str:
    if not url:
        return base
    if url.startswith("//"):
        return "https:" + url
    if url.startswith("/"):
        from urllib.parse import urlparse
        parsed = urlparse(base)
        return f"{parsed.scheme}://{parsed.netloc}{url}"
    if url.startswith("http"):
        return url
    return base


def _fallback_parse_markdown(markdown: str, store_url: str) -> list[dict]:
    """Extract product links from markdown as fallback."""
    records = []
    pattern = re.compile(r"\[([^\]]{3,100})\]\((https?://[^\)]+)\)")
    seen = set()
    for m in pattern.finditer(markdown):
        name = m.group(1).strip()
        url = m.group(2).strip()
        if store_url.split("/")[2] in url and name not in seen:
            seen.add(name)
            records.append({
                "name": name,
                "url": url,
                "price": None,
                "image": None,
                "description": "",
            })
    return records[:30]


async def run() -> dict:
    db = SupabaseClient()
    stats = {"merch_items": 0, "errors": []}

    browser_config = BrowserConfig(headless=True, verbose=False)

    async with AsyncWebCrawler(config=browser_config) as crawler:
        raw_products: list[dict] = []
        store_base = STORE_URLS[0]

        for store_url in STORE_URLS:
            logger.info("Trying store URL: %s", store_url)
            success = False

            for schema in LISTING_SCHEMAS:
                try:
                    strategy = JsonCssExtractionStrategy(schema, verbose=False)
                    result = await crawler.arun(
                        url=store_url,
                        config=CrawlerRunConfig(
                            extraction_strategy=strategy,
                            cache_mode=CacheMode.BYPASS,
                            wait_for="css:[class*='product']",
                            page_timeout=25000,
                        ),
                    )

                    if result.success and result.extracted_content:
                        items = json.loads(result.extracted_content)
                        valid = [i for i in items if i.get("name") and len(i.get("name", "")) > 2]
                        if valid:
                            raw_products = valid
                            store_base = store_url
                            success = True
                            logger.info("  Found %d products via CSS extraction", len(raw_products))
                            break

                    # Markdown fallback
                    if result.success and result.markdown and not success:
                        raw_products = _fallback_parse_markdown(result.markdown, store_url)
                        if raw_products:
                            store_base = store_url
                            success = True
                            logger.info("  Found %d products via markdown fallback", len(raw_products))
                            break

                except Exception as exc:
                    logger.warning("Schema attempt failed for %s: %s", store_url, exc)

            if success:
                break
            await asyncio.sleep(1)

        if not raw_products:
            logger.warning("No merch products found from any store URL")
            return stats

        # Transform and upsert
        records = []
        featured_count = 0
        for item in raw_products[:50]:
            name = (item.get("name") or "").strip()
            if not name:
                continue
            price = _parse_price(item.get("price"))
            shop_url = _normalize_url(item.get("url", ""), store_base)
            image = item.get("image") or None
            # Fix relative ImageKit-style URLs
            if image and image.startswith("//"):
                image = "https:" + image

            is_featured = featured_count < 6   # feature first 6 items
            if is_featured:
                featured_count += 1

            records.append({
                "name": name,
                "description": truncate((item.get("description") or "").strip(), 300),
                "price": price,
                "image": image,
                "category": _infer_category(name),
                "shop_url": shop_url,
                "is_available": True,
                "is_featured": is_featured,
            })

        if records:
            upserted = await db.upsert("merch_items", records, on_conflict="name")
            stats["merch_items"] = len(upserted)

    logger.info("Merch done: %d items upserted", stats["merch_items"])
    return stats


if __name__ == "__main__":
    import utils; utils.setup_logging()
    asyncio.run(run())
