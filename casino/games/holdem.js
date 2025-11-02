// Texas Hold'em Game Engine - With Difficulty Levels

class HoldemGame {
  constructor(gameId, buyIn, difficulty = 'medium') {
    this.gameId = gameId;
    this.buyIn = buyIn;
    this.difficulty = difficulty; // 'easy', 'medium', 'hard', 'expert'
    this.players = [];
    this.deck = [];
    this.communityCards = [];
    this.pot = 0;
    this.currentBet = 0;
    this.dealer = 0;
    this.smallBlind = 0;
    this.bigBlind = 0;
    this.currentTurn = 0;
    this.stage = 'pre-flop'; // pre-flop, flop, turn, river, showdown
    this.winners = [];
    this.difficultyMods = this.getDifficultyMods();
  }

  getDifficultyMods() {
    const mods = {
      easy: {
        maxBetRaiseAmount: 10,
        botAggressiveness: 0.2,
        description: 'Easy - Cautious bots'
      },
      medium: {
        maxBetRaiseAmount: 500,
        botAggressiveness: 0.5,
        description: 'Medium - Balanced bots'
      },
      hard: {
        maxBetRaiseAmount: 5000,
        botAggressiveness: 0.8,
        description: 'Hard - Aggressive bots'
      },
      expert: {
        maxBetRaiseAmount: Infinity,
        botAggressiveness: 1.0,
        description: 'Expert - Ultra aggressive bots'
      }
    };
    return mods[this.difficulty] || mods.medium;
  }

  addPlayer(playerId, stack) {
    this.players.push({
      id: playerId,
      stack,
      hand: [],
      bet: 0,
      folded: false,
      allIn: false
    });
  }

  startGame() {
    this.deck = this.createDeck();
    this.shuffleDeck();
    
    // Deal hole cards
    this.players.forEach(player => {
      player.hand = [this.deck.pop(), this.deck.pop()];
      player.folded = false;
      player.allIn = false;
    });
    
    this.stage = 'pre-flop';
    this.currentTurn = (this.dealer + 1) % this.players.length;
  }

  createDeck() {
    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const deck = [];
    
    for (let suit of suits) {
      for (let rank of ranks) {
        deck.push({ suit, rank });
      }
    }
    
    return deck;
  }

  shuffleDeck() {
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  }

  playerBet(playerId, amount) {
    const player = this.players.find(p => p.id === playerId);
    if (!player || player.folded) return false;
    
    const actualBet = Math.min(amount, player.stack);
    player.stack -= actualBet;
    player.bet += actualBet;
    this.pot += actualBet;
    
    if (player.stack === 0) {
      player.allIn = true;
    }
    
    this.currentBet = actualBet;
    this.currentTurn = (this.currentTurn + 1) % this.players.length;
    
    return true;
  }

  playerFold(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (player) {
      player.folded = true;
    }
  }

  dealFlop() {
    this.deck.pop(); // burn
    this.communityCards.push(
      this.deck.pop(),
      this.deck.pop(),
      this.deck.pop()
    );
    this.stage = 'flop';
  }

  dealTurn() {
    this.deck.pop(); // burn
    this.communityCards.push(this.deck.pop());
    this.stage = 'turn';
  }

  dealRiver() {
    this.deck.pop(); // burn
    this.communityCards.push(this.deck.pop());
    this.stage = 'river';
  }

  evaluateHand(hand, communityCards) {
    const allCards = [...hand, ...communityCards];
    
    // Simplified hand evaluation
    const rankValues = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };
    const ranks = allCards.map(c => rankValues[c.rank]).sort((a, b) => b - a);
    const suits = allCards.map(c => c.suit);
    
    // Check for flush
    const isFlush = suits.filter(s => suits.filter(x => x === s).length >= 5).length > 0;
    
    // Check for straight
    let isStraight = false;
    for (let i = 0; i < ranks.length - 4; i++) {
      if (ranks[i] - ranks[i + 4] === 4) {
        isStraight = true;
        break;
      }
    }
    
    // Hand ranking: Royal Flush(10), Straight Flush(9), Four of a Kind(8), Full House(7), Flush(6), Straight(5), Three of a Kind(4), Two Pair(3), One Pair(2), High Card(1)
    
    if (isStraight && isFlush) return 9; // Straight Flush
    if (isFlush) return 6;
    if (isStraight) return 5;
    
    return 1; // Simplified
  }

  determineWinner() {
    const activePlayers = this.players.filter(p => !p.folded);
    
    if (activePlayers.length === 1) {
      return activePlayers[0].id;
    }
    
    let bestRank = 0;
    let winners = [];
    
    activePlayers.forEach(player => {
      const rank = this.evaluateHand(player.hand, this.communityCards);
      if (rank > bestRank) {
        bestRank = rank;
        winners = [player.id];
      } else if (rank === bestRank) {
        winners.push(player.id);
      }
    });
    
    return winners;
  }

  distributeWinnings(winnerIds) {
    const winPerPlayer = Math.floor(this.pot / winnerIds.length);
    
    winnerIds.forEach(winnerId => {
      const player = this.players.find(p => p.id === winnerId);
      if (player) {
        player.stack += winPerPlayer;
      }
    });
    
    this.stage = 'showdown';
  }

  getGameState() {
    return {
      gameId: this.gameId,
      players: this.players.map(p => ({
        id: p.id,
        stack: p.stack,
        bet: p.bet,
        folded: p.folded,
        allIn: p.allIn,
        handSize: p.hand.length
      })),
      communityCards: this.communityCards,
      pot: this.pot,
      currentBet: this.currentBet,
      stage: this.stage,
      currentTurn: this.currentTurn,
      dealer: this.dealer
    };
  }
}

module.exports = HoldemGame;