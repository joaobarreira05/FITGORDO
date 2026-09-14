from typing import Optional, Dict, Any
from app.schemas.schemas import NutritionCalculation

def scale_nutrient(value_per_100: Optional[float], factor: float) -> Optional[float]:
    """
    Scales a nutrient value by a factor if the per-100 value is present.
    Returns None if missing to accurately distinguish unknown values from 0.
    """
    if value_per_100 is None:
        return None
    return round(value_per_100 * factor, 1)

def calculate_nutrition_for_quantity(product: Any, quantity: float, unit: str = "g") -> NutritionCalculation:
    """
    Central function to calculate absolute nutrient amounts based on consumed quantity.
    Supports units 'g', 'ml', and 'unit' (portion).
    """
    # Determine multiplication factor relative to 100g / 100ml
    # Supports 'unit' (porção/unidade), 'fatia' / 'fatias' (fatia de pão ≈ 28g), and standard 'g' / 'ml'
    if unit in ("fatia", "fatias"):
        serving = getattr(product, "serving_size", None)
        # Slices typically weigh 20g-45g, default to 28g if not specified
        slice_weight = serving if (serving and 10.0 <= serving <= 80.0) else 28.0
        total_grams_or_ml = quantity * slice_weight
        factor = total_grams_or_ml / 100.0
    elif unit == "unit":
        serving = getattr(product, "serving_size", None) or 100.0
        total_grams_or_ml = quantity * serving
        factor = total_grams_or_ml / 100.0
    else:
        # Standard g or ml
        factor = quantity / 100.0

    return NutritionCalculation(
        quantity=quantity,
        unit=unit,
        calories=scale_nutrient(getattr(product, "calories_per_100", None), factor),
        protein=scale_nutrient(getattr(product, "protein_per_100", None), factor),
        carbs=scale_nutrient(getattr(product, "carbs_per_100", None), factor),
        sugars=scale_nutrient(getattr(product, "sugars_per_100", None), factor),
        fat=scale_nutrient(getattr(product, "fat_per_100", None), factor),
        saturated_fat=scale_nutrient(getattr(product, "saturated_fat_per_100", None), factor),
        fiber=scale_nutrient(getattr(product, "fiber_per_100", None), factor),
        salt=scale_nutrient(getattr(product, "salt_per_100", None), factor),
        sodium=scale_nutrient(getattr(product, "sodium_per_100", None), factor),
    )
