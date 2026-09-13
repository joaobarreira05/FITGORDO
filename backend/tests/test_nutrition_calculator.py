from app.services.nutrition_calculator import calculate_nutrition_for_quantity

class DummyProduct:
    def __init__(self, calories=100.0, protein=20.0, carbs=1.0, fat=2.0, missing_fiber=True):
        self.calories_per_100 = calories
        self.protein_per_100 = protein
        self.carbs_per_100 = carbs
        self.fat_per_100 = fat
        self.sugars_per_100 = 0.5
        self.saturated_fat_per_100 = 0.5
        self.fiber_per_100 = None if missing_fiber else 1.0
        self.salt_per_100 = 0.2
        self.sodium_per_100 = 0.08
        self.serving_size = 100.0

def test_nutrition_for_150g():
    prod = DummyProduct(calories=105.0, protein=22.0, carbs=1.0, fat=2.0)
    res = calculate_nutrition_for_quantity(prod, 150.0, "g")

    assert res.calories == 157.5
    assert res.protein == 33.0
    assert res.carbs == 1.5
    assert res.fat == 3.0
    assert res.fiber is None  # Should preserve None for missing nutrients!

def test_nutrition_for_missing_values():
    prod = DummyProduct(calories=None, protein=None, carbs=None, fat=None)
    res = calculate_nutrition_for_quantity(prod, 100.0, "g")

    assert res.calories is None
    assert res.protein is None
    assert res.carbs is None
    assert res.fat is None
