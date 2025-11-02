// Blackjack Game Engine - With Difficulty Levels

class BlackjackGame {
  constructor(gameId, difficulty = 'medium') {
    this.gameId = gameId;
    this.difficulty = difficulty; // 'easy', 'medium', 'hard', 'expert'
    this.deck = [];
    this.dealer = { hand: [], score: 0, bust: false };
    this.players = [];
    this.cardsUsed = 0;
    this.difficultyMods = this.getDifficultyMods();
  }

  getDifficultyMods() {
    const mods = {
      easy: {
        maxBet: 10,
        dealerHitSoft17: false,
        payoutMultiplier: 1.5,
        description: 'Easy - Max $10 bets, dealer friendly'
      },
      medium: {
        maxBet: 100,
        dealerHitSoft17: false,
        payoutMultiplier: 1.2,
        description: 'Medium - Max $100 bets'
      },
      hard: {
        maxBet: 1000,
        dealerHitSoft17: true,
        payoutMultiplier: 1.0,
        description: 'Hard - Max $1,000 bets, dealer hits soft 17'
      },
      expert: {
        maxBet: Infinity,
        dealerHitSoft17: true,
        payoutMultiplier: 0.9,
        description: 'Expert - Unlimited bets, house advantage'
      }
    };
    return mods[this.difficulty] || mods.medium;
  }

  addPlayer(playerId, bet, balance) {
    // Enforce max bet for difficulty
    const actualBet = Math.min(bet, this.difficultyMods.maxBet);
    
    if (actualBet !== bet) {
      console.warn(`Bet reduced from ${bet} to ${actualBet} due to ${this.difficulty} difficulty limit`);
    }

    this.players.push({
      id: playerId,
      bet: actualBet,
      balance,
      hand: [],
      score: 0,
      bust: false,
      blackjack: false,
      stand: false,
      result: null, // 'win', 'loss', 'push'
      winAmount: 0
    });
  }

  createDeck() {
    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const deck = [];
    
    // Use 6-deck shoe like real casinos
    for (let shoe = 0; shoe < 6; shoe++) {
      for (let suit of suits) {
        for (let rank of ranks) {
          deck.push({ suit, rank });
        }
      }
    }
    
    return deck;
  }

  shuffleDeck() {
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
    
    // Reshuffle when 70% used
    if (this.cardsUsed > this.deck.length * 0.7) {
      this.deck = this.createDeck();
      this.shuffleDeck();
      this.cardsUsed = 0;
    }
  }

  startGame() {
    this.deck = this.createDeck();
    this.shuffleDeck();
    
    // Deal two cards to each player and dealer
    this.players.forEach(player => {
      player.hand = [this.deck.pop(), this.deck.pop()];
      player.score = this.calculateScore(player.hand);
      player.bust = false;
      player.stand = false;
      
      if (player.score === 21) {
        player.blackjack = true;
      }
    });
    
    // Dealer gets two cards (one hidden)
    this.dealer.hand = [this.deck.pop(), this.deck.pop()];
    this.dealer.score = this.calculateScore([this.dealer.hand[0]]); // Only count visible card initially
  }

  calculateScore(hand) {
    let score = 0;
    let aces = 0;
    
    for (let card of hand) {
      if (card.rank === 'A') {
        aces++;
        score += 11;
      } else if (card.rank === 'K' || card.rank === 'Q' || card.rank === 'J') {
        score += 10;
      } else {
        score += parseInt(card.rank);
      }
    }
    
    // Adjust for aces
    while (score > 21 && aces > 0) {
      score -= 10;
      aces--;
    }
    
    return score;
  }

  playerHit(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player || player.stand || player.bust) return false;
    
    player.hand.push(this.deck.pop());
    player.score = this.calculateScore(player.hand);
    
    if (player.score > 21) {
      player.bust = true;
      player.result = 'loss';
    }
    
    return true;
  }

  playerStand(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (player) {
      player.stand = true;
    }
  }

  dealerPlay() {
    // Dealer must hit on 16, stand on 17+
    // On hard or expert, dealer hits on soft 17 (like real casinos)
    let minScore = this.difficultyMods.dealerHitSoft17 ? 18 : 17;
    
    while (this.dealer.score < minScore) {
      this.dealer.hand.push(this.deck.pop());
      this.dealer.score = this.calculateScore(this.dealer.hand);
      
      // If soft 17 and difficulty says stand, break
      if (!this.difficultyMods.dealerHitSoft17 && this.dealer.score === 17) {
        break;
      }
    }
    
    if (this.dealer.score > 21) {
      this.dealer.bust = true;
    }
  }

  determineResults() {
    this.dealerPlay();
    
    this.players.forEach(player => {
      if (player.bust) {
        player.result = 'loss';
        player.winAmount = 0;
      } else if (this.dealer.bust) {
        player.result = 'win';
        player.winAmount = player.bet * 2;
      } else if (player.score > this.dealer.score) {
        player.result = 'win';
        // Blackjack pays 3:2
        if (player.blackjack) {
          player.winAmount = player.bet + Math.floor(player.bet * 1.5);
        } else {
          player.winAmount = player.bet * 2;
        }
      } else if (player.score < this.dealer.score) {
        player.result = 'loss';
        player.winAmount = 0;
      } else {
        player.result = 'push';
        player.winAmount = player.bet;
      }
    });
  }

  getGameState() {
    return {
      gameId: this.gameId,
      players: this.players.map(p => ({
        id: p.id,
        bet: p.bet,
        hand: p.hand,
        score: p.score,
        bust: p.bust,
        blackjack: p.blackjack,
        stand: p.stand,
        result: p.result,
        winAmount: p.winAmount
      })),
      dealer: {
        hand: this.dealer.hand,
        score: this.dealer.score,
        bust: this.dealer.bust
      }
    };
  }
}

module.exports = BlackjackGame;