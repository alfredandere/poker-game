import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch
from uuid import uuid4

from main import app
from src.domain.hand import Hand

client = TestClient(app)


@pytest.fixture
def mock_repository():
    """Mock the HandRepository to avoid database calls."""
    with patch('src.api.hands.repository') as mock_repo:
        yield mock_repo


def test_root_endpoint():
    """Test the root health check endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "message": "Poker API is running"}


def test_create_hand(mock_repository):
    """Test creating a new hand."""
    # Setup mock
    hand_id = uuid4()
    mock_hand = Hand(
        id=hand_id,
        stacks=[1000, 1000, 1000, 1000, 1000, 1000],
        dealer_position=0,
        small_blind_position=1,
        big_blind_position=2,
        hole_cards=["AsKd", "2h3c", "7h8h", "QsQd", "JhTh", "9s9c"],
        actions="f,f,f,f,f",
        board_cards="",
        payoffs=[20, -20, 0, 0, 0, 0]  # Example payoffs
    )
    mock_repository.save.return_value = mock_hand
    
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
    
    # Debug: print response if it fails
    if response.status_code != 201:
        print(f"Response: {response.json()}")
    
    assert response.status_code == 201
    
    data = response.json()
    assert "id" in data
    assert data["stacks"] == hand_data["stacks"]
    assert "payoffs" in data
    assert len(data["payoffs"]) == 6


def test_get_hands(mock_repository):
    """Test retrieving all hands."""
    # Setup mock
    mock_hands = [
        Hand(
            id=uuid4(),
            stacks=[1000, 1000, 1000, 1000, 1000, 1000],
            dealer_position=0,
            small_blind_position=1,
            big_blind_position=2,
            hole_cards=["AsKd", "2h3c", "7h8h", "QsQd", "JhTh", "9s9c"],
            actions="f,f,f,f,f",
            board_cards="",
            payoffs=[20, -20, 0, 0, 0, 0]
        )
    ]
    mock_repository.find_all.return_value = mock_hands
    
    response = client.get("/api/hands")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert len(response.json()) == 1


def test_get_hand_not_found(mock_repository):
    """Test retrieving a non-existent hand."""
    # Setup mock to return None
    mock_repository.find_by_id.return_value = None
    
    fake_id = "00000000-0000-0000-0000-000000000000"
    response = client.get(f"/api/hands/{fake_id}")
    assert response.status_code == 404


def test_create_hand_invalid_hole_cards(mock_repository):
    """Test creating a hand with invalid hole cards."""
    hand_data = {
        "stacks": [1000, 1000, 1000, 1000, 1000, 1000],
        "dealer_position": 0,
        "small_blind_position": 1,
        "big_blind_position": 2,
        "hole_cards": ["AsK", "2h3c", "7h8h", "QsQd", "JhTh", "9s9c"],  # Invalid
        "actions": "f,f,f,f,f",
        "board_cards": "",
    }
    
    response = client.post("/api/hands", json=hand_data)
    assert response.status_code == 422


def test_create_hand_empty_actions(mock_repository):
    """Test creating a hand with empty actions."""
    hand_data = {
        "stacks": [1000, 1000, 1000, 1000, 1000, 1000],
        "dealer_position": 0,
        "small_blind_position": 1,
        "big_blind_position": 2,
        "hole_cards": ["AsKd", "2h3c", "7h8h", "QsQd", "JhTh", "9s9c"],
        "actions": "",
        "board_cards": "",
    }
    
    response = client.post("/api/hands", json=hand_data)
    assert response.status_code == 422