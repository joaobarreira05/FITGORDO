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

def test_endpoints_without_trailing_slash_no_405(client):
    # Register user
    reg = client.post("/api/v1/auth/register", json={
        "email": "slashuser@fitgordo.com",
        "password": "Password123!"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Product without slash
    p_resp = client.post("/api/v1/products", json={"name": "Banana da Madeira"}, headers=headers)
    assert p_resp.status_code == 201
    prod_id = p_resp.json()["id"]

    # 2. Diary entry without slash
    d_resp = client.post("/api/v1/diary", json={
        "meal_type": "Almoço",
        "product_id": prod_id,
        "quantity": 120
    }, headers=headers)
    assert d_resp.status_code == 201

    # 3. Meals without slash
    m_resp = client.post("/api/v1/meals", json={
        "name": "Lanche da Tarde",
        "items": [{"product_id": prod_id, "quantity": 100, "unit": "g"}]
    }, headers=headers)
    assert m_resp.status_code == 201

    # 4. Goals without slash
    g_resp = client.put("/api/v1/goals", json={
        "calories": 2100.0,
        "protein": 170.0,
        "carbs": 210.0,
        "fat": 65.0
    }, headers=headers)
    assert g_resp.status_code == 200

    # 5. Weight without slash
    w_resp = client.post("/api/v1/weight", json={"weight": 79.5}, headers=headers)
    assert w_resp.status_code == 201

def test_anonymous_product_access(client):
    # Anonymous product creation without token
    anon_p = client.post("/api/v1/products", json={"name": "Arroz Agulha", "calories_per_100": 130.0})
    assert anon_p.status_code == 201
    p_id = anon_p.json()["id"]

    # Anonymous product fetch by id
    get_p = client.get(f"/api/v1/products/{p_id}")
    assert get_p.status_code == 200
    assert get_p.json()["name"] == "Arroz Agulha"

def test_anonymous_diary_access_and_slices(client):
    # 1. Create a bread product anonymously
    bread_resp = client.post("/api/v1/products", json={
        "name": "Pão de Forma Integral",
        "brand": "Bimbo",
        "calories_per_100": 240.0,
        "protein_per_100": 9.0,
        "carbs_per_100": 42.0,
        "fat_per_100": 3.0,
        "serving_size": 28.0
    })
    assert bread_resp.status_code == 201
    bread_id = bread_resp.json()["id"]

    # 2. Add 2 slices to Pequeno-almoço anonymously (without Authorization header)
    entry_resp = client.post("/api/v1/diary", json={
        "meal_type": "Pequeno-almoço",
        "product_id": bread_id,
        "quantity": 2,
        "unit": "fatias"
    })
    assert entry_resp.status_code == 201
    entry_data = entry_resp.json()
    assert entry_data["meal_type"] == "Pequeno-almoço"
    assert entry_data["quantity"] == 2
    assert entry_data["unit"] == "fatias"
    # 2 slices * 28g = 56g. 240 kcal * 0.56 = 134.4 kcal
    assert entry_data["nutrition"]["calories"] == 134.4

    # 3. Retrieve today's diary summary anonymously
    summary_resp = client.get("/api/v1/diary/today")
    assert summary_resp.status_code == 200
    summary = summary_resp.json()
    assert len(summary["entries"]) >= 1
    assert any(e["product_id"] == bread_id for e in summary["entries"])


