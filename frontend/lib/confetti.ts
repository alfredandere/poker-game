import confetti from 'canvas-confetti';

export const showConfetti = (playerName: string) => {
  // Main burst
  confetti({
    particleCount: 150,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff']
  });

  if (playerName === "You") {
    // Special celebration for human player
    setTimeout(() => {
      // Left side
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: ['#ff0000', '#ffff00']
      });

      // Right side
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: ['#00ff00', '#00ffff']
      });
    }, 250);

    // Final burst
    setTimeout(() => {
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00']
      });
    }, 500);
  }
};

export const showDealConfetti = () => {
  confetti({
    particleCount: 30,
    spread: 100,
    origin: { y: 0.6 },
    colors: ['#10b981', '#059669', '#047857'],
    decay: 0.9
  });
};