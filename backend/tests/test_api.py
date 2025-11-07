import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_root_endpoint():
    """Test the root health check endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "message": "Poker API is running"}


def test_create_hand():
    """Test creating a new hand."""
    hand_data = {
        "stacks": [1000, 1000, 1000, 1000, 1000, 1000],
        "dealer_position": 0,
        "small_blind_position": 1,
        "big_blind_position": 2,
        "hole_cards": ["AsKd", "2h3c", "7h8h", "QsQd", "JhTh", "9s9c"],
        "actions": "f,f,f,f,f",
        "board_cards": "",
    }
    
    response = client.post("/api/hands", json=hand_data)
    assert response.status_code == 201
    
    data = response.json()
    assert "id" in data
    assert data["stacks"] == hand_data["stacks"]
    assert "payoffs" in data
    assert len(data["payoffs"]) == 6


def test_get_hands():
    """Test retrieving all hands."""
    response = client.get("/api/hands")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_hand_not_found():
    """Test retrieving a non-existent hand."""
    fake_id = "00000000-0000-0000-0000-000000000000"
    response = client.get(f"/api/hands/{fake_id}")
    assert response.status_code == 404