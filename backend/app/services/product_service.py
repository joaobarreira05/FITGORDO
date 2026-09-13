import logging
import httpx
from typing import Optional
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
        3. If not found, fetch from Open Food Facts API.
        4. Normalize fields, save to DB, and return.
        """
        clean_barcode = barcode.strip()
        
        # 1 & 2. Search local DB
        local_product = self.db.query(Product).filter(Product.barcode == clean_barcode).first()
        if local_product:
            logger.info(f"Product with barcode {clean_barcode} found in local DB.")
            return local_product

        # 3. Fetch from Open Food Facts API
        logger.info(f"Barcode {clean_barcode} not in DB. Querying Open Food Facts API...")
        try:
            url = f"{settings.OPEN_FOOD_FACTS_API_URL}/product/{clean_barcode}.json"
            response = httpx.get(url, timeout=5.0, headers={"User-Agent": "FITGORDO - PWA Diet Tracker"})
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == 1 and "product" in data:
                    off_product = data["product"]
                    return self._create_product_from_off(clean_barcode, off_product)
        except Exception as e:
            logger.error(f"Error fetching product from Open Food Facts for barcode {clean_barcode}: {e}")

        return None

    def _create_product_from_off(self, barcode: str, off_product: dict) -> Product:
        """
        Parses Open Food Facts product dict, handles missing fields cleanly,
        and saves to local database.
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

        # Extract name & brand
        name = off_product.get("product_name") or off_product.get("product_name_en") or off_product.get("product_name_pt") or f"Produto {barcode}"
        brand = off_product.get("brands") or None
        image_url = off_product.get("image_url") or off_product.get("image_front_url") or None
        category = off_product.get("categories") or None

        # Extract serving unit & size if provided
        serving_size_str = off_product.get("serving_size") or ""
        serving_size = 100.0
        serving_unit = "g"
        if "ml" in serving_size_str.lower():
            serving_unit = "ml"

        # Energy: preference for kcal per 100g, or convert kj
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
