export type GameStage = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
export type PlayerAction = 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'allin';

export interface Player {
  position: number;
  stack: number;
  bet: number;
  folded: boolean;
  holeCards: string;
  isDealer: boolean;
  isSmallBlind: boolean;
  isBigBlind: boolean;
}

export interface GameState {
  players: Player[];
  stage: GameStage;
  pot: number;
  currentBet: number;
  currentPlayer: number;
  dealerPosition: number;
  smallBlindPosition: number;
  bigBlindPosition: number;
  boardCards: string[];
  actionLog: string[];
  actionSequence: string[];
  minRaise: number;
  bigBlindSize: number;
  remainingDeck: string[];
}

const SUITS = ['h', 'd', 'c', 's'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];

function shuffleDeck(): string[] {
  const deck: string[] = [];
  for (const rank of RANKS) {
    for (const suit of SUITS) {
      deck.push(rank + suit);
    }
  }
  
  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  
  return deck;
}

export function createInitialState(stacks: number[]): GameState {
  const bigBlindSize = 40;
  const smallBlindSize = 20;
  const dealerPosition = 0;
  const smallBlindPosition = 1;
  const bigBlindPosition = 2;
  
  const deck = shuffleDeck();
  
  const players: Player[] = stacks.map((stack, index) => ({
    position: index,
    stack,
    bet: 0,
    folded: false,
    holeCards: deck[index * 2] + deck[index * 2 + 1],
    isDealer: index === dealerPosition,
    isSmallBlind: index === smallBlindPosition,
    isBigBlind: index === bigBlindPosition,
  }));
  
  // Post blinds
  players[smallBlindPosition].bet = smallBlindSize;
  players[smallBlindPosition].stack -= smallBlindSize;
  players[bigBlindPosition].bet = bigBlindSize;
  players[bigBlindPosition].stack -= bigBlindSize;
  
  // Store remaining deck (skip 12 dealt hole cards)
  const remainingDeck = deck.slice(12);
  
  return {
    players,
    stage: 'preflop',
    pot: smallBlindSize + bigBlindSize,
    currentBet: bigBlindSize,
    currentPlayer: (bigBlindPosition + 1) % 6,
    dealerPosition,
    smallBlindPosition,
    bigBlindPosition,
    boardCards: [],
    actionLog: [
      'New hand started',
      `Player ${smallBlindPosition} posts small blind ${smallBlindSize}`,
      `Player ${bigBlindPosition} posts big blind ${bigBlindSize}`,
    ],
    actionSequence: [],
    minRaise: bigBlindSize * 2,
    bigBlindSize,
    remainingDeck,
  };
}

export function getValidActions(state: GameState): Set<PlayerAction> {
  const player = state.players[state.currentPlayer];
  const actions = new Set<PlayerAction>();
  
  if (player.folded) return actions;
  
  const callAmount = state.currentBet - player.bet;
  const canCheck = callAmount === 0;
  
  // Can always fold
  actions.add('fold');
  
  // Check or call
  if (canCheck) {
    actions.add('check');
  } else if (callAmount > 0 && player.stack >= callAmount) {
    actions.add('call');
  }
  
  // Bet or raise
  if (state.currentBet === 0 && player.stack > 0) {
    actions.add('bet');
  } else if (state.currentBet > 0 && player.stack > callAmount) {
    actions.add('raise');
  }
  
  // All-in
  if (player.stack > 0) {
    actions.add('allin');
  }
  
  return actions;
}

function collectBets(state: GameState): void {
  let potTotal = state.pot;
  for (const player of state.players) {
    potTotal += player.bet;
    player.bet = 0;
  }
  state.pot = potTotal;
  state.currentBet = 0;
}

function findNextPlayer(state: GameState, start: number): number {
  for (let i = 1; i <= 6; i++) {
    const pos = (start + i) % 6;
    if (!state.players[pos].folded && state.players[pos].stack > 0) {
      return pos;
    }
  }
  return start;
}

function shouldAdvanceStage(state: GameState): boolean {
  const activePlayers = state.players.filter(p => !p.folded);
  
  if (activePlayers.length <= 1) return true;
  
  const playersWithChips = activePlayers.filter(p => p.stack > 0);
  if (playersWithChips.length === 0) return true;
  
  const maxBet = Math.max(...state.players.map(p => p.bet));
  const allMatched = activePlayers.every(p => p.bet === maxBet || p.stack === 0);
  
  return allMatched;
}

function advanceStage(state: GameState): void {
  collectBets(state);
  
  const stages: GameStage[] = ['preflop', 'flop', 'turn', 'river', 'showdown'];
  const currentIndex = stages.indexOf(state.stage);
  
  if (currentIndex < stages.length - 1) {
    state.stage = stages[currentIndex + 1];
    state.currentPlayer = findNextPlayer(state, state.dealerPosition);
    state.minRaise = state.bigBlindSize;
  }
}

export function performAction(
  state: GameState,
  action: PlayerAction,
  amount?: number
): GameState {
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  const player = newState.players[newState.currentPlayer];
  
  let logMessage = '';
  let shortAction = '';
  
  switch (action) {
    case 'fold':
      player.folded = true;
      logMessage = `Player ${player.position} folds`;
      shortAction = 'f';
      break;
      
    case 'check':
      logMessage = `Player ${player.position} checks`;
      shortAction = 'x';
      break;
      
    case 'call': {
      const callAmount = newState.currentBet - player.bet;
      const actualCall = Math.min(callAmount, player.stack);
      player.bet += actualCall;
      player.stack -= actualCall;
      logMessage = `Player ${player.position} calls ${actualCall}`;
      shortAction = 'c';
      break;
    }
      
    case 'bet':
      if (amount) {
        player.bet += amount;
        player.stack -= amount;
        newState.currentBet = amount;
        newState.minRaise = amount * 2;
        logMessage = `Player ${player.position} bets ${amount}`;
        shortAction = `b${amount}`;
      }
      break;
      
    case 'raise':
      if (amount) {
        const raiseAmount = amount - player.bet;
        player.bet = amount;
        player.stack -= raiseAmount;
        newState.currentBet = amount;
        newState.minRaise = amount + (amount - (newState.currentBet - raiseAmount));
        logMessage = `Player ${player.position} raises to ${amount}`;
        shortAction = `r${amount}`;
      }
      break;
      
    case 'allin': {
      const allInAmount = player.stack + player.bet;
      const allInStack = player.stack;
      player.stack = 0;
      player.bet = allInAmount;
      if (allInAmount > newState.currentBet) {
        newState.currentBet = allInAmount;
      }
      logMessage = `Player ${player.position} goes all-in for ${allInStack}`;
      shortAction = `a${allInAmount}`;
      break;
    }
  }
  
  newState.actionLog.push(logMessage);
  newState.actionSequence.push(shortAction);
  
  // Check if hand is over (only one player left)
  const activePlayers = newState.players.filter(p => !p.folded);
  if (activePlayers.length === 1) {
    newState.stage = 'showdown';
    return newState;
  }
  
  // Move to next player or advance stage
  if (shouldAdvanceStage(newState)) {
    advanceStage(newState);
  } else {
    newState.currentPlayer = findNextPlayer(newState, newState.currentPlayer);
  }
  
  return newState;
}

export function dealBoard(state: GameState): GameState {
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  
  if (newState.stage === 'flop' && newState.boardCards.length === 0) {
    // Burn one card, then deal flop
    newState.remainingDeck.shift(); // burn card
    newState.boardCards = [
      newState.remainingDeck.shift()!,
      newState.remainingDeck.shift()!,
      newState.remainingDeck.shift()!
    ];
    newState.actionLog.push(`Flop: ${newState.boardCards.join(' ')}`);
    newState.actionSequence.push(`FLOP:${newState.boardCards.join('')}`);
  } else if (newState.stage === 'turn' && newState.boardCards.length === 3) {
    // Burn one card, then deal turn
    newState.remainingDeck.shift(); // burn card
    const card = newState.remainingDeck.shift()!;
    newState.boardCards.push(card);
    newState.actionLog.push(`Turn: ${card}`);
    newState.actionSequence.push(`TURN:${card}`);
  } else if (newState.stage === 'river' && newState.boardCards.length === 4) {
    // Burn one card, then deal river
    newState.remainingDeck.shift(); // burn card
    const card = newState.remainingDeck.shift()!;
    newState.boardCards.push(card);
    newState.actionLog.push(`River: ${card}`);
    newState.actionSequence.push(`RIVER:${card}`);
  }
  
  return newState;
}

export function isHandComplete(state: GameState): boolean {
  return state.stage === 'showdown';
}