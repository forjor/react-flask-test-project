import json
import pytest


def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "ok"


def test_list_cats_empty(client):
    response = client.get("/api/cats")
    assert response.status_code == 200
    assert response.get_json() == []


def test_create_cat_default_name(client):
    response = client.post("/api/cats", json={})
    assert response.status_code == 201
    data = response.get_json()
    assert data["name"] == "Mystery Cat"
    assert "id" in data
    assert "image_url" in data
    assert "created_at" in data


def test_create_cat_custom_name(client):
    response = client.post("/api/cats", json={"name": "Whiskers"})
    assert response.status_code == 201
    data = response.get_json()
    assert data["name"] == "Whiskers"


def test_create_cat_no_body(client):
    response = client.post("/api/cats", content_type="application/json", data="")
    assert response.status_code == 201
    data = response.get_json()
    assert data["name"] == "Mystery Cat"


def test_list_cats_after_create(client):
    client.post("/api/cats", json={"name": "Fluffy"})
    client.post("/api/cats", json={"name": "Paws"})

    response = client.get("/api/cats")
    assert response.status_code == 200
    cats = response.get_json()
    assert len(cats) == 2
    names = {cat["name"] for cat in cats}
    assert names == {"Fluffy", "Paws"}


def test_list_cats_ordered_newest_first(client):
    client.post("/api/cats", json={"name": "First"})
    client.post("/api/cats", json={"name": "Second"})

    response = client.get("/api/cats")
    cats = response.get_json()
    # Most recently created is first
    assert cats[0]["name"] == "Second"
    assert cats[1]["name"] == "First"


def test_get_cat(client):
    create_resp = client.post("/api/cats", json={"name": "Mittens"})
    cat_id = create_resp.get_json()["id"]

    response = client.get(f"/api/cats/{cat_id}")
    assert response.status_code == 200
    data = response.get_json()
    assert data["id"] == cat_id
    assert data["name"] == "Mittens"


def test_get_cat_not_found(client):
    response = client.get("/api/cats/nonexistent-id")
    assert response.status_code == 404
    assert "error" in response.get_json()


def test_delete_cat(client):
    create_resp = client.post("/api/cats", json={"name": "Doomed Cat"})
    cat_id = create_resp.get_json()["id"]

    delete_resp = client.delete(f"/api/cats/{cat_id}")
    assert delete_resp.status_code == 200
    assert delete_resp.get_json()["message"] == "Cat deleted"

    get_resp = client.get(f"/api/cats/{cat_id}")
    assert get_resp.status_code == 404


def test_delete_cat_not_found(client):
    response = client.delete("/api/cats/nonexistent-id")
    assert response.status_code == 404
    assert "error" in response.get_json()


def test_delete_cat_removes_from_list(client):
    client.post("/api/cats", json={"name": "Keeper"})
    create_resp = client.post("/api/cats", json={"name": "Goner"})
    goner_id = create_resp.get_json()["id"]

    client.delete(f"/api/cats/{goner_id}")

    cats = client.get("/api/cats").get_json()
    assert len(cats) == 1
    assert cats[0]["name"] == "Keeper"


def test_image_url_is_unique(client):
    resp1 = client.post("/api/cats", json={"name": "Cat A"})
    resp2 = client.post("/api/cats", json={"name": "Cat B"})
    assert resp1.get_json()["image_url"] != resp2.get_json()["image_url"]
