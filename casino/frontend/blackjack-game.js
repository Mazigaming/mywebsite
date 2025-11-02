// Blackjack Game Client

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

let gameState = {
    deck: [],
    dealerHand: [],
    playerHand: [],
    dealerScore: 0,
    playerScore: 0,
    bet: 100,
    balance: 5000,
    gameActive: false,
    dealerTurnStarted: false
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadUserBalance();
    document.getElementById('betInput').addEventListener('change', (e) => {
        gameState.bet = Math.max(10, Math.min(10000, parseInt(e.target.value) || 100));
        document.getElementById('betInput').value = gameState.bet;
    });
});

function loadUserBalance() {
    // Try offline user first, then fallback to online user
    let user = localStorage.getItem('offlineUser');
    if (!user) {
        user = localStorage.getItem('casinoUser');
    }
    if (user) {
        gameState.balance = JSON.parse(user).balance;
    }
    updateBalance();
}

function updateBalance() {
    document.getElementById('balance').textContent = '$' + gameState.balance.toLocaleString();
    document.getElementById('betInput').max = gameState.balance;
    
    // Save balance to localStorage for offline persistence
    const offlineUser = localStorage.getItem('offlineUser');
    if (offlineUser) {
        const user = JSON.parse(offlineUser);
        user.balance = gameState.balance;
        user.stats.gamesPlayed = (user.stats.gamesPlayed || 0) + (gameState.gameActive ? 0 : 0);
        localStorage.setItem('offlineUser', JSON.stringify(user));
    }
}

function createDeck() {
    const deck = [];
    // 6-deck shoe
    for (let shoe = 0; shoe < 6; shoe++) {
        for (let suit of SUITS) {
            for (let rank of RANKS) {
                deck.push({ suit, rank });
            }
        }
    }
    
    // Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    
    return deck;
}

function calculateScore(hand) {
    let score = 0;
    let aces = 0;
    
    for (let card of hand) {
        const rank = String(card.rank).trim().toUpperCase();
        console.log(`Calculating card: ${rank}${card.suit}`);
        
        if (rank === 'A') {
            aces++;
            score += 11;
            console.log(`Added Ace: +11, total: ${score}`);
        } else if (rank === 'K' || rank === 'Q' || rank === 'J') {
            score += 10;
            console.log(`Added face card: +10, total: ${score}`);
        } else {
            const numValue = parseInt(rank);
            if (!isNaN(numValue)) {
                score += numValue;
                console.log(`Added number card ${rank}: +${numValue}, total: ${score}`);
            } else {
                console.log(`Failed to parse: ${rank}`);
            }
        }
    }
    
    // Adjust for aces - convert from 11 to 1 if busting
    while (score > 21 && aces > 0) {
        score -= 10;
        aces--;
    }
    
    console.log(`Final score: ${score}`);
    return score;
}

function cardToString(card) {
    return card.rank + card.suit;
}

function startNewHand() {
    if (gameState.bet > gameState.balance) {
        alert('Insufficient balance for this bet');
        return;
    }

    // Reshuffle if needed
    if (gameState.deck.length < 52) {
        gameState.deck = createDeck();
    }

    gameState.dealerHand = [];
    gameState.playerHand = [];
    gameState.gameActive = true;
    gameState.dealerTurnStarted = false;

    // Deal cards
    gameState.dealerHand.push(gameState.deck.pop());
    gameState.playerHand.push(gameState.deck.pop());
    gameState.dealerHand.push(gameState.deck.pop());
    gameState.playerHand.push(gameState.deck.pop());

    // Calculate initial scores
    gameState.dealerScore = calculateScore([gameState.dealerHand[0]]);
    gameState.playerScore = calculateScore(gameState.playerHand);

    // Deduct bet from balance
    gameState.balance -= gameState.bet;
    updateBalance();

    // Update display
    renderCards();
    updateScores();

    // Show controls
    document.getElementById('controls').style.display = 'flex';
    document.getElementById('dealBtn').style.display = 'none';
    document.getElementById('resultPanel').classList.remove('active');

    // Check for blackjack
    if (gameState.playerScore === 21) {
        setTimeout(() => {
            dealerReveal();
        }, 500);
    }
}

function playerHit() {
    if (!gameState.gameActive) return;

    gameState.playerHand.push(gameState.deck.pop());
    gameState.playerScore = calculateScore(gameState.playerHand);

    renderCards();
    updateScores();

    if (gameState.playerScore > 21) {
        endGame('BUST', -gameState.bet);
    }
}

function playerStand() {
    if (!gameState.gameActive) return;
    dealerReveal();
}

function dealerReveal() {
    gameState.dealerTurnStarted = true;
    document.getElementById('controls').style.display = 'none';
    
    // Reveal dealer's hidden card
    setTimeout(() => {
        renderCards();
        updateScores();

        // Dealer plays
        dealerPlay();
    }, 500);
}

function dealerPlay() {
    const delay = 500;
    let plays = 0;

    function dealerTurn() {
        gameState.dealerScore = calculateScore(gameState.dealerHand);

        if (gameState.dealerScore < 17) {
            setTimeout(() => {
                gameState.dealerHand.push(gameState.deck.pop());
                renderCards();
                updateScores();
                dealerTurn();
            }, delay);
        } else {
            determineWinner();
        }
    }

    dealerTurn();
}

function determineWinner() {
    gameState.gameActive = false;

    if (gameState.dealerScore > 21) {
        // Player wins (dealer bust)
        const winAmount = gameState.bet * 2;
        gameState.balance += winAmount;
        endGame('Dealer Bust! You Win!', winAmount);
    } else if (gameState.playerScore > gameState.dealerScore) {
        // Player wins
        const winAmount = gameState.bet * 2;
        gameState.balance += winAmount;
        endGame('You Win!', winAmount);
    } else if (gameState.playerScore < gameState.dealerScore) {
        // Dealer wins
        endGame('You Lose!', -gameState.bet);
    } else {
        // Push
        gameState.balance += gameState.bet;
        endGame('Push - Tie!', 0);
    }
}

function endGame(message, amount) {
    gameState.gameActive = false;
    
    updateBalance();
    
    const resultPanel = document.getElementById('resultPanel');
    document.getElementById('resultText').textContent = message;
    document.getElementById('resultAmount').textContent = (amount >= 0 ? '+' : '') + '$' + amount.toLocaleString();
    resultPanel.classList.add('active');
    
    document.getElementById('dealBtn').style.display = 'block';
}

function renderCards() {
    const dealerContainer = document.getElementById('dealerCards');
    const playerContainer = document.getElementById('playerCards');

    // Only show visible dealer cards (first card always visible, others only after reveal)
    dealerContainer.innerHTML = gameState.dealerHand.map((card, idx) => {
        const isVisible = gameState.dealerTurnStarted || idx === 0;
        return `
            <div class="card ${isVisible ? '' : 'hidden'}" style="animation: cardFlip 0.6s ease-out;">
                ${isVisible ? cardToString(card) : '?'}
            </div>
        `;
    }).join('');

    playerContainer.innerHTML = gameState.playerHand.map((card, idx) => `
        <div class="card" style="animation: cardFlip 0.6s ease-out ${idx * 0.1}s;">
            ${cardToString(card)}
        </div>
    `).join('');
}

function updateScores() {
    document.getElementById('dealerScore').textContent = gameState.dealerTurnStarted ? gameState.dealerScore : '?';
    document.getElementById('playerScore').textContent = gameState.playerScore;
}

function goBack() {
    window.location.href = 'index.html';
}