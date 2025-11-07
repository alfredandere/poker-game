from typing import List
from uuid import UUID

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from src.domain.hand import Hand
from src.repository.hand_repository import HandRepository
from src.api.poker_calculator import calculate_payoffs

router = APIRouter()
repository = HandRepository()

class CreateHandRequest(BaseModel):
    """Request model for creating a hand."""
    
    stacks: List[int] = Field(..., min_length=6, max_length=6)
    dealer_position: int = Field(..., ge=0, lt=6)
    small_blind_position: int = Field(..., ge=0, lt=6)
    big_blind_position: int = Field(..., ge=0, lt=6)
    hole_cards: List[str] = Field(..., min_length=6, max_length=6)
    actions: str
    board_cards: str = ""


class HandResponse(BaseModel):
    """Response model for a hand."""
    
    id: str
    stacks: List[int]
    dealer_position: int
    small_blind_position: int
    big_blind_position: int
    hole_cards: List[str]
    actions: str
    board_cards: str
    payoffs: List[int]


@router.post("", response_model=HandResponse, status_code=201)
async def create_hand(request: CreateHandRequest) -> HandResponse:
    """Create a new hand and calculate payoffs."""
    try:
        # Validate action format
        if not request.actions:
            raise HTTPException(status_code=422, detail="Actions cannot be empty")
            
        # Validate hole cards format
        for i, cards in enumerate(request.hole_cards):
            if len(cards) != 4:  # Should be exactly 4 characters like "AsKs"
                raise HTTPException(
                    status_code=422, 
                    detail=f"Invalid hole cards format for player {i}: '{cards}'. Expected format like 'AsKs'"
                )
        
        # Calculate payoffs using pokerkit
        payoffs = calculate_payoffs(
            stacks=request.stacks,
            dealer_position=request.dealer_position,
            small_blind_position=request.small_blind_position,
            big_blind_position=request.big_blind_position,
            hole_cards=request.hole_cards,
            actions=request.actions,
            board_cards=request.board_cards,
        )
        
        # Create hand entity
        hand = Hand(
            stacks=request.stacks,
            dealer_position=request.dealer_position,
            small_blind_position=request.small_blind_position,
            big_blind_position=request.big_blind_position,
            hole_cards=request.hole_cards,
            actions=request.actions,
            board_cards=request.board_cards,
            payoffs=payoffs,
        )
        
        # Save to repository
        saved_hand = repository.save(hand)
        
        return HandResponse(**saved_hand.to_dict())
    
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing hand: {str(e)}")

@router.get("", response_model=List[HandResponse])
async def get_hands(limit: int = 100) -> List[HandResponse]:
    """Get all hands."""
    hands = repository.find_all(limit=limit)
    return [HandResponse(**hand.to_dict()) for hand in hands]


@router.get("/{hand_id}", response_model=HandResponse)
async def get_hand(hand_id: UUID) -> HandResponse:
    """Get a specific hand by ID."""
    hand = repository.find_by_id(hand_id)
    
    if hand is None:
        raise HTTPException(status_code=404, detail="Hand not found")
    
    return HandResponse(**hand.to_dict())