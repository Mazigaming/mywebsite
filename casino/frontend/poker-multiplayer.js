// TEXAS HOLD'EM MULTIPLAYER POKER GAME

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const RANK_VALUES = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };

let gameState = {
    players: [],
    deck: [],
    communityCards: [],
    pot: 0,
    currentBet: 0,
    gamePhase: 'setup', // setup, preflop, flop, turn, river, showdown
    currentPlayerIndex: 0,
    dealerIndex: 0,
    smallBlind: 10,
    bigBlind: 20,
    minBet: 0,
    activePlayers: [],
    handHistory: []
};

function selectPlayers(num) {
    const btns = document.querySelectorAll('.player-btn');
    btns.forEach(btn => btn.classList.remove('selected'));
    event.target.classList.add('selected');

    const container = document.getElementById('nameInputs');
    container.innerHTML = '';
    for (let i = 0; i < num; i++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'name-input';
        input.placeholder = `Player ${i + 1}`;
        input.value = `Player ${i + 1}`;
        container.appendChild(input);
    }

    document.getElementById('playerNamesContainer').style.display = 'block';
    document.getElementById('startBtn').disabled = false;
}

function startNewGame() {
    gameState.players = [];
    document.querySelectorAll('.name-input').forEach((input, idx) => {
        gameState.players.push({
            id: idx,
            name: input.value || `Player ${idx + 1}`,
            balance: 1000,
            hand: [],
            bet: 0,
            folded: false,
            allIn: false,
            handRank: null
        });
    });

    gameState.gamePhase = 'preflop';
    gameState.dealerIndex = 0;
    gameState.pot = 0;
    gameState.communityCards = [];
    gameState.deck = createDeck();

    document.getElementById('setupScreen').classList.add('hidden');
    document.getElementById('gameScreen').classList.add('active');

    dealHand();
}

function createDeck() {
    const deck = [];
    for (let suit of SUITS) {
        for (let rank of RANKS) {
            deck.push({ rank, suit });
        }
    }
    return deck.sort(() => Math.random() - 0.5);
}

function dealHand() {
    // Reset
    gameState.players.forEach(p => {
        p.hand = [];
        p.bet = 0;
        p.folded = false;
        p.allIn = false;
    });
    gameState.pot = 0;
    gameState.currentBet = 0;
    gameState.communityCards = [];
    gameState.deck = createDeck();

    // Deal hole cards
    for (let i = 0; i < 2; i++) {
        for (let player of gameState.players) {
            if (gameState.deck.length > 0) {
                player.hand.push(gameState.deck.pop());
            }
        }
    }

    gameState.currentPlayerIndex = (gameState.dealerIndex + 1) % gameState.players.length;
    gameState.currentBet = gameState.bigBlind;
    gameState.minBet = gameState.bigBlind;

    // Post blinds
    const smallBlindIndex = (gameState.dealerIndex + 1) % gameState.players.length;
    const bigBlindIndex = (gameState.dealerIndex + 2) % gameState.players.length;

    gameState.players[smallBlindIndex].bet = gameState.smallBlind;
    gameState.players[smallBlindIndex].balance -= gameState.smallBlind;
    gameState.players[bigBlindIndex].bet = gameState.bigBlind;
    gameState.players[bigBlindIndex].balance -= gameState.bigBlind;

    gameState.pot = gameState.smallBlind + gameState.bigBlind;
    gameState.activePlayers = gameState.players.filter(p => !p.folded && p.balance > 0);

    showPlayerTurn();
}

function showPlayerTurn() {
    const player = gameState.players[gameState.currentPlayerIndex];
    
    // Check for all-in or folded
    while ((player.allIn || player.folded || player.balance === 0) && gameState.activePlayers.length > 1) {
        gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
    }

    document.getElementById('modalPlayerName').textContent = player.name + "'s Turn";
    document.getElementById('playerTurnModal').classList.add('active');
}

function revealPlayerCards() {
    document.getElementById('playerTurnModal').classList.remove('active');
    
    const player = gameState.players[gameState.currentPlayerIndex];
    const cards = player.hand.map(card => `${card.rank}${card.suit}`).join(' ');
    
    document.getElementById('activePlayerName').textContent = player.name + "'s Turn";
    document.getElementById('activePlayerCards').innerHTML = `Your cards: <strong>${cards}</strong>`;
    
    renderGameState();
    showBettingOptions();
    
    document.getElementById('activePlayerInfo').style.display = 'block';
}

function showBettingOptions() {
    const player = gameState.players[gameState.currentPlayerIndex];
    const toCall = gameState.currentBet - player.bet;
    const canRaise = player.balance > toCall;
    const canCheck = toCall === 0;

    let options = ``;

    if (canCheck) {
        options += `<button class="btn success" onclick="playerAction('check')">CHECK</button>`;
    } else {
        options += `<button class="btn primary" onclick="playerAction('call')">CALL $${toCall}</button>`;
    }

    options += `<button class="btn danger" onclick="playerAction('fold')">FOLD</button>`;

    if (canRaise && player.balance > gameState.minBet) {
        options += `<button class="btn" onclick="showRaiseInput()">RAISE</button>`;
    }

    if (player.balance > 0 && toCall > 0) {
        options += `<button class="btn" onclick="playerAction('allIn')">ALL IN</button>`;
    }

    document.getElementById('bettingOptions').innerHTML = options;
}

function showRaiseInput() {
    const player = gameState.players[gameState.currentPlayerIndex];
    const toCall = gameState.currentBet - player.bet;
    const maxRaise = player.balance - toCall;

    let html = `
        <div class="bet-input-group">
            <label>Raise Amount: </label>
            <input type="number" id="raiseAmount" min="${gameState.minBet}" max="${maxRaise}" value="${gameState.minBet}" class="bet-input">
            <button class="btn success" onclick="playerAction('raise')">RAISE</button>
            <button class="btn" onclick="showBettingOptions()">CANCEL</button>
        </div>
    `;

    document.getElementById('bettingOptions').innerHTML = html;
}

function playerAction(action) {
    const player = gameState.players[gameState.currentPlayerIndex];
    const toCall = gameState.currentBet - player.bet;

    switch (action) {
        case 'check':
            // No bet needed, move to next player
            break;
        case 'call':
            player.balance -= toCall;
            player.bet += toCall;
            gameState.pot += toCall;
            break;
        case 'fold':
            player.folded = true;
            gameState.activePlayers = gameState.players.filter(p => !p.folded && p.balance > 0);
            
            if (gameState.activePlayers.length === 1) {
                endHand();
                return;
            }
            break;
        case 'raise':
            const raiseAmount = parseInt(document.getElementById('raiseAmount').value);
            const totalBet = toCall + raiseAmount;
            player.balance -= totalBet;
            player.bet += totalBet;
            gameState.pot += totalBet;
            gameState.currentBet = player.bet;
            gameState.minBet = raiseAmount;
            break;
        case 'allIn':
            gameState.pot += player.balance;
            player.bet += player.balance;
            player.balance = 0;
            player.allIn = true;
            gameState.currentBet = Math.max(gameState.currentBet, player.bet);
            break;
    }

    document.getElementById('activePlayerInfo').style.display = 'none';

    // Move to next player
    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
    
    // Check if betting round is complete
    if (isBettingRoundComplete()) {
        advanceGamePhase();
    } else {
        showPlayerTurn();
    }
}

function isBettingRoundComplete() {
    return gameState.activePlayers.every(p => 
        p.folded || p.allIn || p.bet === gameState.currentBet || p.balance === 0
    );
}

function advanceGamePhase() {
    switch (gameState.gamePhase) {
        case 'preflop':
            // Deal flop
            gameState.communityCards = [gameState.deck.pop(), gameState.deck.pop(), gameState.deck.pop()];
            gameState.gamePhase = 'flop';
            break;
        case 'flop':
            // Deal turn
            gameState.communityCards.push(gameState.deck.pop());
            gameState.gamePhase = 'turn';
            break;
        case 'turn':
            // Deal river
            gameState.communityCards.push(gameState.deck.pop());
            gameState.gamePhase = 'river';
            break;
        case 'river':
            // Showdown
            showdown();
            return;
    }

    // Reset betting for new phase
    gameState.currentBet = 0;
    gameState.players.forEach(p => p.bet = 0);
    gameState.currentPlayerIndex = (gameState.dealerIndex + 1) % gameState.players.length;

    setTimeout(() => {
        showPlayerTurn();
    }, 1000);
}

function showdown() {
    gameState.gamePhase = 'showdown';

    // Evaluate hands
    gameState.activePlayers.forEach(player => {
        if (!player.folded) {
            const allCards = [...player.hand, ...gameState.communityCards];
            player.handRank = evaluateHand(allCards);
        }
    });

    // Determine winner
    const winner = gameState.activePlayers
        .filter(p => !p.folded)
        .reduce((best, current) => 
            compareHands(current.handRank, best.handRank) > 0 ? current : best
        );

    winner.balance += gameState.pot;

    const resultTitle = `${winner.name} WINS!`;
    const resultMessage = `Hand: ${winner.handRank.name}`;
    const resultAmount = `+$${gameState.pot}`;

    document.getElementById('resultTitle').textContent = resultTitle;
    document.getElementById('resultMessage').textContent = resultMessage;
    document.getElementById('resultAmount').textContent = resultAmount;
    document.getElementById('handResultModal').classList.add('active');
}

function evaluateHand(cards) {
    // Get best 5-card hand from 7 cards
    const allCombinations = get5CardCombinations(cards);
    let bestHand = { rank: 0, name: 'High Card' };

    for (let combo of allCombinations) {
        const hand = rankHand(combo);
        if (hand.rank > bestHand.rank) {
            bestHand = hand;
        }
    }

    return bestHand;
}

function get5CardCombinations(cards) {
    // Generate all 5-card combinations from 7 cards
    const combinations = [];
    const indices = [];

    function generate(start) {
        if (indices.length === 5) {
            combinations.push(indices.map(i => cards[i]));
            return;
        }
        for (let i = start; i < cards.length; i++) {
            indices.push(i);
            generate(i + 1);
            indices.pop();
        }
    }

    generate(0);
    return combinations;
}

function rankHand(cards) {
    const ranks = cards.map(c => c.rank);
    const suits = cards.map(c => c.suit);
    const rankCounts = {};
    const suitCounts = {};

    ranks.forEach(r => rankCounts[r] = (rankCounts[r] || 0) + 1);
    suits.forEach(s => suitCounts[s] = (suitCounts[s] || 0) + 1);

    const counts = Object.values(rankCounts).sort((a, b) => b - a);
    const hasFlush = Object.values(suitCounts).some(c => c >= 5);
    const isStraight = isStraightHand(ranks);

    let handRank = { rank: 0, name: 'High Card' };

    if (isStraight && hasFlush) {
        handRank = { rank: 8, name: 'Straight Flush' };
    } else if (counts[0] === 4) {
        handRank = { rank: 7, name: 'Four of a Kind' };
    } else if (counts[0] === 3 && counts[1] === 2) {
        handRank = { rank: 6, name: 'Full House' };
    } else if (hasFlush) {
        handRank = { rank: 5, name: 'Flush' };
    } else if (isStraight) {
        handRank = { rank: 4, name: 'Straight' };
    } else if (counts[0] === 3) {
        handRank = { rank: 3, name: 'Three of a Kind' };
    } else if (counts[0] === 2 && counts[1] === 2) {
        handRank = { rank: 2, name: 'Two Pair' };
    } else if (counts[0] === 2) {
        handRank = { rank: 1, name: 'One Pair' };
    }

    return handRank;
}

function isStraightHand(ranks) {
    const values = ranks.map(r => RANK_VALUES[r]).sort((a, b) => a - b);
    for (let i = 0; i < values.length - 1; i++) {
        if (values[i + 1] - values[i] !== 1) {
            return false;
        }
    }
    return true;
}

function compareHands(hand1, hand2) {
    return hand1.rank - hand2.rank;
}

function renderGameState() {
    // Update phase display
    const phaseNames = { preflop: 'PRE-FLOP', flop: 'FLOP', turn: 'TURN', river: 'RIVER', showdown: 'SHOWDOWN' };
    document.getElementById('gamePhase').textContent = phaseNames[gameState.gamePhase] || 'PLAYING';

    // Update pot display
    document.getElementById('potDisplay').textContent = `Pot: $${gameState.pot}`;

    // Render community cards
    const communityHTML = gameState.communityCards
        .map(card => `<div class="card ${card.suit === '♥' || card.suit === '♦' ? 'red' : 'black'}">${card.rank}${card.suit}</div>`)
        .join('');
    const emptySlots = Math.max(0, 5 - gameState.communityCards.length);
    const emptyHTML = Array(emptySlots).fill('<div class="card hidden">🂠</div>').join('');
    document.getElementById('communityCards').innerHTML = communityHTML + emptyHTML;

    // Render players
    const playersHTML = gameState.players.map((player, idx) => `
        <div class="player-seat ${idx === gameState.currentPlayerIndex && gameState.gamePhase !== 'showdown' ? 'current' : ''} ${player.folded ? 'folded' : ''}">
            <div class="player-name">${player.name} ${idx === gameState.dealerIndex ? '🎩' : ''}</div>
            <div class="player-status">${player.balance > 0 ? `$${player.balance}` : 'OUT'} ${player.allIn ? '(ALL IN)' : ''}</div>
            <div class="player-bet">${player.bet > 0 ? `Bet: $${player.bet}` : ''}</div>
            <div class="player-cards">
                ${idx === gameState.currentPlayerIndex && gameState.gamePhase !== 'showdown' ? 
                    `<div class="player-card ${player.hand[0] && (player.hand[0].suit === '♥' || player.hand[0].suit === '♦') ? 'red' : 'black'}">${player.hand[0] ? player.hand[0].rank + player.hand[0].suit : ''}</div>
                     <div class="player-card ${player.hand[1] && (player.hand[1].suit === '♥' || player.hand[1].suit === '♦') ? 'red' : 'black'}">${player.hand[1] ? player.hand[1].rank + player.hand[1].suit : ''}</div>` :
                    `<div class="player-card hidden">🂠</div><div class="player-card hidden">🂠</div>`
                }
            </div>
        </div>
    `).join('');
    document.getElementById('playersContainer').innerHTML = playersHTML;
}

function nextHand() {
    document.getElementById('handResultModal').classList.remove('active');
    
    // Check if any player is out
    gameState.players = gameState.players.filter(p => p.balance > 0);
    
    if (gameState.players.length < 2) {
        alert('Game Over! Not enough players.');
        goBack();
        return;
    }

    gameState.dealerIndex = (gameState.dealerIndex + 1) % gameState.players.length;
    gameState.gamePhase = 'preflop';
    dealHand();
}

function endGame() {
    if (confirm('End the game?')) {
        goBack();
    }
}

function goBack() {
    window.location.href = 'holdem.html';
}