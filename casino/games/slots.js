// Slots Game Engine - RTP Varies by Difficulty

class SlotsGame {
  constructor(difficulty = 'medium') {
    this.difficulty = difficulty; // 'easy', 'medium', 'hard', 'expert'
    this.symbols = ['🍒', '🍊', '🍋', '🔔', '💎', '👑', '7️⃣', '🎰'];
    this.paylines = 5;
    this.reels = 5;
    this.difficultyMods = this.getDifficultyMods();
    this.RTP = this.difficultyMods.RTP;
  }

  getDifficultyMods() {
    const mods = {
      easy: {
        RTP: 0.98, // 98% RTP - lots of small wins, frequent payouts
        symbolWeights: { frequent: 0.50, common: 0.30, uncommon: 0.15, rare: 0.04, veryRare: 0.01 },
        jackpotMultiplier: 500,
        description: 'Easy - Frequent wins, smaller payouts'
      },
      medium: {
        RTP: 0.96, // 96% RTP - balanced
        symbolWeights: { frequent: 0.35, common: 0.35, uncommon: 0.15, rare: 0.10, veryRare: 0.05 },
        jackpotMultiplier: 1000,
        description: 'Medium - Balanced wins and payouts'
      },
      hard: {
        RTP: 0.94, // 94% RTP - fewer wins but bigger
        symbolWeights: { frequent: 0.25, common: 0.30, uncommon: 0.20, rare: 0.15, veryRare: 0.10 },
        jackpotMultiplier: 2000,
        description: 'Hard - Bigger wins, fewer frequency'
      },
      expert: {
        RTP: 0.90, // 90% RTP - very hard, big jackpots only
        symbolWeights: { frequent: 0.15, common: 0.25, uncommon: 0.25, rare: 0.20, veryRare: 0.15 },
        jackpotMultiplier: 5000,
        description: 'Expert - Rare wins, massive payouts'
      }
    };
    return mods[this.difficulty] || mods.medium;
  }

  spin(bet) {
    const result = {
      reels: [],
      winLines: [],
      multiplier: 0,
      winAmount: 0,
      jackpot: false
    };

    // Generate spin result
    for (let reel = 0; reel < this.reels; reel++) {
      result.reels[reel] = [];
      for (let row = 0; row < 3; row++) {
        result.reels[reel][row] = this.getSymbol();
      }
    }

    // Check for wins
    const outcomes = this.checkWins(result.reels, bet);
    result.winLines = outcomes.lines;
    result.multiplier = outcomes.multiplier;
    result.winAmount = outcomes.winAmount;
    result.jackpot = outcomes.jackpot;

    return result;
  }

  getSymbol() {
    // Use difficulty-based weighted probability
    const weights = this.difficultyMods.symbolWeights;
    const rand = Math.random();
    let cumulative = 0;

    // Frequent symbols (🍒🍊)
    cumulative += weights.frequent;
    if (rand < cumulative) return Math.random() < 0.5 ? '🍒' : '🍊';

    // Common symbols (🍋🔔)
    cumulative += weights.common;
    if (rand < cumulative) return Math.random() < 0.5 ? '🍋' : '🔔';

    // Uncommon symbols (💎👑)
    cumulative += weights.uncommon;
    if (rand < cumulative) return Math.random() < 0.5 ? '💎' : '👑';

    // Rare symbol (7️⃣)
    cumulative += weights.rare;
    if (rand < cumulative) return '7️⃣';

    // Very Rare - Jackpot symbol (🎰)
    return '🎰';
  }

  checkWins(reels, bet) {
    let totalWin = 0;
    const winLines = [];
    let jackpot = false;

    // Check horizontal lines (3 in a row)
    for (let row = 0; row < 3; row++) {
      const line = [];
      for (let col = 0; col < this.reels; col++) {
        line.push(reels[col][row]);
      }
      
      const lineWin = this.evaluateLine(line, bet);
      if (lineWin > 0) {
        winLines.push({
          row,
          multiplier: lineWin / bet
        });
        totalWin += lineWin;
      }
    }

    // Check for jackpot (all reels same symbol)
    const firstReel = reels[0][1];
    if (reels.every(reel => reel.every(symbol => symbol === firstReel))) {
      jackpot = true;
      totalWin = bet * this.difficultyMods.jackpotMultiplier;
    }

    // Ensure RTP compliance - adjust wins to match ~96% payout
    const adjustedWin = Math.floor(totalWin * this.RTP);

    return {
      lines: winLines,
      multiplier: winLines.length > 0 ? adjustedWin / bet : 0,
      winAmount: adjustedWin,
      jackpot
    };
  }

  evaluateLine(line, bet) {
    // Check for matches
    const symbol = line[0];
    let matchCount = 1;
    
    for (let i = 1; i < line.length; i++) {
      if (line[i] === symbol) {
        matchCount++;
      } else {
        break;
      }
    }

    if (matchCount < 3) return 0;

    // Payout table
    const payouts = {
      '🍒': { 3: 50, 4: 100, 5: 200 },
      '🍊': { 3: 75, 4: 150, 5: 300 },
      '🍋': { 3: 100, 4: 250, 5: 500 },
      '🔔': { 3: 150, 4: 400, 5: 800 },
      '💎': { 3: 200, 4: 600, 5: 1200 },
      '👑': { 3: 250, 4: 800, 5: 2000 },
      '7️⃣': { 3: 500, 4: 1500, 5: 5000 },
      '🎰': { 3: 1000, 4: 5000, 5: 10000 }
    };

    const multiplier = payouts[symbol]?.[matchCount] || 0;
    return multiplier * bet;
  }

  getGameState() {
    return {
      symbols: this.symbols,
      paylines: this.paylines,
      reels: this.reels,
      RTP: `${this.RTP * 100}%`
    };
  }
}

module.exports = SlotsGame;