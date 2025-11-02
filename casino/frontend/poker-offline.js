// Offline Poker Game - Texas Hold'em vs AI

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

let gameState = {
    playerBalance: 5000,
    dealerBalance: 10000,
    playerCards: [],
    dealerCards: [],
    communityCards: [],
    currentBet: 0,
    playerBet: 0,
    dealerBet: 0,
    pot: 0,
    gamePhase: 'idle', // idle, preflop, flop, turn, river, showdown
    wins: 0,
    handsPlayed: 0,
    deck: []
};

// Load balance from offline storage
function loadBalance() {
    const offlineUser = localStorage.getItem('offlineUser');
    if (offlineUser) {
        const user = JSON.parse(offlineUser);
        gameState.playerBalance = user.balance || 5000;
    }
    updateDisplay();
}

// Save balance to offline storage
function saveBalance() {
    const offlineUser = localStorage.getItem('offlineUser');
    if (offlineUser) {
        const user = JSON.parse(offlineUser);
        user.balance = gameState.playerBalance;
        localStorage.setItem('offlineUser', JSON.stringify(user));
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadBalance();
    updateDisplay();
});

function updateDisplay() {
    document.getElementById('balance').textContent = '$' + gameState.playerBalance.toLocaleString();
    document.getElementById('dealerBalance').textContent = `Balance: $${gameState.dealerBalance.toLocaleString()}`;
    document.getElementById('wins').textContent = gameState.wins;
    document.getElementById('handsPlayed').textContent = gameState.handsPlayed;
    document.getElementById('pot').textContent = '$' + gameState.pot.toLocaleString();
}

// Deck functions
function createDeck() {
    const deck = [];
    for (let suit of SUITS) {
        for (let rank of RANKS) {
            deck.push(rank + suit);
        }
    }
    return deck.sort(() => Math.random() - 0.5);
}

function drawCard() {
    if (gameState.deck.length === 0) {
        gameState.deck = createDeck();
    }
    return gameState.deck.pop();
}

// Card display functions
function displayCard(card) {
    const rank = card.slice(0, -1);
    const suit = card.slice(-1);
    const isRed = suit === '♥' || suit === '♦';
    return `<div class="card ${isRed ? 'red' : 'black'}">${card}</div>`;
}

function displayHiddenCard() {
    return '<div class="card hidden">🂠</div>';
}

// Render cards on board
function renderCards() {
    // Player cards
    let playerHTML = gameState.playerCards.map(c => displayCard(c)).join('');
    document.getElementById('playerCards').innerHTML = playerHTML;

    // Dealer cards
    let dealerHTML = '';
    if (gameState.gamePhase === 'showdown') {
        dealerHTML = gameState.dealerCards.map(c => displayCard(c)).join('');
    } else if (gameState.gamePhase !== 'idle') {
        dealerHTML = displayHiddenCard() + (gameState.dealerCards[1] ? displayCard(gameState.dealerCards[1]) : '');
    }
    document.getElementById('dealerCards').innerHTML = dealerHTML;

    // Community cards
    let communityHTML = gameState.communityCards.map(c => displayCard(c)).join('');
    document.getElementById('communityCards').innerHTML = communityHTML;
}

// Hand evaluation (simplified)
function evaluateHand(cards) {
    if (!cards || cards.length < 5) return 'Incomplete';
    
    // Count ranks and suits
    const ranks = cards.map(c => c.slice(0, -1));
    const rankCounts = {};
    ranks.forEach(r => rankCounts[r] = (rankCounts[r] || 0) + 1);
    
    const sortedCounts = Object.values(rankCounts).sort((a, b) => b - a);
    
    // Flush
    const suits = cards.map(c => c.slice(-1));
    const suitCounts = {};
    suits.forEach(s => suitCounts[s] = (suitCounts[s] || 0) + 1);
    
    const hasFlush = Object.values(suitCounts).some(c => c >= 5);
    
    // Determine hand type
    if (sortedCounts[0] === 4) return 'Four of a Kind';
    if (sortedCounts[0] === 3 && sortedCounts[1] === 2) return 'Full House';
    if (hasFlush) return 'Flush';
    if (sortedCounts[0] === 3) return 'Three of a Kind';
    if (sortedCounts[0] === 2 && sortedCounts[1] === 2) return 'Two Pair';
    if (sortedCounts[0] === 2) return 'One Pair';
    return 'High Card';
}

function getHandStrength(cards) {
    const hand = evaluateHand(cards);
    const strengths = {
        'Four of a Kind': 7,
        'Full House': 6,
        'Flush': 5,
        'Three of a Kind': 4,
        'Two Pair': 3,
        'One Pair': 2,
        'High Card': 1
    };
    return strengths[hand] || 0;
}

// Game phases
function startNewGame() {
    if (gameState.playerBalance < 10) {
        alert('Insufficient balance to play!');
        return;
    }

    // Reset game
    gameState.deck = createDeck();
    gameState.playerCards = [drawCard(), drawCard()];
    gameState.dealerCards = [drawCard(), drawCard()];
    gameState.communityCards = [];
    gameState.playerBet = 0;
    gameState.dealerBet = 0;
    gameState.currentBet = 0;
    gameState.pot = 0;
    gameState.gamePhase = 'preflop';
    gameState.handsPlayed++;

    // Ante
    const ante = 10;
    gameState.playerBalance -= ante;
    gameState.dealerBalance -= ante;
    gameState.pot = ante * 2;
    gameState.currentBet = ante;

    renderCards();
    updateDisplay();
    saveBalance();
    updateGameStatus('Preflop Betting - Your turn!');
    showPlayerActions();
}

function showPlayerActions() {
    document.getElementById('newGameBtn').style.display = 'none';
    document.getElementById('foldBtn').style.display = 'inline-block';
    document.getElementById('callBtn').style.display = 'inline-block';
    document.getElementById('raiseBtn').style.display = 'inline-block';

    // Set call amount
    const callAmount = gameState.currentBet - gameState.playerBet;
    document.getElementById('callBtn').textContent = `CALL $${callAmount}`;
}

function hidePlayerActions() {
    document.getElementById('foldBtn').style.display = 'none';
    document.getElementById('callBtn').style.display = 'none';
    document.getElementById('raiseBtn').style.display = 'none';
    document.getElementById('betControls').style.display = 'none';
}

function playerFold() {
    hidePlayerActions();
    updateGameStatus('You folded! Dealer wins!');
    gameState.dealerBalance += gameState.pot;
    gameState.pot = 0;
    document.getElementById('dealerStatus').textContent = 'WON';
    setTimeout(showResultModal, 1000);
}

function playerCall() {
    const callAmount = gameState.currentBet - gameState.playerBet;
    if (gameState.playerBalance < callAmount) {
        alert('Insufficient balance!');
        return;
    }

    gameState.playerBalance -= callAmount;
    gameState.playerBet = gameState.currentBet;
    gameState.pot += callAmount;

    updateDisplay();
    hidePlayerActions();

    // Progress game
    if (gameState.gamePhase === 'preflop') {
        setTimeout(dealerAction, 1000);
    } else {
        setTimeout(nextPhase, 1000);
    }
}

function showRaiseModal() {
    document.getElementById('betControls').style.display = 'flex';
    document.getElementById('betAmount').value = gameState.currentBet * 2;
}

function playerRaise() {
    const raiseAmount = parseInt(document.getElementById('betAmount').value);
    const toCall = gameState.currentBet - gameState.playerBet;
    const raiseTotal = toCall + raiseAmount;

    if (raiseAmount < gameState.currentBet) {
        alert('Raise must be at least equal to current bet!');
        return;
    }

    if (gameState.playerBalance < raiseTotal) {
        alert('Insufficient balance!');
        return;
    }

    gameState.playerBalance -= raiseTotal;
    gameState.playerBet += raiseTotal;
    gameState.pot += raiseTotal;
    gameState.currentBet = gameState.playerBet;

    updateDisplay();
    hidePlayerActions();
    updateGameStatus(`You raised to $${gameState.playerBet}!`);

    setTimeout(dealerAction, 1000);
}

function dealerAction() {
    // AI dealer logic (simplified)
    const dealerStrength = getHandStrength([...gameState.dealerCards, ...gameState.communityCards]);
    const toCall = gameState.currentBet - gameState.dealerBet;
    const riskLevel = Math.random();

    if (toCall === 0) {
        nextPhase();
        return;
    }

    if (dealerStrength >= 4 && riskLevel > 0.3) {
        // Raise
        gameState.dealerBalance -= toCall + gameState.currentBet;
        gameState.dealerBet = gameState.currentBet * 2;
        gameState.pot += toCall + gameState.currentBet;
        gameState.currentBet = gameState.dealerBet;
        updateGameStatus(`Dealer raised to $${gameState.dealerBet}!`);
        updateDisplay();
        setTimeout(showPlayerActions, 1500);
    } else if (toCall > 0 && gameState.dealerBalance >= toCall) {
        // Call
        gameState.dealerBalance -= toCall;
        gameState.dealerBet = gameState.currentBet;
        gameState.pot += toCall;
        updateGameStatus('Dealer called!');
        updateDisplay();
        setTimeout(nextPhase, 1500);
    } else {
        // Fold
        gameState.playerBalance += gameState.pot;
        gameState.pot = 0;
        updateGameStatus('Dealer folded! You win!');
        gameState.wins++;
        updateDisplay();
        setTimeout(showResultModal, 1500);
    }
}

function nextPhase() {
    switch (gameState.gamePhase) {
        case 'preflop':
            // Flop
            gameState.communityCards = [drawCard(), drawCard(), drawCard()];
            gameState.gamePhase = 'flop';
            updateGameStatus('Flop dealt! Your turn!');
            break;
        case 'flop':
            // Turn
            gameState.communityCards.push(drawCard());
            gameState.gamePhase = 'turn';
            updateGameStatus('Turn dealt! Your turn!');
            break;
        case 'turn':
            // River
            gameState.communityCards.push(drawCard());
            gameState.gamePhase = 'river';
            updateGameStatus('River dealt! Your turn!');
            break;
        case 'river':
            // Showdown
            showdown();
            return;
    }

    gameState.currentBet = 0;
    gameState.playerBet = 0;
    gameState.dealerBet = 0;
    renderCards();
    showPlayerActions();
}

function showdown() {
    gameState.gamePhase = 'showdown';
    renderCards();

    const allCards = gameState.playerCards.concat(gameState.communityCards);
    const dealerAllCards = gameState.dealerCards.concat(gameState.communityCards);

    const playerHand = evaluateHand(allCards);
    const dealerHand = evaluateHand(dealerAllCards);

    const playerStrength = getHandStrength(allCards);
    const dealerStrength = getHandStrength(dealerAllCards);

    document.getElementById('playerHand').textContent = playerHand;

    hidePlayerActions();

    if (playerStrength > dealerStrength) {
        updateGameStatus('🎉 YOU WIN!');
        gameState.playerBalance += gameState.pot;
        gameState.wins++;
        document.getElementById('dealerStatus').textContent = 'LOST';
    } else if (dealerStrength > playerStrength) {
        updateGameStatus('💀 YOU LOSE!');
        gameState.dealerBalance += gameState.pot;
        document.getElementById('dealerStatus').textContent = 'WON';
    } else {
        updateGameStatus('🤝 SPLIT POT!');
        gameState.playerBalance += gameState.pot / 2;
        gameState.dealerBalance += gameState.pot / 2;
        document.getElementById('dealerStatus').textContent = 'DRAW';
    }

    gameState.pot = 0;
    updateDisplay();
    setTimeout(showResultModal, 1500);
}

function updateGameStatus(message) {
    document.getElementById('gameStatus').textContent = message;
}

function showResultModal() {
    const modal = document.getElementById('resultModal');
    modal.classList.add('active');
    document.getElementById('newGameBtn').style.display = 'inline-block';
}

function closeResultModal() {
    document.getElementById('resultModal').classList.remove('active');
    document.getElementById('dealerStatus').textContent = '';
    saveBalance();
    
    if (gameState.playerBalance > 0) {
        startNewGame();
    } else {
        alert('Game Over - Out of chips!');
        goBack();
    }
}

function goBack() {
    saveBalance();
    window.location.href = 'index.html';
}

// Avatar grid (from main casino)
function renderAvatarGrid() {
    // Placeholder for any initial setup
}