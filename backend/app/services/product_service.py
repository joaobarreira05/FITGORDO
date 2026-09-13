import logging
import httpx
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.all_models import Product
from app.core.config import settings

logger = logging.getLogger(__name__)

class ProductService:
    def __init__(self, db: Session):
        self.db = db

    def get_by_barcode(self, barcode: str) -> Optional[Product]:
        """
        1. Check local DB first.
        2. If found, return local Product.
        3. If not found, fetch from Open Food Facts API (Portuguese domain first, then global).
        4. Normalize fields, save to DB, and return.
        """
        clean_barcode = barcode.strip()
        
        # 1 & 2. Search local DB
        local_product = self.db.query(Product).filter(Product.barcode == clean_barcode).first()
        if local_product:
            logger.info(f"Product with barcode {clean_barcode} found in local DB.")
            return local_product

        # 3. Fetch from Open Food Facts API (PT first, then World)
        logger.info(f"Barcode {clean_barcode} not in DB. Querying Open Food Facts API...")
        urls_to_try = [
            f"https://pt.openfoodfacts.org/api/v2/product/{clean_barcode}.json",
            f"https://world.openfoodfacts.org/api/v2/product/{clean_barcode}.json"
        ]

        for url in urls_to_try:
            try:
                response = httpx.get(url, timeout=5.0, headers={"User-Agent": "FITGORDO - PWA Diet Tracker PT"})
                if response.status_code == 200:
                    data = response.json()
                    if data.get("status") == 1 and "product" in data:
                        off_product = data["product"]
                        return self._create_product_from_off(clean_barcode, off_product)
            except Exception as e:
                logger.error(f"Error fetching product from {url}: {e}")

        return None

    def search_external(self, query_str: str, limit: int = 20) -> List[Product]:
        """
        Queries Open Food Facts Portugal search endpoint for text queries (e.g. 'Pingo Doce', 'Continente', 'Mercadona', 'Iogurte').
        Saves missing results to local DB so subsequent searches are instant.
        """
        clean_query = query_str.strip()
        if not clean_query or len(clean_query) < 2:
            return []

        search_urls = [
            f"https://pt.openfoodfacts.org/cgi/search.pl?search_terms={clean_query}&search_simple=1&action=process&json=1&page_size={limit}&lc=pt",
            f"https://world.openfoodfacts.org/cgi/search.pl?search_terms={clean_query}&search_simple=1&action=process&json=1&page_size={limit}&lc=pt"
        ]

        fetched_products: List[Product] = []

        for search_url in search_urls:
            try:
                response = httpx.get(search_url, timeout=6.0, headers={"User-Agent": "FITGORDO - PWA Diet Tracker PT"})
                if response.status_code == 200:
                    data = response.json()
                    products_list = data.get("products", [])
                    for off_p in products_list:
                        bc = off_p.get("code")
                        if not bc:
                            continue
                        
                        # Check if already exists in DB
                        existing = self.db.query(Product).filter((Product.barcode == bc) | (Product.name == off_p.get("product_name"))).first()
                        if existing:
                            if existing not in fetched_products:
                                fetched_products.append(existing)
                        else:
                            new_p = self._create_product_from_off(bc, off_p)
                            if new_p and new_p not in fetched_products:
                                fetched_products.append(new_p)
                    
                    if fetched_products:
                        break
            except Exception as e:
                logger.error(f"Error executing external search for query '{clean_query}' on {search_url}: {e}")

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
        image_url = off_product.get("image_url") or off_product.get("image_front_url") or off_product.get("image_front_small_url") or None
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
