import logging
from sqlalchemy.orm import Session
from app.models.all_models import Product

logger = logging.getLogger(__name__)

PORTUGUESE_STAPLES = [
    {
        "barcode": "5607047011966",
        "name": "Iogurte Natural Magro",
        "brand": "Pingo Doce",
        "calories_per_100": 38.0,
        "protein_per_100": 4.1,
        "carbs_per_100": 4.8,
        "sugars_per_100": 4.8,
        "fat_per_100": 0.2,
        "saturated_fat_per_100": 0.1,
        "fiber_per_100": 0.0,
        "salt_per_100": 0.1,
        "serving_size": 125.0,
        "serving_unit": "g",
        "category": "Iogurtes",
        "source": "staples_pt"
    },
    {
        "barcode": "5607047007532",
        "name": "Iogurte Grego Magro Natural",
        "brand": "Pingo Doce",
        "calories_per_100": 57.0,
        "protein_per_100": 6.5,
        "carbs_per_100": 4.2,
        "sugars_per_100": 4.2,
        "fat_per_100": 2.0,
        "saturated_fat_per_100": 1.3,
        "fiber_per_100": 0.0,
        "salt_per_100": 0.1,
        "serving_size": 125.0,
        "serving_unit": "g",
        "category": "Iogurtes",
        "source": "staples_pt"
    },
    {
        "barcode": "5607047011584",
        "name": "Iogurte Ananás Magro Pedaços",
        "brand": "Pingo Doce",
        "calories_per_100": 42.0,
        "protein_per_100": 3.5,
        "carbs_per_100": 6.8,
        "sugars_per_100": 6.5,
        "fat_per_100": 0.1,
        "saturated_fat_per_100": 0.1,
        "fiber_per_100": 0.2,
        "salt_per_100": 0.1,
        "serving_size": 125.0,
        "serving_unit": "g",
        "category": "Iogurtes",
        "source": "staples_pt"
    },
    {
        "barcode": "5601312079293",
        "name": "Flocos de Aveia Integral Finos",
        "brand": "Continente",
        "calories_per_100": 375.0,
        "protein_per_100": 12.0,
        "carbs_per_100": 60.0,
        "sugars_per_100": 1.2,
        "fat_per_100": 7.0,
        "saturated_fat_per_100": 1.2,
        "fiber_per_100": 10.0,
        "salt_per_100": 0.02,
        "serving_size": 50.0,
        "serving_unit": "g",
        "category": "Cereais",
        "source": "staples_pt"
    },
    {
        "barcode": "5601049132995",
        "name": "Leite Meio-Gordo",
        "brand": "Mimosa",
        "calories_per_100": 47.0,
        "protein_per_100": 3.3,
        "carbs_per_100": 4.8,
        "sugars_per_100": 4.8,
        "fat_per_100": 1.6,
        "saturated_fat_per_100": 1.0,
        "fiber_per_100": 0.0,
        "salt_per_100": 0.1,
        "serving_size": 250.0,
        "serving_unit": "ml",
        "category": "Laticínios",
        "source": "staples_pt"
    },
    {
        "barcode": "5601234567890",
        "name": "Peito de Peru Fatiado",
        "brand": "Nobre",
        "calories_per_100": 105.0,
        "protein_per_100": 22.0,
        "carbs_per_100": 1.0,
        "sugars_per_100": 0.5,
        "fat_per_100": 2.0,
        "saturated_fat_per_100": 0.7,
        "fiber_per_100": 0.0,
        "salt_per_100": 1.8,
        "serving_size": 100.0,
        "serving_unit": "g",
        "category": "Charcutaria",
        "source": "staples_pt"
    }
]

def seed_portuguese_staples(db: Session):
    """
    Ensures popular Portuguese staples exist in local DB.
    """
    for item in PORTUGUESE_STAPLES:
        existing = db.query(Product).filter(Product.barcode == item["barcode"]).first()
        if not existing:
            p = Product(**item)
            db.add(p)
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding Portuguese staples: {e}")
