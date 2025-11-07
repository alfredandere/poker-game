import json
from typing import List, Optional
from uuid import UUID

from src.database.connection import get_db_connection
from src.domain.hand import Hand


class HandRepository:
    """Repository for managing hand persistence."""
    
    def save(self, hand: Hand) -> Hand:
        """Save a hand to the database."""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            """
            INSERT INTO hands (
                id, stacks, dealer_position, small_blind_position,
                big_blind_position, hole_cards, actions, board_cards, payoffs
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (
                str(hand.id),
                json.dumps(hand.stacks),
                hand.dealer_position,
                hand.small_blind_position,
                hand.big_blind_position,
                json.dumps(hand.hole_cards),
                hand.actions,
                hand.board_cards,
                json.dumps(hand.payoffs),
            ),
        )
        
        conn.commit()
        cursor.close()
        return hand
    
    def find_by_id(self, hand_id: UUID) -> Optional[Hand]:
        """Find a hand by ID."""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            """
            SELECT id, stacks, dealer_position, small_blind_position,
                   big_blind_position, hole_cards, actions, board_cards, payoffs
            FROM hands
            WHERE id = %s
            """,
            (str(hand_id),),
        )
        
        row = cursor.fetchone()
        cursor.close()
        
        if row is None:
            return None
        
        return Hand(
            id=UUID(row[0]),
            stacks=row[1],
            dealer_position=row[2],
            small_blind_position=row[3],
            big_blind_position=row[4],
            hole_cards=row[5],
            actions=row[6],
            board_cards=row[7] or "",
            payoffs=row[8],
        )
    
    def find_all(self, limit: int = 100) -> List[Hand]:
        """Find all hands, ordered by creation date descending."""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            """
            SELECT id, stacks, dealer_position, small_blind_position,
                   big_blind_position, hole_cards, actions, board_cards, payoffs
            FROM hands
            ORDER BY created_at DESC
            LIMIT %s
            """,
            (limit,),
        )
        
        rows = cursor.fetchall()
        cursor.close()
        
        hands = []
        for row in rows:
            hands.append(
                Hand(
                    id=UUID(row[0]),
                    stacks=row[1],
                    dealer_position=row[2],
                    small_blind_position=row[3],
                    big_blind_position=row[4],
                    hole_cards=row[5],
                    actions=row[6],
                    board_cards=row[7] or "",
                    payoffs=row[8],
                )
            )
        
        return hands