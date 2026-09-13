from fastapi import APIRouter
from app.api.v1.endpoints import auth, products, diary, meals, goals, weight

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(diary.router, prefix="/diary", tags=["diary"])
api_router.include_router(meals.router, prefix="/meals", tags=["meals"])
api_router.include_router(goals.router, prefix="/goals", tags=["goals"])
api_router.include_router(weight.router, prefix="/weight", tags=["weight"])
