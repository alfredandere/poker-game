from dataclasses import dataclass, field
from typing import List, Dict
from uuid import UUID, uuid4

@dataclass
class Hand:
    """Represents a completed poker hand."""
    
    id: UUID = field(default_factory=uuid4)
    stacks: List[int] = field(default_factory=list)
    dealer_position: int = 0
    small_blind_position: int = 0
    big_blind_position: int = 0
    hole_cards: List[str] = field(default_factory=list)
    actions: str = ""
    board_cards: str = ""
    payoffs: List[int] = field(default_factory=list)
    
    def to_dict(self) -> dict:
        """Convert hand to dictionary."""
        return {
            "id": str(self.id),
            "stacks": self.stacks,
            "dealer_position": self.dealer_position,
            "small_blind_position": self.small_blind_position,
            "big_blind_position": self.big_blind_position,
            "hole_cards": self.hole_cards,
            "actions": self.actions,
            "board_cards": self.board_cards,
            "payoffs": self.payoffs,
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> "Hand":
        """Create hand from dictionary."""
        return cls(
            id=UUID(data["id"]) if isinstance(data["id"], str) else data["id"],
            stacks=data["stacks"],
            dealer_position=data["dealer_position"],
            small_blind_position=data["small_blind_position"],
            big_blind_position=data["big_blind_position"],
            hole_cards=data["hole_cards"],
            actions=data["actions"],
            board_cards=data.get("board_cards", ""),
            payoffs=data["payoffs"],
        )