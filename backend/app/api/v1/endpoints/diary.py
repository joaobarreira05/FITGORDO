import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.all_models import FoodEntry, Product, DailyGoal, User
from app.schemas.schemas import FoodEntryCreate, FoodEntryResponse, DailySummary, DailyGoalResponse
from app.services.nutrition_calculator import calculate_nutrition_for_quantity
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()

def build_food_entry_response(entry: FoodEntry) -> FoodEntryResponse:
    nutrition = calculate_nutrition_for_quantity(entry.product, entry.quantity, entry.unit)
    return FoodEntryResponse(
        id=entry.id,
        user_id=entry.user_id,
        meal_type=entry.meal_type,
        product_id=entry.product_id,
        quantity=entry.quantity,
        unit=entry.unit,
        consumed_at=entry.consumed_at,
        product=entry.product,
        nutrition=nutrition
    )

@router.get("/date/{date_str}", response_model=DailySummary)
def get_diary_by_date(
    date_str: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        target_date = datetime.datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de data inválido. Utilize YYYY-MM-DD.")

    start_dt = datetime.datetime.combine(target_date, datetime.time.min)
    end_dt = datetime.datetime.combine(target_date, datetime.time.max)

    entries = (
        db.query(FoodEntry)
        .filter(
            FoodEntry.user_id == current_user.id,
            FoodEntry.consumed_at >= start_dt,
            FoodEntry.consumed_at <= end_dt
        )
        .all()
    )

    formatted_entries = []
    tot_cal, tot_prot, tot_carbs, tot_fat, tot_fiber, tot_salt = 0.0, 0.0, 0.0, 0.0, 0.0, 0.0

    for entry in entries:
        resp = build_food_entry_response(entry)
        formatted_entries.append(resp)
        if resp.nutrition.calories:
            tot_cal += resp.nutrition.calories
        if resp.nutrition.protein:
            tot_prot += resp.nutrition.protein
        if resp.nutrition.carbs:
            tot_carbs += resp.nutrition.carbs
        if resp.nutrition.fat:
            tot_fat += resp.nutrition.fat
        if resp.nutrition.fiber:
            tot_fiber += resp.nutrition.fiber
        if resp.nutrition.salt:
            tot_salt += resp.nutrition.salt

    # Get user goal
    goal = db.query(DailyGoal).filter(DailyGoal.user_id == current_user.id).first()
    goal_resp = DailyGoalResponse.from_orm(goal) if goal else DailyGoalResponse(id=0, user_id=current_user.id, calories=2200, protein=180, carbs=220, fat=70, updated_at=datetime.datetime.utcnow())

    return DailySummary(
        date=date_str,
        total_calories=round(tot_cal, 1),
        total_protein=round(tot_prot, 1),
        total_carbs=round(tot_carbs, 1),
        total_fat=round(tot_fat, 1),
        total_fiber=round(tot_fiber, 1),
        total_salt=round(tot_salt, 1),
        goal=goal_resp,
        remaining_calories=round(goal_resp.calories - tot_cal, 1),
        remaining_protein=round(goal_resp.protein - tot_prot, 1),
        remaining_carbs=round(goal_resp.carbs - tot_carbs, 1),
        remaining_fat=round(goal_resp.fat - tot_fat, 1),
        entries=formatted_entries
    )

@router.get("/today", response_model=DailySummary)
def get_today_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today_str = datetime.date.today().isoformat()
    return get_diary_by_date(today_str, db, current_user)

@router.post("/", response_model=FoodEntryResponse, status_code=201)
def add_food_entry(
    entry_in: FoodEntryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = db.query(Product).filter(Product.id == entry_in.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado.")

    consumed_time = entry_in.consumed_at or datetime.datetime.utcnow()

    entry = FoodEntry(
        user_id=current_user.id,
        meal_type=entry_in.meal_type,
        product_id=entry_in.product_id,
        quantity=entry_in.quantity,
        unit=entry_in.unit,
        consumed_at=consumed_time
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    return build_food_entry_response(entry)

@router.delete("/{entry_id}", status_code=204)
def delete_food_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    entry = db.query(FoodEntry).filter(FoodEntry.id == entry_id, FoodEntry.user_id == current_user.id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entrada de alimento não encontrada.")

    db.delete(entry)
    db.commit()
    return None
