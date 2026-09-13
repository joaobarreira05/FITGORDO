import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.all_models import WeightEntry, User
from app.schemas.schemas import WeightEntryCreate, WeightEntryResponse
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[WeightEntryResponse])
def get_weight_entries(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    since_date = datetime.datetime.utcnow() - datetime.timedelta(days=days)
    entries = (
        db.query(WeightEntry)
        .filter(WeightEntry.user_id == current_user.id, WeightEntry.recorded_at >= since_date)
        .order_by(WeightEntry.recorded_at.asc())
        .all()
    )
    return entries

@router.post("/", response_model=WeightEntryResponse, status_code=201)
def add_weight_entry(
    entry_in: WeightEntryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    recorded_time = entry_in.recorded_at or datetime.datetime.utcnow()
    entry = WeightEntry(
        user_id=current_user.id,
        weight=entry_in.weight,
        recorded_at=recorded_time
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

@router.delete("/{entry_id}", status_code=204)
def delete_weight_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    entry = db.query(WeightEntry).filter(WeightEntry.id == entry_id, WeightEntry.user_id == current_user.id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Registo de peso não encontrado.")

    db.delete(entry)
    db.commit()
    return None
