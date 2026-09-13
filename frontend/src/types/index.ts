export interface User {
  id: number;
  email: string;
  created_at: string;
}

export interface Product {
  id: number;
  barcode?: string | null;
  name: string;
  brand?: string | null;
  image_url?: string | null;
  category?: string | null;
  serving_size?: number | null;
  serving_unit?: string | null;
  calories_per_100?: number | null;
  protein_per_100?: number | null;
  carbs_per_100?: number | null;
  sugars_per_100?: number | null;
  fat_per_100?: number | null;
  saturated_fat_per_100?: number | null;
  fiber_per_100?: number | null;
  salt_per_100?: number | null;
  sodium_per_100?: number | null;
  source?: 'openfoodfacts' | 'custom';
  favorite?: boolean;
  created_at: string;
  updated_at: string;
}

export interface NutritionCalculation {
  quantity: number;
  unit: string;
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  sugars?: number | null;
  fat?: number | null;
  saturated_fat?: number | null;
  fiber?: number | null;
  salt?: number | null;
  sodium?: number | null;
}

export interface FoodEntry {
  id: number;
  user_id: number;
  meal_type: 'Pequeno-almoço' | 'Almoço' | 'Lanche' | 'Jantar' | 'Snacks' | string;
  product_id: number;
  quantity: number;
  unit: string;
  consumed_at: string;
  product: Product;
  nutrition: NutritionCalculation;
}

export interface MealItem {
  id: number;
  product_id: number;
  quantity: number;
  unit: string;
  product: Product;
  nutrition: NutritionCalculation;
}

export interface Meal {
  id: number;
  user_id: number;
  name: string;
  created_at: string;
  updated_at: string;
  items: MealItem[];
  total_nutrition: NutritionCalculation;
}

export interface DailyGoal {
  id: number;
  user_id: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  updated_at: string;
}

export interface WeightEntry {
  id: number;
  user_id: number;
  weight: number;
  recorded_at: string;
}

export interface DailySummary {
  date: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_fiber: number;
  total_salt: number;
  goal: DailyGoal;
  remaining_calories: number;
  remaining_protein: number;
  remaining_carbs: number;
  remaining_fat: number;
  entries: FoodEntry[];
}
