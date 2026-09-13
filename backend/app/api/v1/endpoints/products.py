from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.all_models import Product, User
from app.schemas.schemas import ProductCreate, ProductUpdate, ProductResponse
from app.services.product_service import ProductService
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[ProductResponse])
def get_products(
    search: Optional[str] = None,
    favorite: Optional[bool] = None,
    source: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Product)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Product.name.ilike(search_pattern)) | 
            (Product.brand.ilike(search_pattern)) |
            (Product.barcode == search)
        )
    if favorite is not None:
        query = query.filter(Product.favorite == favorite)
    if source:
        query = query.filter(Product.source == source)

    query = query.order_by(Product.updated_at.desc())
    return query.offset(offset).limit(limit).all()

@router.get("/barcode/{barcode}", response_model=ProductResponse)
def get_product_by_barcode(
    barcode: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product_service = ProductService(db)
    product = product_service.get_by_barcode(barcode)
    if not product:
        raise HTTPException(
            status_code=404,
            detail="Produto não encontrado localmente nem no Open Food Facts."
        )
    return product

@router.get("/{product_id}", response_model=ProductResponse)
def get_product_by_id(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado.")
    return product

@router.post("/", response_model=ProductResponse, status_code=201)
def create_product(
    product_in: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if product_in.barcode:
        existing = db.query(Product).filter(Product.barcode == product_in.barcode).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail="Já existe um produto com este código de barras."
            )

    product = Product(**product_in.dict())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product_in: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado.")

    update_data = product_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    return product

@router.post("/{product_id}/favorite", response_model=ProductResponse)
def toggle_favorite(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado.")
    
    product.favorite = not product.favorite
    db.commit()
    db.refresh(product)
    return product

@router.delete("/{product_id}", status_code=204)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado.")
    
    db.delete(product)
    db.commit()
    return None
