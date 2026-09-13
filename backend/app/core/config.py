import os
from typing import List, Union
from pydantic import AnyHttpUrl, validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "FITGORDO API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security & Auth
    SECRET_KEY: str = "FITGORDO_SUPER_SECRET_KEY_CHANGE_IN_PRODUCTION_123456789"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30  # 30 days for personal convenience
    
    # Database
    DATABASE_URL: str = "sqlite:///./fitgordo.db"  # Default fallback for simple local run without Postgres
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "https://fitgordo.vercel.app",
    ]

    # Open Food Facts (gratuito, sem auth para leitura)
    OPEN_FOOD_FACTS_API_URL: str = "https://world.openfoodfacts.org/api/v2"
    OPEN_FOOD_FACTS_PT_URL: str = "https://pt.openfoodfacts.org/api/v2"
    OFF_RATE_LIMIT_PER_MINUTE: int = 60  # recommended limit for anonymous requests

    # Nutritionix (opcional — fallback para alimentos genéricos sem barcode)
    # Registo gratuito em: https://developer.nutritionix.com (500 queries/dia)
    NUTRITIONIX_APP_ID: str = ""
    NUTRITIONIX_APP_KEY: str = ""

    @validator("DATABASE_URL", pre=True)
    def assemble_db_connection(cls, v: str) -> str:
        if isinstance(v, str) and v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql://", 1)
        return v

    class Config:
        case_sensitive = True
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
