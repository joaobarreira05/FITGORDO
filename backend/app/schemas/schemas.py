import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field

# User Schemas
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserLogin(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Product Schemas
class ProductBase(BaseModel):
    name: str
    brand: Optional[str] = None
    barcode: Optional[str] = None
    image_url: Optional[str] = None
    category: Optional[str] = None
    serving_size: Optional[float] = 100.0
    serving_unit: Optional[str] = "g"
    
    calories_per_100: Optional[float] = None
    protein_per_100: Optional[float] = None
    carbs_per_100: Optional[float] = None
    sugars_per_100: Optional[float] = None
    fat_per_100: Optional[float] = None
    saturated_fat_per_100: Optional[float] = None
    fiber_per_100: Optional[float] = None
    salt_per_100: Optional[float] = None
    sodium_per_100: Optional[float] = None
    source: Optional[str] = "custom"
    favorite: Optional[bool] = False

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    brand: Optional[str] = None
    barcode: Optional[str] = None
    image_url: Optional[str] = None
    category: Optional[str] = None
    serving_size: Optional[float] = None
    serving_unit: Optional[str] = None
    calories_per_100: Optional[float] = None
    protein_per_100: Optional[float] = None
    carbs_per_100: Optional[float] = None
    sugars_per_100: Optional[float] = None
    fat_per_100: Optional[float] = None
    saturated_fat_per_100: Optional[float] = None
    fiber_per_100: Optional[float] = None
    salt_per_100: Optional[float] = None
    sodium_per_100: Optional[float] = None
    favorite: Optional[bool] = None

class ProductResponse(ProductBase):
    id: int
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

# Nutrition Calculation Schema
class NutritionCalculation(BaseModel):
    quantity: float
    unit: str
    calories: Optional[float] = None
    protein: Optional[float] = None
    carbs: Optional[float] = None
    sugars: Optional[float] = None
    fat: Optional[float] = None
    saturated_fat: Optional[float] = None
    fiber: Optional[float] = None
    salt: Optional[float] = None
    sodium: Optional[float] = None

# Meal & MealItem Schemas
class MealItemCreate(BaseModel):
    product_id: int
    quantity: float
    unit: str = "g"

class MealItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: float
    unit: str
    product: ProductResponse
    nutrition: NutritionCalculation

    class Config:
        from_attributes = True

class MealCreate(BaseModel):
    name: str
    items: List[MealItemCreate]

class MealResponse(BaseModel):
    id: int
    user_id: int
    name: str
    created_at: datetime.datetime
    updated_at: datetime.datetime
    items: List[MealItemResponse]
    total_nutrition: NutritionCalculation

    class Config:
        from_attributes = True

# Food Entry Schemas
class FoodEntryCreate(BaseModel):
    meal_type: str  # Pequeno-almoço, Almoço, Lanche, Jantar, Snacks
    product_id: int
    quantity: float
    unit: str = "g"
    consumed_at: Optional[datetime.datetime] = None

class FoodEntryResponse(BaseModel):
    id: int
    user_id: int
    meal_type: str
    product_id: int
    quantity: float
    unit: str
    consumed_at: datetime.datetime
    product: ProductResponse
    nutrition: NutritionCalculation

    class Config:
        from_attributes = True

# Daily Goal Schemas
class DailyGoalBase(BaseModel):
    calories: float = 2200.0
    protein: float = 180.0
    carbs: float = 220.0
    fat: float = 70.0

class DailyGoalUpdate(DailyGoalBase):
    pass

class DailyGoalResponse(DailyGoalBase):
    id: int
    user_id: int
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

# Weight Entry Schemas
class WeightEntryCreate(BaseModel):
    weight: float
    recorded_at: Optional[datetime.datetime] = None

class WeightEntryResponse(BaseModel):
    id: int
    user_id: int
    weight: float
    recorded_at: datetime.datetime

    class Config:
        from_attributes = True

# Daily Summary Schema
class DailySummary(BaseModel):
    date: str
    total_calories: float
    total_protein: float
    total_carbs: float
    total_fat: float
    total_fiber: float
    total_salt: float
    goal: Optional[DailyGoalResponse] = None
    remaining_calories: float
    remaining_protein: float
    remaining_carbs: float
    remaining_fat: float
    entries: List[FoodEntryResponse]
