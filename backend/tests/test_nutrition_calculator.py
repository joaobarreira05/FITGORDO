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

def test_nutrition_for_bread_slices():
    # Bread with 250 kcal/100g, 8g protein, 48g carbs, 2.5g fat
    # Default slice weight = 28g; 2 slices = 56g total (factor = 0.56)
    bread = DummyProduct(calories=250.0, protein=8.0, carbs=48.0, fat=2.5, missing_fiber=False)
    bread.serving_size = None  # test default 28g

    res = calculate_nutrition_for_quantity(bread, 2.0, "fatias")
    assert res.calories == round(250.0 * 0.56, 1)  # 140.0
    assert res.protein == round(8.0 * 0.56, 1)     # 4.5
    assert res.carbs == round(48.0 * 0.56, 1)      # 26.9
    assert res.fat == round(2.5 * 0.56, 1)        # 1.4

    # Custom slice weight e.g. 35g per slice
    bread.serving_size = 35.0
    res_custom = calculate_nutrition_for_quantity(bread, 1.0, "fatia")
    # 1 slice = 35g (factor = 0.35)
    assert res_custom.calories == round(250.0 * 0.35, 1)  # 87.5

