export const PLAYER_NAMES = [
  "Alex Chen", "Maria Garcia", "James Wilson", "Sarah Johnson", 
  "Mike Brown", "Lisa Davis", "Tom Miller", "Emma Taylor",
  "David Lee", "Sophia Martinez", "Chris Moore", "Anna Clark"
];

export const POKER_NICKNAMES = [
  "Ace Hunter", "Card Shark", "Bluff Master", "Pocket Rocket",
  "River Rat", "All-In Andy", "Check-Raise Charlie", "Fold King",
  "Chip Stack", "The Professor", "Lucky Lucy", "Tight Tony"
];

export function getRandomNames(count: number): { name: string; isYou: boolean }[] {
  const allNames = [...PLAYER_NAMES, ...POKER_NICKNAMES];
  const shuffled = [...allNames].sort(() => 0.5 - Math.random());
  const selectedNames = shuffled.slice(0, count - 1);
  
  // Randomly insert "You" at a random position
  const youIndex = Math.floor(Math.random() * count);
  selectedNames.splice(youIndex, 0, "You");
  
  return selectedNames.map((name, index) => ({
    name,
    isYou: name === "You"
  }));
}