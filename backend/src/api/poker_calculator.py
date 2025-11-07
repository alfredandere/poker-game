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
    Calculate payoffs for a 6-player hand in No Limit Texas Hold'em using pokerkit.
    
    Args:
        stacks: List of 6 starting stack sizes
        dealer_position: Index of dealer (0-5)
        small_blind_position: Index of small blind (0-5)
        big_blind_position: Index of big blind (0-5)
        hole_cards: List of 6 hole card strings (e.g., "AsKs")
        actions: String of actions (e.g., "f,c,r200,a1000,c,FLOP:6dQsQd,x,TURN:9s,x,RIVER:8s,x")
        board_cards: String of board cards (e.g., "6dQsQd9s8s")
    
    Returns:
        List of 6 payoffs (positive = won, negative = lost)
    """
    if len(stacks) != 6 or len(hole_cards) != 6:
        raise ValueError("Must have exactly 6 players and 6 sets of hole cards")

    # Create state using positional arguments only
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
        True,           # uniform_antes
        0,              # antes
        (20, 40),       # blinds_or_straddles
        40,             # min_bet
        tuple(stacks),  # starting_stacks
        6,              # player_count
    )

    # Set dealer position
    state.button_index = dealer_position

    # Deal hole cards
    for cards in hole_cards:
        if cards and cards.strip():
            state.deal_hole(cards)

    # Parse and apply actions (UPDATED to handle frontend format)
    action_list = parse_actions(actions, board_cards)

    for action_type, amount in action_list:
        try:
            if action_type == "fold":
                state.fold()
            elif action_type in ("check", "call"):
                state.check_or_call()
            elif action_type in ("bet", "raise"):
                state.complete_bet_or_raise_to(amount)
            elif action_type == "allin":
                player_idx = state.actor_index
                if player_idx is not None:
                    total_allin = state.bets[player_idx] + state.stacks[player_idx]
                    state.complete_bet_or_raise_to(total_allin)
            elif action_type in ("flop", "turn", "river"):
                state.burn_card()
                state.deal_board(amount)
        except Exception as e:
            raise RuntimeError(f"Action '{action_type}' with amount '{amount}' failed: {e}")

    # Calculate payoffs
    payoffs = [int(final - start) for final, start in zip(state.stacks, stacks)]
    return payoffs


def parse_actions(actions: str, board_cards: str) -> List[Tuple[str, any]]:
    """
    Enhanced parser that handles both frontend format and provides better error messages.
    """
    if not actions:
        return []

    parts = [p.strip() for p in actions.split(',') if p.strip()]
    parsed = []
    
    extracted_flop = ""
    extracted_turn = "" 
    extracted_river = ""

    for part in parts:
        try:
            if part == "f":
                parsed.append(("fold", 0))
            elif part == "x":
                parsed.append(("check", 0))
            elif part == "c":
                parsed.append(("call", 0))
            elif part.startswith("b"):
                amount = int(part[1:])
                parsed.append(("bet", amount))
            elif part.startswith("r"):
                amount = int(part[1:])
                parsed.append(("raise", amount))
            elif part.startswith("a"):
                if part[1:].isdigit():
                    parsed.append(("allin", int(part[1:])))
                else:
                    parsed.append(("allin", 0))
            elif part.startswith("FLOP:"):
                extracted_flop = part[5:]
            elif part.startswith("TURN:"):
                extracted_turn = part[5:]
            elif part.startswith("RIVER:"):
                extracted_river = part[6:]
            else:
                print(f"Warning: Unknown action '{part}', skipping")
                
        except ValueError as e:
            raise ValueError(f"Invalid action format '{part}': {e}")

    if board_cards and board_cards.strip():
        board_cards = board_cards.strip()
        flop_cards = board_cards[:6] if len(board_cards) >= 6 else ""
        turn_card = board_cards[6:8] if len(board_cards) >= 8 else ""
        river_card = board_cards[8:10] if len(board_cards) >= 10 else ""
    else:
        flop_cards = extracted_flop
        turn_card = extracted_turn
        river_card = extracted_river

    if flop_cards:
        parsed.append(("flop", flop_cards))
    if turn_card:
        parsed.append(("turn", turn_card))
    if river_card:
        parsed.append(("river", river_card))

    return parsed