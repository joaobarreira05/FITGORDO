import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    meals = relationship("Meal", back_populates="user", cascade="all, delete-orphan")
    food_entries = relationship("FoodEntry", back_populates="user", cascade="all, delete-orphan")
    daily_goals = relationship("DailyGoal", back_populates="user", cascade="all, delete-orphan")
    weight_entries = relationship("WeightEntry", back_populates="user", cascade="all, delete-orphan")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    barcode = Column(String, unique=True, index=True, nullable=True)
    name = Column(String, index=True, nullable=False)
    brand = Column(String, nullable=True)
    image_url = Column(Text, nullable=True)
    category = Column(String, nullable=True)
    
    serving_size = Column(Float, nullable=True)
    serving_unit = Column(String, nullable=True, default="g")  # g, ml, unit
    
    # Nutritional values per 100g / 100ml (Nullable allowed!)
    calories_per_100 = Column(Float, nullable=True)
    protein_per_100 = Column(Float, nullable=True)
    carbs_per_100 = Column(Float, nullable=True)
    sugars_per_100 = Column(Float, nullable=True)
    fat_per_100 = Column(Float, nullable=True)
    saturated_fat_per_100 = Column(Float, nullable=True)
    fiber_per_100 = Column(Float, nullable=True)
    salt_per_100 = Column(Float, nullable=True)
    sodium_per_100 = Column(Float, nullable=True)
    
    source = Column(String, default="custom")  # 'openfoodfacts' or 'custom'
    favorite = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class Meal(Base):
    __tablename__ = "meals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="meals")
    items = relationship("MealItem", back_populates="meal", cascade="all, delete-orphan")


class MealItem(Base):
    __tablename__ = "meal_items"

    id = Column(Integer, primary_key=True, index=True)
    meal_id = Column(Integer, ForeignKey("meals.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    unit = Column(String, default="g")  # g, ml, unit

    # Relationships
    meal = relationship("Meal", back_populates="items")
    product = relationship("Product")


class FoodEntry(Base):
    __tablename__ = "food_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    meal_type = Column(String, nullable=False)  # Pequeno-almoço, Almoço, Lanche, Jantar, Snacks
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    unit = Column(String, default="g")
    consumed_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="food_entries")
    product = relationship("Product")


class DailyGoal(Base):
    __tablename__ = "daily_goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    calories = Column(Float, default=2200.0)
    protein = Column(Float, default=180.0)
    carbs = Column(Float, default=220.0)
    fat = Column(Float, default=70.0)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="daily_goals")


class WeightEntry(Base):
    __tablename__ = "weight_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    weight = Column(Float, nullable=False)
    recorded_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="weight_entries")
