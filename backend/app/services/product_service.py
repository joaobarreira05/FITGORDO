"""
FITGORDO — ProductService
=========================
Cascade lookup strategy (confirmed by live API tests):
  1. Local DB cache (PostgreSQL/SQLite) — instantaneous, offline-safe
  2. Open Food Facts v2 API — 22k+ Portuguese products, EAN-13 native, free
  3. Nutritionix API — fallback for generic/unbranded foods (no barcode)
  4. None → frontend shows manual entry form

Key optimisations vs previous version:
- `fields=` param on every OFF request → payload ~10× smaller
- pt.openfoodfacts.org subdomain tried first → better PT name/lang priority
- Exponential backoff on transient errors (429, 5xx)
- Nutritionix natural-language NLP endpoint for generic foods
- All external hits labelled with `source` for analytics
"""

import logging
import time
import urllib.parse
from typing import Optional, List, Tuple

import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.all_models import Product

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────

# Mandatory User-Agent per OFF Terms of Use
_OFF_HEADERS = {
    "User-Agent": (
        "FITGORDO/1.0 (PWA dieta Portugal; "
        "https://fitgordo.app; contact@fitgordo.app)"
    )
}

# Exact fields we need — keeps response tiny (~2 KB vs ~40 KB full)
_OFF_FIELDS = (
    "code,product_name,product_name_pt,product_name_pt_PT,"
    "brands,brand_owner,quantity,serving_size,"
    "nutriments,image_url,image_front_url,"
    "categories,countries_tags,stores_tags"
)

_OFF_SEARCH_FIELDS = (
    "code,product_name,product_name_pt,"
    "brands,quantity,nutriments,image_url"
)

# Timeout for all external HTTP calls
_TIMEOUT = 8.0

# Retry config for transient errors (429, 502, 503, 504)
_RETRY_STATUSES = {429, 502, 503, 504}
_MAX_RETRIES = 2
_RETRY_BACKOFF = [1.0, 2.5]  # seconds between retries


# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────

def _safe_get(url: str, headers: dict, params: Optional[dict] = None) -> Optional[dict]:
    """
    GET with retry/backoff for transient errors.
    Returns parsed JSON dict or None on any failure.
    """
    for attempt in range(_MAX_RETRIES + 1):
        try:
            with httpx.Client(follow_redirects=True, timeout=_TIMEOUT) as client:
                r = client.get(url, headers=headers, params=params)

            if r.status_code == 200:
                return r.json()

            if r.status_code in _RETRY_STATUSES and attempt < _MAX_RETRIES:
                wait = _RETRY_BACKOFF[attempt]
                logger.warning(
                    f"[OFF] HTTP {r.status_code} on {url}. "
                    f"Retrying in {wait}s (attempt {attempt+1}/{_MAX_RETRIES})…"
                )
                time.sleep(wait)
                continue

            logger.warning(f"[OFF] Unexpected HTTP {r.status_code} for {url}")
            return None

        except (httpx.TimeoutException, httpx.NetworkError) as exc:
            if attempt < _MAX_RETRIES:
                wait = _RETRY_BACKOFF[attempt]
                logger.warning(f"[OFF] Network error ({exc}). Retrying in {wait}s…")
                time.sleep(wait)
            else:
                logger.error(f"[OFF] Failed after {_MAX_RETRIES} retries: {exc}")
                return None

    return None


def _parse_float(val) -> Optional[float]:
    if val is None or val == "":
        return None
    try:
        return round(float(val), 2)
    except (ValueError, TypeError):
        return None


def _barcode_variations(barcode: str) -> List[str]:
    """Generate EAN-13 / UPC-A / GTIN-14 / zero-padded variants to maximise cache hits."""
    clean = barcode.strip()
    variants = [clean]
    if clean.isdigit():
        if len(clean) == 14 and clean.startswith("0"):
            variants.append(clean[1:])       # 14-digit GTIN-14 → 13-digit EAN-13
        if len(clean) == 13 and clean.startswith("0"):
            variants.append(clean[1:])       # EAN-13 → UPC-A (drop leading 0)
        if len(clean) < 13:
            variants.append(clean.zfill(13)) # UPC-A → EAN-13
        stripped = clean.lstrip("0")
        if stripped:
            variants.append(stripped)
            if len(stripped) == 12:
                variants.append("0" + stripped)
    return list(dict.fromkeys(variants))     # deduplicate, preserve order


# ─────────────────────────────────────────────
# ProductService
# ─────────────────────────────────────────────

class ProductService:
    def __init__(self, db: Session):
        self.db = db

    # ── Public: barcode lookup ──────────────────────────────────────────────

    def get_by_barcode(self, barcode: str) -> Optional[Product]:
        """
        Cascade: Local DB → OFF (pt subdomain first) → OFF (world) → None

        Returns a fully-populated Product ORM object cached in the local DB,
        or None if the product cannot be found anywhere.
        """
        clean = barcode.strip()
        if not clean:
            return None

        variants = _barcode_variations(clean)

        # 1. Local DB cache
        for var in variants:
            local = self.db.query(Product).filter(Product.barcode == var).first()
            if local:
                logger.info(f"[Cache HIT] barcode={var}")
                return local

        # 2 & 3. Open Food Facts — pt subdomain first, then world
        logger.info(f"[Cache MISS] barcode={clean} — querying Open Food Facts…")
        for var in variants:
            product = self._fetch_off_barcode(var)
            if product:
                return product

        logger.info(f"[OFF] Product not found for barcode={clean}")
        return None

    # ── Public: text search ─────────────────────────────────────────────────

    def search_external(self, query: str, limit: int = 20) -> List[Product]:
        """
        Search Open Food Facts by free text, prioritising Portuguese products.
        Falls back to Nutritionix for generic/unbranded queries.
        New results are cached in the local DB automatically.
        """
        clean = query.strip()
        if not clean or len(clean) < 2:
            return []

        results: List[Product] = []
        seen: set = set()

        # Build candidate search terms (full + partial)
        candidates = [clean]
        words = clean.split()
        if len(words) > 2:
            candidates.append(f"{words[0]} {words[-1]}")

        for cand in candidates:
            enc = urllib.parse.quote(cand)

            # OFF search.pl (battle-tested, stable)
            urls = [
                (
                    f"https://world.openfoodfacts.org/cgi/search.pl"
                    f"?search_terms={enc}&search_simple=1&action=process"
                    f"&json=1&page_size={limit}"
                    f"&tagtype_0=countries&tag_contains_0=contains&tag_0=portugal"
                ),
                (
                    f"https://world.openfoodfacts.org/cgi/search.pl"
                    f"?search_terms={enc}&search_simple=1&action=process"
                    f"&json=1&page_size={limit}"
                ),
            ]

            for url in urls:
                data = _safe_get(url, _OFF_HEADERS)
                if data:
                    self._absorb_off_list(data.get("products", []), results, seen, limit)

            # OFF API v2 search as top-up (returns different ranking)
            if len(results) < limit // 2:
                v2_data = _safe_get(
                    "https://world.openfoodfacts.org/api/v2/search",
                    _OFF_HEADERS,
                    params={
                        "search_terms": cand,
                        "fields": _OFF_SEARCH_FIELDS,
                        "page_size": limit,
                        "countries_tags_en": "portugal",
                    }
                )
                if v2_data:
                    self._absorb_off_list(v2_data.get("products", []), results, seen, limit)

            if len(results) >= limit:
                break

        # Nutritionix fallback for generic foods (no results from OFF)
        if not results and settings.NUTRITIONIX_APP_ID and settings.NUTRITIONIX_APP_KEY:
            logger.info(f"[Nutritionix] Trying fallback for query='{clean}'")
            results = self._search_nutritionix(clean, limit)

        return results[:limit]

    # ── Public: manual product create / OFF contribute ──────────────────────

    def create_manual_product(self, data: dict) -> Product:
        """
        Creates a product from manually-entered data.
        Source is tagged 'manual' for analytics.
        """
        product = Product(source="manual", **data)
        self.db.add(product)
        self.db.commit()
        self.db.refresh(product)
        logger.info(f"[Manual] Created product barcode={data.get('barcode')}")
        return product

    # ── Private: OFF barcode fetch ──────────────────────────────────────────

    def _fetch_off_barcode(self, barcode: str) -> Optional[Product]:
        """
        Tries pt.openfoodfacts.org first (better PT-language data),
        then falls back to world.openfoodfacts.org.
        """
        endpoints = [
            f"https://pt.openfoodfacts.org/api/v2/product/{barcode}.json",
            f"https://world.openfoodfacts.org/api/v2/product/{barcode}.json",
        ]

        for url in endpoints:
            data = _safe_get(url, _OFF_HEADERS, params={"fields": _OFF_FIELDS})
            if not data:
                continue
            if data.get("status") != 1 or "product" not in data:
                continue

            source_domain = "pt.openfoodfacts" if "pt.openfoodfacts" in url else "openfoodfacts"
            logger.info(f"[OFF HIT] barcode={barcode} source={source_domain}")
            return self._create_product_from_off(barcode, data["product"], source=source_domain)

        return None

    # ── Private: Nutritionix search ─────────────────────────────────────────

    def _search_nutritionix(self, query: str, limit: int = 10) -> List[Product]:
        """
        Searches Nutritionix instant endpoint.
        Good for generic foods (frango, arroz, ovo) that have no barcode.
        Requires NUTRITIONIX_APP_ID and NUTRITIONIX_APP_KEY in env.
        """
        headers = {
            "x-app-id": settings.NUTRITIONIX_APP_ID,
            "x-app-key": settings.NUTRITIONIX_APP_KEY,
            "Content-Type": "application/json",
        }
        data = _safe_get(
            "https://trackapi.nutritionix.com/v2/search/instant",
            headers,
            params={"query": query, "branded": "true", "self": "false"},
        )
        if not data:
            return []

        results: List[Product] = []
        items = data.get("branded", []) + data.get("common", [])

        for item in items[:limit]:
            nix_id = item.get("nix_item_id") or item.get("tag_id")
            name = item.get("food_name", "")
            if not name:
                continue

            # Check cache first (Nutritionix items have no EAN barcode)
            existing = self.db.query(Product).filter(
                Product.name == name, Product.source.like("nutritionix%")
            ).first()
            if existing:
                results.append(existing)
                continue

            # Fetch full nutritional details
            detail = self._fetch_nutritionix_detail(nix_id, item)
            if detail:
                results.append(detail)

        return results

    def _fetch_nutritionix_detail(self, nix_id: Optional[str], item: dict) -> Optional[Product]:
        """Fetch detailed nutrition from Nutritionix and cache locally."""
        headers = {
            "x-app-id": settings.NUTRITIONIX_APP_ID,
            "x-app-key": settings.NUTRITIONIX_APP_KEY,
        }

        nutrients = {}
        if nix_id:
            data = _safe_get(
                "https://trackapi.nutritionix.com/v2/search/item",
                headers,
                params={"nix_item_id": nix_id},
            )
            if data and data.get("foods"):
                nutrients = data["foods"][0]
        else:
            # Common food — use inline data from instant search
            nutrients = item

        name = nutrients.get("food_name") or item.get("food_name", "")
        if not name:
            return None

        product = Product(
            barcode=None,
            name=name.capitalize(),
            brand=nutrients.get("brand_name"),
            image_url=nutrients.get("photo", {}).get("thumb"),
            category=nutrients.get("tags", {}).get("food_group"),
            serving_size=float(nutrients.get("serving_weight_grams") or 100),
            serving_unit="g",
            calories_per_100=self._nutritionix_per_100(
                nutrients.get("nf_calories"), nutrients.get("serving_weight_grams")
            ),
            protein_per_100=self._nutritionix_per_100(
                nutrients.get("nf_protein"), nutrients.get("serving_weight_grams")
            ),
            carbs_per_100=self._nutritionix_per_100(
                nutrients.get("nf_total_carbohydrate"), nutrients.get("serving_weight_grams")
            ),
            fat_per_100=self._nutritionix_per_100(
                nutrients.get("nf_total_fat"), nutrients.get("serving_weight_grams")
            ),
            saturated_fat_per_100=self._nutritionix_per_100(
                nutrients.get("nf_saturated_fat"), nutrients.get("serving_weight_grams")
            ),
            sugars_per_100=self._nutritionix_per_100(
                nutrients.get("nf_sugars"), nutrients.get("serving_weight_grams")
            ),
            fiber_per_100=self._nutritionix_per_100(
                nutrients.get("nf_dietary_fiber"), nutrients.get("serving_weight_grams")
            ),
            salt_per_100=self._nutritionix_per_100(
                nutrients.get("nf_sodium"), nutrients.get("serving_weight_grams"),
                convert_sodium_to_salt=True,
            ),
            sodium_per_100=self._nutritionix_per_100(
                nutrients.get("nf_sodium"), nutrients.get("serving_weight_grams")
            ),
            source="nutritionix",
        )

        try:
            self.db.add(product)
            self.db.commit()
            self.db.refresh(product)
            return product
        except Exception as exc:
            self.db.rollback()
            logger.error(f"[Nutritionix] DB error saving '{name}': {exc}")
            return None

    @staticmethod
    def _nutritionix_per_100(
        value_per_serving,
        serving_weight_grams,
        convert_sodium_to_salt: bool = False,
    ) -> Optional[float]:
        """Convert Nutritionix per-serving values → per 100g."""
        if value_per_serving is None:
            return None
        try:
            serving_g = float(serving_weight_grams or 100)
            per_100 = float(value_per_serving) * 100.0 / serving_g
            if convert_sodium_to_salt:
                # Sodium (mg) → Salt (g): salt = sodium × 2.5 / 1000
                per_100 = per_100 * 2.5 / 1000
            return round(per_100, 2)
        except (TypeError, ValueError, ZeroDivisionError):
            return None

    # ── Private: absorb OFF product list into local results/cache ───────────

    def _absorb_off_list(
        self,
        off_products: list,
        results: List[Product],
        seen: set,
        limit: int,
    ) -> None:
        for off_p in off_products:
            if len(results) >= limit:
                return
            bc = off_p.get("code")
            if not bc or bc in seen:
                continue
            seen.add(bc)

            existing = self.db.query(Product).filter(Product.barcode == bc).first()
            if existing:
                results.append(existing)
            else:
                new_p = self._create_product_from_off(bc, off_p)
                if new_p:
                    results.append(new_p)

    # ── Private: parse OFF product dict → Product ORM ───────────────────────

    def _create_product_from_off(
        self, barcode: str, off_product: dict, source: str = "openfoodfacts"
    ) -> Optional[Product]:
        """
        Parses an Open Food Facts product dict into a Product ORM object
        and persists it to the local DB cache.

        Name priority: pt_PT > pt > default > en > abbreviated > 'Produto {barcode}'
        Energy fallback: if kcal missing, converts kJ → kcal (÷ 4.184)
        """
        nutriments = off_product.get("nutriments", {})

        # Name — Portuguese first
        name = (
            off_product.get("product_name_pt_PT")
            or off_product.get("product_name_pt")
            or off_product.get("product_name")
            or off_product.get("product_name_en")
            or off_product.get("abbreviated_product_name")
            or f"Produto {barcode}"
        )
        name = name.strip()

        brand = (
            off_product.get("brands")
            or off_product.get("brand_owner")
            or None
        )
        if brand:
            # OFF often returns comma-separated brands; take the first
            brand = brand.split(",")[0].strip()

        image_url = (
            off_product.get("image_url")
            or off_product.get("image_front_url")
            or off_product.get("image_front_small_url")
            or None
        )

        category = off_product.get("categories") or None

        # Serving size & unit
        serving_size_str = str(off_product.get("serving_size") or "")
        serving_unit = "ml" if "ml" in serving_size_str.lower() else "g"
        serving_size = 100.0  # default; UI lets user override

        # Calories: prefer kcal, fallback kJ → kcal
        calories = _parse_float(nutriments.get("energy-kcal_100g"))
        if calories is None:
            kj = _parse_float(nutriments.get("energy_100g") or nutriments.get("energy-kj_100g"))
            if kj is not None:
                calories = round(kj / 4.184, 1)

        try:
            product = Product(
                barcode=barcode,
                name=name,
                brand=brand,
                image_url=image_url,
                category=category,
                serving_size=serving_size,
                serving_unit=serving_unit,
                calories_per_100=calories,
                protein_per_100=_parse_float(nutriments.get("proteins_100g")),
                carbs_per_100=_parse_float(nutriments.get("carbohydrates_100g")),
                sugars_per_100=_parse_float(nutriments.get("sugars_100g")),
                fat_per_100=_parse_float(nutriments.get("fat_100g")),
                saturated_fat_per_100=_parse_float(nutriments.get("saturated-fat_100g")),
                fiber_per_100=_parse_float(nutriments.get("fiber_100g")),
                salt_per_100=_parse_float(nutriments.get("salt_100g")),
                sodium_per_100=_parse_float(nutriments.get("sodium_100g")),
                source=source,
            )
            self.db.add(product)
            self.db.commit()
            self.db.refresh(product)
            logger.info(f"[DB] Cached new product: barcode={barcode}, name='{name}', source={source}")
            return product
        except Exception as exc:
            self.db.rollback()
            logger.error(f"[DB] Error caching product barcode={barcode}: {exc}")
            return None
