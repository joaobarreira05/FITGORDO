import logging
import urllib.parse
import httpx
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.all_models import Product

logger = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": "FITGORDO - Android/iOS App - Version 1.0 - www.fitgordo.com"
}

class ProductService:
    def __init__(self, db: Session):
        self.db = db

    def get_by_barcode(self, barcode: str) -> Optional[Product]:
        """
        1. Check local DB first with barcode digit variations.
        2. If found, return local Product.
        3. If not found, fetch from Open Food Facts API (Portuguese domain first, then global).
        4. Normalize fields, save to DB, and return.
        """
        clean_barcode = barcode.strip()
        if not clean_barcode:
            return None

        # Generate barcode variations (e.g. padded zeros, stripped zeros, EAN13 vs UPC)
        variations = [clean_barcode]
        if clean_barcode.startswith("0"):
            variations.append(clean_barcode.lstrip("0"))
        if clean_barcode.isdigit() and len(clean_barcode) < 13:
            variations.append(clean_barcode.zfill(13))

        seen_bcs = set()
        
        # 1 & 2. Search local DB with variations
        for var in variations:
            if var in seen_bcs:
                continue
            seen_bcs.add(var)
            local_product = self.db.query(Product).filter(Product.barcode == var).first()
            if local_product:
                logger.info(f"Product with barcode {var} found in local DB.")
                return local_product

        # 3. Fetch from Open Food Facts API with variations
        logger.info(f"Barcode {clean_barcode} not in DB. Querying Open Food Facts API...")
        for var in variations:
            urls_to_try = [
                f"https://pt.openfoodfacts.org/api/v2/product/{var}.json",
                f"https://world.openfoodfacts.org/api/v2/product/{var}.json"
            ]

            for url in urls_to_try:
                try:
                    response = httpx.get(url, headers=HEADERS, follow_redirects=True, timeout=8.0)
                    if response.status_code == 200:
                        data = response.json()
                        if data.get("status") == 1 and "product" in data:
                            off_product = data["product"]
                            return self._create_product_from_off(var, off_product)
                except Exception as e:
                    logger.error(f"Error fetching product from {url}: {e}")

        return None

    def search_external(self, query_str: str, limit: int = 20) -> List[Product]:
        """
        Queries Open Food Facts for text queries (e.g. 'iogurte natural', 'Pingo Doce', 'Continente', 'Mercadona').
        Encodes query properly, uses dual search endpoint fallback, and handles redirects.
        Saves missing results to local DB so subsequent searches are instant.
        """
        clean_query = query_str.strip()
        if not clean_query or len(clean_query) < 2:
            return []

        # Generate candidate search terms (full query + stripped combinations if long)
        candidates = [clean_query]
        words = clean_query.split()
        if len(words) > 2:
            candidates.append(f"{words[0]} {words[-1]}")
            candidates.append(f"{words[0]} {words[1]}")

        fetched_products: List[Product] = []
        seen_barcodes = set()

        for cand in candidates:
            encoded_q = urllib.parse.quote(cand)

            # Strategy 1: Open Food Facts cgi search.pl
            urls = [
                f"https://world.openfoodfacts.org/cgi/search.pl?search_terms={encoded_q}&search_simple=1&action=process&json=1&page_size={limit}",
                f"https://pt.openfoodfacts.org/cgi/search.pl?search_terms={encoded_q}&search_simple=1&action=process&json=1&page_size={limit}"
            ]

            for search_url in urls:
                try:
                    response = httpx.get(search_url, headers=HEADERS, follow_redirects=True, timeout=8.0)
                    if response.status_code == 200:
                        data = response.json()
                        products_list = data.get("products", [])
                        for off_p in products_list:
                            bc = off_p.get("code")
                            if not bc or bc in seen_barcodes:
                                continue
                            seen_barcodes.add(bc)
                            
                            existing = self.db.query(Product).filter(Product.barcode == bc).first()
                            if existing:
                                if existing not in fetched_products:
                                    fetched_products.append(existing)
                            else:
                                new_p = self._create_product_from_off(bc, off_p)
                                if new_p and new_p not in fetched_products:
                                    fetched_products.append(new_p)
                except Exception as e:
                    logger.error(f"Error searching OFF {search_url}: {e}")

            # Strategy 2: Open Food Facts v2 API search if strategy 1 yielded few results
            if len(fetched_products) < 5:
                v2_url = f"https://world.openfoodfacts.org/api/v2/search?q={encoded_q}&page_size={limit}"
                try:
                    response = httpx.get(v2_url, headers=HEADERS, follow_redirects=True, timeout=8.0)
                    if response.status_code == 200:
                        data = response.json()
                        products_list = data.get("products", [])
                        for off_p in products_list:
                            bc = off_p.get("code")
                            if not bc or bc in seen_barcodes:
                                continue
                            seen_barcodes.add(bc)
                            
                            existing = self.db.query(Product).filter(Product.barcode == bc).first()
                            if existing:
                                if existing not in fetched_products:
                                    fetched_products.append(existing)
                            else:
                                new_p = self._create_product_from_off(bc, off_p)
                                if new_p and new_p not in fetched_products:
                                    fetched_products.append(new_p)
                except Exception as e:
                    logger.error(f"Error searching OFF v2 {v2_url}: {e}")

            if len(fetched_products) >= limit:
                break

        return fetched_products

    def _create_product_from_off(self, barcode: str, off_product: dict) -> Product:
        """
        Parses Open Food Facts product dict, handles Portuguese names & brands,
        handles missing fields cleanly, and saves to local database.
        """
        nutriments = off_product.get("nutriments", {})

        def parse_float(val) -> Optional[float]:
            if val is None or val == "":
                return None
            try:
                f_val = float(val)
                return round(f_val, 2)
            except (ValueError, TypeError):
                return None

        # Extract name & brand with Portuguese priority
        name = (
            off_product.get("product_name_pt_PT") or
            off_product.get("product_name_pt") or
            off_product.get("product_name") or
            off_product.get("product_name_en") or
            off_product.get("abbreviated_product_name") or
            f"Produto {barcode}"
        )
        
        brand = off_product.get("brands") or off_product.get("brand_owner") or None
        image_url = (
            off_product.get("image_url") or
            off_product.get("image_front_url") or
            off_product.get("image_front_small_url") or
            None
        )
        category = off_product.get("categories") or None

        # Serving size
        serving_size_str = str(off_product.get("serving_size") or "")
        serving_size = 100.0
        serving_unit = "g"
        if "ml" in serving_size_str.lower():
            serving_unit = "ml"

        # Energy
        calories = parse_float(nutriments.get("energy-kcal_100g"))
        if calories is None:
            energy_kj = parse_float(nutriments.get("energy_100g"))
            if energy_kj is not None:
                calories = round(energy_kj / 4.184, 1)

        product = Product(
            barcode=barcode,
            name=name,
            brand=brand,
            image_url=image_url,
            category=category,
            serving_size=serving_size,
            serving_unit=serving_unit,
            calories_per_100=calories,
            protein_per_100=parse_float(nutriments.get("proteins_100g")),
            carbs_per_100=parse_float(nutriments.get("carbohydrates_100g")),
            sugars_per_100=parse_float(nutriments.get("sugars_100g")),
            fat_per_100=parse_float(nutriments.get("fat_100g")),
            saturated_fat_per_100=parse_float(nutriments.get("saturated-fat_100g")),
            fiber_per_100=parse_float(nutriments.get("fiber_100g")),
            salt_per_100=parse_float(nutriments.get("salt_100g")),
            sodium_per_100=parse_float(nutriments.get("sodium_100g")),
            source="openfoodfacts"
        )

        self.db.add(product)
        self.db.commit()
        self.db.refresh(product)
        return product
