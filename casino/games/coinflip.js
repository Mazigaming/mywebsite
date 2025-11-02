// Coinflip Game Engine - 50/50 Pure Luck

class CoinflipGame {
  constructor() {
    this.winRate = 0.50; // Exactly 50/50
  }

  flip(bet, playerChoice) {
    // playerChoice: 'heads' or 'tails'
    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    const win = result === playerChoice;

    return {
      playerChoice,
      result,
      win,
      bet,
      winAmount: win ? bet * 2 : 0,
      multiplier: win ? 2 : 0
    };
  }

  getGameState() {
    return {
      type: 'coinflip',
      description: '50/50 Pure Luck - Choose Heads or Tails',
      winRate: `${this.winRate * 100}%`
    };
  }
}

module.exports = CoinflipGame;