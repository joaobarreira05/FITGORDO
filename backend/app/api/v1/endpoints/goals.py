from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.all_models import DailyGoal, User
from app.schemas.schemas import DailyGoalUpdate, DailyGoalResponse
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=DailyGoalResponse)
def get_daily_goals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goal = db.query(DailyGoal).filter(DailyGoal.user_id == current_user.id).first()
    if not goal:
        goal = DailyGoal(user_id=current_user.id, calories=2200.0, protein=180.0, carbs=220.0, fat=70.0)
        db.add(goal)
        db.commit()
        db.refresh(goal)
    return goal

@router.put("/", response_model=DailyGoalResponse)
def update_daily_goals(
    goal_in: DailyGoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goal = db.query(DailyGoal).filter(DailyGoal.user_id == current_user.id).first()
    if not goal:
        goal = DailyGoal(user_id=current_user.id)
        db.add(goal)

    goal.calories = goal_in.calories
    goal.protein = goal_in.protein
    goal.carbs = goal_in.carbs
    goal.fat = goal_in.fat

    db.commit()
    db.refresh(goal)
    return goal
