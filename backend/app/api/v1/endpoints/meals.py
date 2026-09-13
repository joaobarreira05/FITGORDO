import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.all_models import Meal, MealItem, Product, FoodEntry, User
from app.schemas.schemas import MealCreate, MealResponse, MealItemResponse, NutritionCalculation, FoodEntryResponse
from app.services.nutrition_calculator import calculate_nutrition_for_quantity
from app.api.v1.endpoints.auth import get_current_user
from app.api.v1.endpoints.diary import build_food_entry_response

router = APIRouter()

def build_meal_response(meal: Meal) -> MealResponse:
    items_resp = []
    tot_cal, tot_prot, tot_carbs, tot_fat, tot_fiber, tot_salt = 0.0, 0.0, 0.0, 0.0, 0.0, 0.0

    for item in meal.items:
        nutr = calculate_nutrition_for_quantity(item.product, item.quantity, item.unit)
        items_resp.append(MealItemResponse(
            id=item.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit=item.unit,
            product=item.product,
            nutrition=nutr
        ))
        if nutr.calories: tot_cal += nutr.calories
        if nutr.protein: tot_prot += nutr.protein
        if nutr.carbs: tot_carbs += nutr.carbs
        if nutr.fat: tot_fat += nutr.fat
        if nutr.fiber: tot_fiber += nutr.fiber
        if nutr.salt: tot_salt += nutr.salt

    total_nutrition = NutritionCalculation(
        quantity=len(meal.items),
        unit="items",
        calories=round(tot_cal, 1),
        protein=round(tot_prot, 1),
        carbs=round(tot_carbs, 1),
        fat=round(tot_fat, 1),
        fiber=round(tot_fiber, 1),
        salt=round(tot_salt, 1)
    )

    return MealResponse(
        id=meal.id,
        user_id=meal.user_id,
        name=meal.name,
        created_at=meal.created_at,
        updated_at=meal.updated_at,
        items=items_resp,
        total_nutrition=total_nutrition
    )

@router.get("/", response_model=List[MealResponse])
def get_user_meals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    meals = db.query(Meal).filter(Meal.user_id == current_user.id).order_by(Meal.updated_at.desc()).all()
    return [build_meal_response(m) for m in meals]

@router.get("/{meal_id}", response_model=MealResponse)
def get_meal_by_id(
    meal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    meal = db.query(Meal).filter(Meal.id == meal_id, Meal.user_id == current_user.id).first()
    if not meal:
        raise HTTPException(status_code=404, detail="Refeição guardada não encontrada.")
    return build_meal_response(meal)

@router.post("/", response_model=MealResponse, status_code=201)
def create_meal(
    meal_in: MealCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_meal = Meal(user_id=current_user.id, name=meal_in.name)
    db.add(new_meal)
    db.commit()
    db.refresh(new_meal)

    for item in meal_in.items:
        p = db.query(Product).filter(Product.id == item.product_id).first()
        if not p:
            continue
        meal_item = MealItem(
            meal_id=new_meal.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit=item.unit
        )
        db.add(meal_item)

    db.commit()
    db.refresh(new_meal)
    return build_meal_response(new_meal)

@router.post("/{meal_id}/add-to-diary", response_model=List[FoodEntryResponse])
def add_meal_to_diary(
    meal_id: int,
    meal_type: str = "Almoço",
    consumed_at: Optional[datetime.datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    meal = db.query(Meal).filter(Meal.id == meal_id, Meal.user_id == current_user.id).first()
    if not meal:
        raise HTTPException(status_code=404, detail="Refeição guardada não encontrada.")

    target_time = consumed_at or datetime.datetime.utcnow()
    created_entries = []

    for item in meal.items:
        entry = FoodEntry(
            user_id=current_user.id,
            meal_type=meal_type,
            product_id=item.product_id,
            quantity=item.quantity,
            unit=item.unit,
            consumed_at=target_time
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        created_entries.append(build_food_entry_response(entry))

    return created_entries

@router.delete("/{meal_id}", status_code=204)
def delete_meal(
    meal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    meal = db.query(Meal).filter(Meal.id == meal_id, Meal.user_id == current_user.id).first()
    if not meal:
        raise HTTPException(status_code=404, detail="Refeição guardada não encontrada.")

    db.delete(meal)
    db.commit()
    return None
