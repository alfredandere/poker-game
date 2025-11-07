from typing import List, Tuple
from pokerkit import Automation, NoLimitTexasHoldem


def calculate_payoffs(
    stacks: List[int],
    dealer_position: int,
    small_blind_position: int,
    big_blind_position: int,
    hole_cards: List[str],
    actions: str,
    board_cards: str,
) -> List[int]:
    """
    Calculate payoffs for a 6-player Texas Hold'em hand.
    Handles all edge cases and provides clear error messages.
    """
    # Validation
    if len(stacks) != 6:
        raise ValueError(f"Expected 6 starting stacks, got {len(stacks)}")
    if len(hole_cards) != 6:
        raise ValueError(f"Expected 6 hole card sets, got {len(hole_cards)}")
    if any(stack < 0 for stack in stacks):
        raise ValueError("All stacks must be non-negative")
    if not (0 <= dealer_position < 6):
        raise ValueError(f"Invalid dealer position: {dealer_position}")
    if not (0 <= small_blind_position < 6):
        raise ValueError(f"Invalid small blind position: {small_blind_position}")
    if not (0 <= big_blind_position < 6):
        raise ValueError(f"Invalid big blind position: {big_blind_position}")

    try:
        # Create game state with exact 6-max rules
        state = NoLimitTexasHoldem.create_state(
            (
                Automation.ANTE_POSTING,
                Automation.BET_COLLECTION,
                Automation.BLIND_OR_STRADDLE_POSTING,
                Automation.HOLE_CARDS_SHOWING_OR_MUCKING,
                Automation.HAND_KILLING,
                Automation.CHIPS_PUSHING,
                Automation.CHIPS_PULLING,
            ),
            False,          # No uniform antes
            0,              # No ante
            (20, 40),       # Small blind: 20, Big blind: 40
            40,             # Minimum bet equals big blind
            tuple(stacks),  # Starting stacks
            6,              # 6 players
        )

        # Set positions
        state.button_index = dealer_position

        # Validate and deal hole cards
        for i, cards in enumerate(hole_cards):
            if not cards or len(cards) != 4:
                raise ValueError(f"Player {i}: Invalid hole cards '{cards}'. Expected format like 'AsKs'")
            
            # Validate card format
            if not (cards[0] in '23456789TJQKA' and cards[1] in 'hdcs' and
                    cards[2] in '23456789TJQKA' and cards[3] in 'hdcs'):
                raise ValueError(f"Player {i}: Invalid card format '{cards}'. Use format like 'AsKs'")
            
            state.deal_hole(cards)

        # Parse and apply actions
        action_list = parse_actions(actions, board_cards)
        
        for action_type, amount in action_list:
            try:
                # Check if hand is already complete
                if state.status is False:
                    break
                    
                apply_single_action(state, action_type, amount)
            except Exception as e:
                raise RuntimeError(f"Action '{action_type}' failed: {str(e)}")

        # Calculate final payoffs
        payoffs = [int(final - start) for final, start in zip(state.stacks, stacks)]
        return payoffs
        
    except ValueError as e:
        raise ValueError(f"Validation error: {str(e)}")
    except RuntimeError as e:
        raise RuntimeError(str(e))
    except Exception as e:
        raise RuntimeError(f"Hand calculation failed: {str(e)}")


def apply_single_action(state, action_type: str, amount: any) -> None:
    """Apply a single action with comprehensive error handling."""
    # Check if state is still active
    if state.status is False:
        return
    
    if action_type == "fold":
        if state.can_fold():
            state.fold()
        else:
            raise ValueError("Cannot fold in current state")
            
    elif action_type in ("check", "call"):
        if state.can_check_or_call():
            state.check_or_call()
        else:
            raise ValueError("Cannot check/call in current state")
            
    elif action_type in ("bet", "raise"):
        if not isinstance(amount, (int, float)) or amount <= 0:
            raise ValueError(f"Invalid bet/raise amount: {amount}")
        
        # Verify the amount is valid
        if state.can_complete_bet_or_raise_to(amount):
            state.complete_bet_or_raise_to(amount)
        else:
            # Try to go all-in if amount is too large
            player_idx = state.actor_index
            if player_idx is not None:
                total = state.bets[player_idx] + state.stacks[player_idx]
                if state.can_complete_bet_or_raise_to(total):
                    state.complete_bet_or_raise_to(total)
                else:
                    raise ValueError(f"Cannot bet/raise to {amount}")
            else:
                raise ValueError("No active player")
                
    elif action_type == "allin":
        player_idx = state.actor_index
        if player_idx is not None:
            total = state.bets[player_idx] + state.stacks[player_idx]
            if total > 0:
                if state.can_complete_bet_or_raise_to(total):
                    state.complete_bet_or_raise_to(total)
                else:
                    # Try check/call if can't raise
                    if state.can_check_or_call():
                        state.check_or_call()
                    else:
                        raise ValueError("Cannot go all-in")
            else:
                raise ValueError("Player has no chips")
        else:
            raise ValueError("No active player")
            
    elif action_type == "flop":
        if state.can_burn_card():
            state.burn_card()
        if state.can_deal_board():
            state.deal_board(amount)
        else:
            raise ValueError("Cannot deal flop")
            
    elif action_type == "turn":
        if state.can_burn_card():
            state.burn_card()
        if state.can_deal_board():
            state.deal_board(amount)
        else:
            raise ValueError("Cannot deal turn")
            
    elif action_type == "river":
        if state.can_burn_card():
            state.burn_card()
        if state.can_deal_board():
            state.deal_board(amount)
        else:
            raise ValueError("Cannot deal river")
    else:
        raise ValueError(f"Unknown action type: {action_type}")


def parse_actions(actions: str, board_cards: str) -> List[Tuple[str, any]]:
    """
    Parse action sequence with comprehensive error handling.
    Only includes player actions - board cards are handled separately.
    """
    if not actions:
        return []

    parsed = []
    parts = [p.strip() for p in actions.split(',') if p.strip()]

    for part in parts:
        try:
            if part == "f":
                parsed.append(("fold", 0))
            elif part == "x":
                parsed.append(("check", 0))
            elif part == "c":
                parsed.append(("call", 0))
            elif part.startswith("b") and len(part) > 1:
                try:
                    amount = int(part[1:])
                    if amount <= 0:
                        raise ValueError(f"Invalid bet amount: {amount}")
                    parsed.append(("bet", amount))
                except ValueError:
                    raise ValueError(f"Invalid bet format: {part}")
            elif part.startswith("r") and len(part) > 1:
                try:
                    amount = int(part[1:])
                    if amount <= 0:
                        raise ValueError(f"Invalid raise amount: {amount}")
                    parsed.append(("raise", amount))
                except ValueError:
                    raise ValueError(f"Invalid raise format: {part}")
            elif part == "allin":
                parsed.append(("allin", 0))
            elif part.startswith(("FLOP:", "TURN:", "RIVER:")):
                continue
            else:
                raise ValueError(f"Unknown action: {part}")
        except ValueError as e:
            raise ValueError(f"Invalid action '{part}': {str(e)}")

    # Add board cards at the end
    if board_cards and board_cards.strip():
        board = board_cards.strip()
        # Validate board cards format
        if len(board) % 2 != 0:
            raise ValueError(f"Invalid board cards length: {len(board)}")
        
        # Validate each card
        for i in range(0, len(board), 2):
            if i + 1 < len(board):
                rank, suit = board[i], board[i + 1]
                if rank not in '23456789TJQKA' or suit not in 'hdcs':
                    raise ValueError(f"Invalid card: {rank}{suit}")
        
        if len(board) >= 6:
            parsed.append(("flop", board[:6]))
        if len(board) >= 8:
            parsed.append(("turn", board[6:8]))
        if len(board) >= 10:
            parsed.append(("river", board[8:10]))

    return parsed