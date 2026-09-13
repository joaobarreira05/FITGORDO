import pytest

def test_root_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["app"] == "FITGORDO API"
    assert data["status"] == "ok"

def test_user_register_and_login(client):
    # Register user
    reg_resp = client.post("/api/v1/auth/register", json={
        "email": "teste@fitgordo.com",
        "password": "Password123!"
    })
    assert reg_resp.status_code == 200
    data = reg_resp.json()
    assert "access_token" in data
    assert data["user"]["email"] == "teste@fitgordo.com"

    # Login user
    login_resp = client.post("/api/v1/auth/token", data={
        "username": "teste@fitgordo.com",
        "password": "Password123!"
    })
    assert login_resp.status_code == 200
    token_data = login_resp.json()
    assert "access_token" in token_data

def test_create_and_get_product(client):
    # Register user to get token
    reg = client.post("/api/v1/auth/register", json={
        "email": "produser@fitgordo.com",
        "password": "Password123!"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create product
    prod_resp = client.post("/api/v1/products/", json={
        "name": "Peito de Peru",
        "brand": "Nobre",
        "barcode": "5601234567890",
        "calories_per_100": 105.0,
        "protein_per_100": 22.0,
        "carbs_per_100": 1.0,
        "fat_per_100": 2.0
    }, headers=headers)
    assert prod_resp.status_code == 201
    prod_data = prod_resp.json()
    assert prod_data["name"] == "Peito de Peru"
    assert prod_data["barcode"] == "5601234567890"

    # Fetch by barcode
    bc_resp = client.get("/api/v1/products/barcode/5601234567890", headers=headers)
    assert bc_resp.status_code == 200
    assert bc_resp.json()["id"] == prod_data["id"]
