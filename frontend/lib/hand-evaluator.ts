export const HAND_RANKS = {
  ROYAL_FLUSH: 10,
  STRAIGHT_FLUSH: 9,
  FOUR_OF_A_KIND: 8,
  FULL_HOUSE: 7,
  FLUSH: 6,
  STRAIGHT: 5,
  THREE_OF_A_KIND: 4,
  TWO_PAIR: 3,
  ONE_PAIR: 2,
  HIGH_CARD: 1
} as const;

export interface HandRank {
  rank: number;
  name: string;
  value: number;
  kickers: number[];
}

// Card value mapping
const CARD_VALUES: { [key: string]: number } = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

const SUITS = ['h', 'd', 'c', 's'] as const;

// Define proper TypeScript interfaces
interface Card {
  rank: string;
  suit: string;
  value: number;
}

interface FlushResult {
  suit: string;
  cards: Card[];
}

interface StraightResult {
  highest: number;
}

interface GroupedCards {
  [key: number]: Card[];
}

export function evaluateHand(holeCards: string[], boardCards: string[]): HandRank {
  const allCards = [...holeCards, ...boardCards];
  
  // Parse cards with proper typing
  const parsedCards: Card[] = allCards.map(card => ({
    rank: card[0],
    suit: card[1],
    value: CARD_VALUES[card[0]]
  }));

  // Sort by value descending
  const sortedCards = [...parsedCards].sort((a, b) => b.value - a.value);

  // Check for flush
  const flush = checkFlush(parsedCards);
  if (flush) {
    // Check for straight flush and royal flush
    const straightFlush = checkStraight(flush.cards);
    if (straightFlush) {
      if (straightFlush.highest === 14) { // Ace high straight flush
        return {
          rank: HAND_RANKS.ROYAL_FLUSH,
          name: 'Royal Flush',
          value: straightFlush.highest,
          kickers: []
        };
      }
      return {
        rank: HAND_RANKS.STRAIGHT_FLUSH,
        name: 'Straight Flush',
        value: straightFlush.highest,
        kickers: []
      };
    }
    
    // Regular flush
    return {
      rank: HAND_RANKS.FLUSH,
      name: 'Flush',
      value: flush.cards[0].value,
      kickers: flush.cards.slice(1, 5).map(c => c.value)
    };
  }

  // Check for other hand types
  const groups = groupByValue(parsedCards);
  
  // Four of a kind
  const fourOfAKind = Object.entries(groups).find(([_, cards]) => cards.length === 4);
  if (fourOfAKind) {
    const kicker = sortedCards.find(card => card.value !== parseInt(fourOfAKind[0]))!.value;
    return {
      rank: HAND_RANKS.FOUR_OF_A_KIND,
      name: 'Four of a Kind',
      value: parseInt(fourOfAKind[0]),
      kickers: [kicker]
    };
  }

  // Full house
  const threeOfAKind = Object.entries(groups).find(([_, cards]) => cards.length === 3);
  const pairs = Object.entries(groups).filter(([_, cards]) => cards.length === 2);
  if (threeOfAKind && pairs.length > 0) {
    const pairValues = pairs.map(([value]) => parseInt(value)).sort((a, b) => b - a);
    return {
      rank: HAND_RANKS.FULL_HOUSE,
      name: 'Full House',
      value: parseInt(threeOfAKind[0]),
      kickers: [pairValues[0]]
    };
  }

  // Straight
  const straight = checkStraight(sortedCards);
  if (straight) {
    return {
      rank: HAND_RANKS.STRAIGHT,
      name: 'Straight',
      value: straight.highest,
      kickers: []
    };
  }

  // Three of a kind
  if (threeOfAKind) {
    const kickers = sortedCards
      .filter(card => card.value !== parseInt(threeOfAKind[0]))
      .slice(0, 2)
      .map(c => c.value);
    return {
      rank: HAND_RANKS.THREE_OF_A_KIND,
      name: 'Three of a Kind',
      value: parseInt(threeOfAKind[0]),
      kickers
    };
  }

  // Two pair
  if (pairs.length >= 2) {
    const pairValues = pairs.map(([value]) => parseInt(value)).sort((a, b) => b - a);
    const kicker = sortedCards.find(card => !pairValues.includes(card.value))!.value;
    return {
      rank: HAND_RANKS.TWO_PAIR,
      name: 'Two Pair',
      value: pairValues[0],
      kickers: [pairValues[1], kicker]
    };
  }

  // One pair
  if (pairs.length === 1) {
    const pairValue = parseInt(pairs[0][0]);
    const kickers = sortedCards
      .filter(card => card.value !== pairValue)
      .slice(0, 3)
      .map(c => c.value);
    return {
      rank: HAND_RANKS.ONE_PAIR,
      name: 'One Pair',
      value: pairValue,
      kickers
    };
  }

  // High card
  return {
    rank: HAND_RANKS.HIGH_CARD,
    name: 'High Card',
    value: sortedCards[0].value,
    kickers: sortedCards.slice(1, 5).map(c => c.value)
  };
}

// Helper functions with proper typing
function groupByValue(cards: Card[]): GroupedCards {
  return cards.reduce((groups: GroupedCards, card) => {
    if (!groups[card.value]) {
      groups[card.value] = [];
    }
    groups[card.value].push(card);
    return groups;
  }, {} as GroupedCards);
}

function checkFlush(cards: Card[]): FlushResult | null {
  const suitGroups = cards.reduce((groups: { [key: string]: Card[] }, card) => {
    if (!groups[card.suit]) {
      groups[card.suit] = [];
    }
    groups[card.suit].push(card);
    return groups;
  }, {} as { [key: string]: Card[] });

  for (const [suit, suitedCards] of Object.entries(suitGroups)) {
    if (suitedCards.length >= 5) {
      return {
        suit,
        cards: suitedCards.sort((a, b) => b.value - a.value).slice(0, 5)
      };
    }
  }
  return null;
}

function checkStraight(cards: Card[]): StraightResult | null {
  const uniqueValues = [...new Set(cards.map(c => c.value))].sort((a, b) => b - a);
  
  // Check for regular straight
  for (let i = 0; i <= uniqueValues.length - 5; i++) {
    if (uniqueValues[i] - uniqueValues[i + 4] === 4) {
      return { highest: uniqueValues[i] };
    }
  }
  
  // Check for wheel straight (A-2-3-4-5)
  if (uniqueValues.includes(14) && uniqueValues.includes(5) && uniqueValues.includes(4) && 
      uniqueValues.includes(3) && uniqueValues.includes(2)) {
    return { highest: 5 }; // 5 is the highest card in wheel
  }
  
  return null;
}

export function compareHands(hand1: HandRank, hand2: HandRank): number {
  if (hand1.rank !== hand2.rank) {
    return hand2.rank - hand1.rank;
  }
  
  if (hand1.value !== hand2.value) {
    return hand1.value - hand2.value;
  }
  
  for (let i = 0; i < Math.min(hand1.kickers.length, hand2.kickers.length); i++) {
    if (hand1.kickers[i] !== hand2.kickers[i]) {
      return hand1.kickers[i] - hand2.kickers[i];
    }
  }
  
  return 0;
}