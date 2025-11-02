// Kings Corner Card Game Engine

class KingsCornerGame {
  constructor() {
    this.deck = [];
    this.players = [];
    this.foundations = {
      north: [],
      south: [],
      east: [],
      west: []
    };
    this.hand = [];
    this.currentPlayerIndex = 0;
    this.gamePhase = 'setup'; // setup, playing, won
    this.gameHistory = [];
  }

  // Card ranking: K > Q > J > 10 > 9 > 8 > 7 > 6 > 5 > 4 > 3 > 2 > A (Ace is low)
  getCardValue(rank) {
    const values = { 'K': 13, 'Q': 12, 'J': 11, '10': 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2, 'A': 1 };
    return values[rank] || 0;
  }

  createDeck() {
    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const deck = [];
    
    for (let suit of suits) {
      for (let rank of ranks) {
        deck.push({ rank, suit });
      }
    }
    
    return deck.sort(() => Math.random() - 0.5);
  }

  setupGame(playerNames) {
    this.players = playerNames.map((name, idx) => ({
      id: idx,
      name,
      hand: [],
      cardsPlayed: 0,
      won: false
    }));

    this.deck = this.createDeck();
    
    // Deal 7 cards to each player
    for (let i = 0; i < 7; i++) {
      for (let player of this.players) {
        if (this.deck.length > 0) {
          player.hand.push(this.deck.pop());
        }
      }
    }

    // Setup initial 4 foundation cards (cross pattern)
    this.foundations.north = [this.deck.pop()];
    this.foundations.south = [this.deck.pop()];
    this.foundations.east = [this.deck.pop()];
    this.foundations.west = [this.deck.pop()];

    this.gamePhase = 'playing';
    this.currentPlayerIndex = 0;
  }

  getValidMoves(playerHand) {
    const moves = [];

    // Check each card in player's hand
    for (let i = 0; i < playerHand.length; i++) {
      const card = playerHand[i];

      // Check if card can play on any foundation
      for (let foundation of ['north', 'south', 'east', 'west']) {
        if (this.canPlayOnFoundation(card, this.foundations[foundation])) {
          moves.push({
            type: 'play',
            cardIndex: i,
            foundation,
            card
          });
        }
      }
    }

    // Check for sequence moves
    for (let i = 0; i < playerHand.length; i++) {
      const card = playerHand[i];
      for (let foundation of ['north', 'south', 'east', 'west']) {
        if (this.canPlayOnFoundation(card, this.foundations[foundation])) {
          // Can move this card
          moves.push({
            type: 'play_sequence',
            cardIndex: i,
            foundation,
            card
          });
        }
      }
    }

    return moves;
  }

  canPlayOnFoundation(card, foundation) {
    if (foundation.length === 0) {
      // Empty foundation - only Kings can start
      return card.rank === 'K';
    }

    const topCard = foundation[foundation.length - 1];
    const cardValue = this.getCardValue(card.rank);
    const topValue = this.getCardValue(topCard.rank);

    // Must be descending value
    if (cardValue >= topValue) {
      return false;
    }

    // Must be alternating color
    const cardRed = card.suit === '♥' || card.suit === '♦';
    const topRed = topCard.suit === '♥' || topCard.suit === '♦';

    return cardRed !== topRed;
  }

  playCard(playerIdx, cardIdx, foundationName) {
    const player = this.players[playerIdx];
    const card = player.hand[cardIdx];

    if (!card || !this.canPlayOnFoundation(card, this.foundations[foundationName])) {
      return false;
    }

    // Move card to foundation
    player.hand.splice(cardIdx, 1);
    this.foundations[foundationName].push(card);
    player.cardsPlayed++;

    // Check if player won
    if (player.hand.length === 0) {
      player.won = true;
      this.gamePhase = 'won';
    }

    return true;
  }

  drawCard() {
    if (this.deck.length > 0) {
      const player = this.players[this.currentPlayerIndex];
      player.hand.push(this.deck.pop());
      return true;
    }
    return false;
  }

  nextPlayer() {
    let attempts = 0;
    do {
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
      attempts++;
    } while (attempts < this.players.length && this.players[this.currentPlayerIndex].won);

    // If all other players won, current game is over
    if (attempts >= this.players.length) {
      this.gamePhase = 'won';
    }
  }

  getGameState() {
    const player = this.players[this.currentPlayerIndex];
    return {
      gamePhase: this.gamePhase,
      currentPlayer: this.currentPlayerIndex,
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        handSize: p.hand.length,
        cardsPlayed: p.cardsPlayed,
        won: p.won
      })),
      playerHand: player ? player.hand : [],
      foundations: {
        north: this.foundations.north.length > 0 ? this.foundations.north : [],
        south: this.foundations.south.length > 0 ? this.foundations.south : [],
        east: this.foundations.east.length > 0 ? this.foundations.east : [],
        west: this.foundations.west.length > 0 ? this.foundations.west : []
      },
      deckSize: this.deck.length,
      validMoves: player ? this.getValidMoves(player.hand) : []
    };
  }

  getWinner() {
    return this.players.find(p => p.won);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = KingsCornerGame;
}