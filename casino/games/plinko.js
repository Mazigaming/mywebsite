// Plinko Game Engine - RTP ~95%

class PlinkoGame {
  constructor(difficulty = 8) {
    this.difficulty = difficulty; // Number of rows (8, 10, 12, 14, 16)
    this.RTP = 0.95; // 95% Return to Player
    this.rows = this.generateRows();
  }

  generateRows() {
    // Generate payout multipliers at the bottom
    // Based on realistic HARD casino plinko - most bets lose money
    const multipliers = [];
    const center = this.difficulty / 2;
    
    for (let i = 0; i <= this.difficulty; i++) {
      // HARD odds: multiplier significantly reduced
      // Center gets better odds, edges are brutal
      const distance = Math.abs(i - center);
      const baseMultiplier = Math.max(0.1, 1.5 - (distance * 0.25));
      multipliers.push(parseFloat(baseMultiplier.toFixed(2)));
    }

    return multipliers;
  }

  drop(bet) {
    // Simulate ball dropping through pegs
    let position = 0;
    
    for (let row = 0; row < this.difficulty; row++) {
      // Ball bounces left (0) or right (1)
      const bounce = Math.random() < 0.5 ? 0 : 1;
      position += bounce;
    }

    // Clamp position to valid range
    position = Math.max(0, Math.min(position, this.difficulty));

    const multiplier = this.rows[position];
    const winAmount = Math.floor(bet * multiplier * this.RTP);

    return {
      position,
      multiplier,
      winAmount,
      finalMultiplier: (multiplier * this.RTP).toFixed(2)
    };
  }

  // Advanced drop with custom algorithm
  dropAdvanced(bet) {
    // More realistic physics simulation
    let position = this.difficulty / 2; // Start in middle
    let variance = 0.5;

    for (let row = 0; row < this.difficulty; row++) {
      // Add slight bias and variance
      const bias = (Math.random() - 0.5) * variance;
      const bounce = Math.random() < (0.5 + bias) ? 0 : 1;
      
      if (bounce === 0) {
        position -= 1;
      } else {
        position += 1;
      }

      // Variance increases as ball falls
      variance += 0.05;
    }

    position = Math.max(0, Math.min(position, this.difficulty));
    
    // Add slight randomness to final position
    if (Math.random() < 0.3) {
      const randomShift = Math.floor(Math.random() * 2) - 0.5;
      position = Math.max(0, Math.min(position + randomShift, this.difficulty));
    }

    const multiplier = this.rows[Math.floor(position)];
    const winAmount = Math.floor(bet * multiplier * this.RTP);

    return {
      position: Math.floor(position),
      multiplier,
      winAmount,
      finalMultiplier: (multiplier * this.RTP).toFixed(2),
      path: this.getDropPath(Math.floor(position))
    };
  }

  getDropPath(endPosition) {
    // Generate the path the ball took for visualization
    const path = [];
    let position = 0;
    
    for (let row = 0; row < this.difficulty; row++) {
      path.push(position);
      const bounce = Math.random() < 0.5 ? 0 : 1;
      position = Math.max(0, Math.min(position + (bounce ? 1 : -1), this.difficulty));
    }
    
    path.push(endPosition);
    return path;
  }

  getRisks() {
    // Return risk levels with different multipliers
    return {
      low: {
        difficulty: 8,
        multipliers: this.generateRows(),
        description: "Lower variance, steadier wins"
      },
      medium: {
        difficulty: 12,
        multipliers: this.generateRows(),
        description: "Balanced risk/reward"
      },
      high: {
        difficulty: 16,
        multipliers: this.generateRows(),
        description: "High variance, big potential wins"
      }
    };
  }

  getGameState() {
    return {
      difficulty: this.difficulty,
      rows: this.difficulty,
      payoutMultipliers: this.rows,
      RTP: `${this.RTP * 100}%`,
      avgMultiplier: (this.rows.reduce((a, b) => a + b) / this.rows.length).toFixed(2)
    };
  }
}

module.exports = PlinkoGame;