// Kings Corner Game UI Controller

let game = null;
let selectedCard = null;
let selectedFoundation = null;

function startGame(playerCount) {
    const inputs = document.querySelectorAll('.player-name-input');
    const names = [];
    
    for (let i = 0; i < playerCount; i++) {
        const name = inputs[i].value.trim();
        names.push(name || `Player ${i + 1}`);
    }

    game = new KingsCornerGame();
    game.setupGame(names);

    document.getElementById('setupScreen').style.display = 'none';
    document.getElementById('gameScreen').classList.add('active');

    showTurnModal();
}

function showTurnModal() {
    const player = game.players[game.currentPlayerIndex];
    document.getElementById('turnPlayerName').textContent = `${player.name}'s Turn`;
    document.getElementById('turnModal').classList.add('active');
}

function revealTurn() {
    document.getElementById('turnModal').classList.remove('active');
    renderGameState();
}

function renderGameState() {
    const state = game.getGameState();

    // Update deck count
    document.getElementById('deckCount').textContent = state.deckSize;

    // Update current player info
    const currentPlayer = game.players[state.currentPlayer];
    document.getElementById('currentPlayerInfo').textContent = `${currentPlayer.name} (${currentPlayer.hand.length} cards)`;

    // Render foundations
    renderFoundations(state.foundations);

    // Render player hand
    renderPlayerHand(state.playerHand);

    // Render players list
    renderPlayersList(state.players);

    // Update button states
    document.getElementById('drawBtn').disabled = state.deckSize === 0;
}

function renderFoundations(foundations) {
    const area = document.getElementById('foundationsArea');
    const names = ['north', 'south', 'east', 'west'];
    const labels = ['North', 'South', 'East', 'West'];
    
    area.innerHTML = names.map((name, idx) => {
        const cards = foundations[name];
        const topCard = cards.length > 0 ? cards[cards.length - 1] : null;
        const isRed = topCard && (topCard.suit === '♥' || topCard.suit === '♦');
        
        return `
            <div class="foundation" onclick="selectFoundation('${name}')">
                <div class="foundation-cards">
                    ${topCard ? `
                        <div class="card ${isRed ? 'red' : 'black'}">${topCard.rank}${topCard.suit}</div>
                        <div style="font-size: 0.8em; color: #888;">(${cards.length})</div>
                    ` : `
                        <div style="font-size: 0.8em; color: #888;">Empty</div>
                    `}
                </div>
            </div>
        `;
    }).join('');
}

function renderPlayerHand(hand) {
    const container = document.getElementById('playerHand');
    
    container.innerHTML = hand.map((card, idx) => {
        const isRed = card.suit === '♥' || card.suit === '♦';
        const isSelected = selectedCard === idx;
        
        return `
            <div class="card-item ${isSelected ? 'selected' : ''}" onclick="selectCard(${idx})">
                <div class="card ${isRed ? 'red' : 'black'}">${card.rank}${card.suit}</div>
            </div>
        `;
    }).join('');
}

function renderPlayersList(players) {
    const container = document.getElementById('playersList');
    
    container.innerHTML = players.map((player, idx) => `
        <div class="player-card ${idx === game.currentPlayerIndex ? 'current' : ''} ${player.won ? 'won' : ''}">
            <div class="player-name">${player.name}</div>
            <div class="player-cards">Cards: ${player.handSize}</div>
            <div class="player-played">Played: ${player.cardsPlayed}</div>
            ${player.won ? '<div class="won-badge">✓ WON</div>' : ''}
        </div>
    `).join('');
}

function selectCard(idx) {
    selectedCard = selectedCard === idx ? null : idx;
    renderPlayerHand(game.players[game.currentPlayerIndex].hand);
}

function selectFoundation(foundationName) {
    if (selectedCard === null) {
        alert('Select a card first!');
        return;
    }

    const player = game.players[game.currentPlayerIndex];
    const card = player.hand[selectedCard];

    if (!game.canPlayOnFoundation(card, game.foundations[foundationName])) {
        alert('This card cannot be played here!');
        return;
    }

    // Play the card
    game.playCard(game.currentPlayerIndex, selectedCard, foundationName);
    selectedCard = null;
    selectedFoundation = null;

    // Check if player won
    if (game.gamePhase === 'won') {
        showWinnerModal();
        return;
    }

    // Continue playing or move to next player
    if (game.getValidMoves(game.players[game.currentPlayerIndex].hand).length === 0) {
        // No more moves, can draw or pass
        alert('No more valid moves. Draw a card or pass.');
    }

    renderGameState();
}

function drawCardAction() {
    const player = game.players[game.currentPlayerIndex];
    
    if (!game.drawCard()) {
        alert('No cards left in deck!');
        return;
    }

    selectedCard = null;
    renderPlayerHand(game.players[game.currentPlayerIndex].hand);
    
    // Automatically pass turn after drawing
    setTimeout(passTurn, 800);
}

function passTurn() {
    game.nextPlayer();
    
    if (game.gamePhase === 'won') {
        showWinnerModal();
        return;
    }

    selectedCard = null;
    selectedFoundation = null;
    showTurnModal();
}

function showWinnerModal() {
    const winner = game.getWinner();
    document.getElementById('winnerName').textContent = winner.name;
    document.getElementById('winnerModal').classList.add('active');
}

function playAgain() {
    document.getElementById('winnerModal').classList.remove('active');
    document.getElementById('gameScreen').classList.remove('active');
    document.getElementById('setupScreen').style.display = 'block';
    game = null;
    selectedCard = null;
    selectedFoundation = null;
}

function endGame() {
    if (confirm('End the game?')) {
        goBack();
    }
}

function goBack() {
    window.location.href = 'index.html';
}

// Initial render
document.addEventListener('DOMContentLoaded', () => {
    // Setup page is shown by default
});