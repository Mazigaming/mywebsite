let currentCards = {
    player: [],
    community: []
};
let selectedCardSlots = {
    card1: null,
    card2: null,
    flop1: null,
    flop2: null,
    flop3: null,
    turn: null,
    river: null
};
let currentCardPickerSlot = null;
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    initializeCardPickerButtons();
});
function initializeCardPickerButtons() {
    const buttons = document.querySelectorAll('.card-picker-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', openCardPicker);
    });
    document.getElementById('cardPickerModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeCardPicker();
        }
    });
    document.getElementById('closeCardPicker').addEventListener('click', closeCardPicker);
    document.getElementById('clearCardBtn').addEventListener('click', clearCurrentCard);
}
function setupEventListeners() {
    document.getElementById('numOpponents').addEventListener('change', calculateOdds);
}
function openCardPicker(e) {
    currentCardPickerSlot = e.currentTarget.getAttribute('data-card-slot');
    const modal = document.getElementById('cardPickerModal');
    const grid = document.getElementById('cardPickerGrid');
    grid.innerHTML = '';
    const allCards = generateAllCards();
    const usedCards = getAllUsedCards();
    allCards.forEach(card => {
        const cardStr = card.toString();
        const pickerCard = document.createElement('div');
        pickerCard.className = 'picker-card';
        pickerCard.textContent = cardStr;
        if (card.suit === '♥' || card.suit === '♦') {
            pickerCard.style.color = '#e74c3c';
        } else {
            pickerCard.style.color = '#fff';
        }
        const isUsed = usedCards.has(cardStr);
        const isCurrentCard = selectedCardSlots[currentCardPickerSlot] === cardStr;
        if (isUsed && !isCurrentCard) {
            pickerCard.classList.add('disabled');
        }
        if (isCurrentCard) {
            pickerCard.classList.add('selected');
        }
        pickerCard.addEventListener('click', () => {
            if (!pickerCard.classList.contains('disabled') || isCurrentCard) {
                selectCard(cardStr);
                closeCardPicker();
            }
        });
        grid.appendChild(pickerCard);
    });
    modal.classList.add('active');
}
function closeCardPicker() {
    document.getElementById('cardPickerModal').classList.remove('active');
    currentCardPickerSlot = null;
}
function selectCard(cardStr) {
    if (!currentCardPickerSlot) return;
    selectedCardSlots[currentCardPickerSlot] = cardStr;
    updateButtonDisplay(currentCardPickerSlot, cardStr);
    updateCards();
}
function clearCurrentCard() {
    if (!currentCardPickerSlot) return;
    selectedCardSlots[currentCardPickerSlot] = null;
    updateButtonDisplay(currentCardPickerSlot, null);
    updateCards();
    closeCardPicker();
}
function updateButtonDisplay(slotId, cardStr) {
    let buttonEl = null;
    if (slotId === 'card1' || slotId === 'card2') {
        buttonEl = document.querySelector(`[data-card-slot="${slotId}"]`);
    } else {
        buttonEl = document.querySelector(`[data-card-slot="${slotId}"]`);
    }
    if (!buttonEl) return;
    if (cardStr) {
        buttonEl.classList.add('selected');
        const card = Card.fromString(cardStr);
        const cardDisplay = document.createElement('div');
        cardDisplay.className = 'selected-card';
        cardDisplay.textContent = cardStr;
        if (card.suit === '♥' || card.suit === '♦') {
            cardDisplay.style.color = '#e74c3c';
        } else {
            cardDisplay.style.color = '#fff';
        }
        buttonEl.innerHTML = '';
        buttonEl.appendChild(cardDisplay);
    } else {
        buttonEl.classList.remove('selected');
        buttonEl.innerHTML = `<span class="card-placeholder">${
            slotId === 'card1' || slotId === 'card2' ? 'Click to Select' : 
            slotId === 'flop1' || slotId === 'flop2' || slotId === 'flop3' ? `Flop ${slotId.slice(-1)}` :
            slotId === 'turn' ? 'Turn' : 'River'
        }</span>`;
    }
}
function getAllUsedCards() {
    const usedSet = new Set();
    Object.values(selectedCardSlots).forEach(card => {
        if (card) {
            usedSet.add(card);
        }
    });
    return usedSet;
}
function updateCards() {
    const card1 = selectedCardSlots.card1 ? Card.fromString(selectedCardSlots.card1) : null;
    const card2 = selectedCardSlots.card2 ? Card.fromString(selectedCardSlots.card2) : null;
    currentCards.player = [];
    if (card1) currentCards.player.push(card1);
    if (card2) currentCards.player.push(card2);
    const flop1 = selectedCardSlots.flop1 ? Card.fromString(selectedCardSlots.flop1) : null;
    const flop2 = selectedCardSlots.flop2 ? Card.fromString(selectedCardSlots.flop2) : null;
    const flop3 = selectedCardSlots.flop3 ? Card.fromString(selectedCardSlots.flop3) : null;
    const turn = selectedCardSlots.turn ? Card.fromString(selectedCardSlots.turn) : null;
    const river = selectedCardSlots.river ? Card.fromString(selectedCardSlots.river) : null;
    currentCards.community = [];
    if (flop1) currentCards.community.push(flop1);
    if (flop2) currentCards.community.push(flop2);
    if (flop3) currentCards.community.push(flop3);
    if (turn) currentCards.community.push(turn);
    if (river) currentCards.community.push(river);
    updateCardDisplay();
    if (hasEmptySelects() === false && hasDuplicateCards()) {
        showError('Duplicate cards selected!');
        return;
    }
    calculateOdds();
}
function updateCardDisplay() {
    const playerDisplay = document.getElementById('playerCards');
    playerDisplay.innerHTML = '';
    currentCards.player.forEach(card => {
        playerDisplay.appendChild(createCardElement(card));
    });
    const communityDisplay = document.getElementById('communityCards');
    communityDisplay.innerHTML = '';
    currentCards.community.forEach(card => {
        communityDisplay.appendChild(createCardElement(card));
    });
}
function createCardElement(card) {
    const div = document.createElement('div');
    div.className = 'card';
    div.textContent = card.toString();
    if (card.suit === '♥' || card.suit === '♦') {
        div.style.color = '#e74c3c';
    } else {
        div.style.color = '#fff';
    }
    return div;
}
function hasEmptySelects() {
    if (currentCards.player.length === 0 && currentCards.community.length === 0) {
        return true;
    }
    return false;
}
function hasDuplicateCards() {
    const allCards = new Set();
    const allCardsList = [...currentCards.player, ...currentCards.community];
    for (let card of allCardsList) {
        const str = card.toString();
        if (allCards.has(str)) {
            return true;
        }
        allCards.add(str);
    }
    return false;
}
function calculateOdds() {
    if (hasEmptySelects()) {
        clearResults();
        return;
    }
    if (hasDuplicateCards()) {
        showError('Duplicate cards selected!');
        clearResults();
        return;
    }
    const numOpponents = parseInt(document.getElementById('numOpponents').value) || 1;
    try {
        let handInfo = null;
        if (currentCards.community.length > 0) {
            const allCards = [...currentCards.player, ...currentCards.community];
            if (allCards.length >= 5) {
                handInfo = bestHand(allCards);
            }
        }
        const winProb = calculator.calculateWinProbability(
            currentCards.player,
            currentCards.community,
            numOpponents
        );
        const equity = calculator.calculateEquity(
            currentCards.player,
            currentCards.community,
            numOpponents
        );
        let outs = 0;
        if (currentCards.community.length > 0) {
            outs = getOuts(currentCards.player, currentCards.community);
        }
        updateResults(handInfo, winProb, equity, outs, numOpponents);
    } catch (error) {
        console.error('Calculation error:', error);
        clearResults();
    }
}
function updateResults(handInfo, winProb, equity, outs, numOpponents) {
    const handRankEl = document.getElementById('handRank');
    if (handInfo) {
        handRankEl.textContent = handInfo.name;
        handRankEl.style.color = 'var(--primary)';
    } else if (currentCards.player.length === 2 && currentCards.community.length === 0) {
        handRankEl.textContent = 'Pre-Flop';
        handRankEl.style.color = 'var(--cyan)';
    } else if (currentCards.player.length > 0) {
        handRankEl.textContent = 'Analyzing...';
        handRankEl.style.color = 'var(--secondary)';
    } else {
        handRankEl.textContent = '—';
        handRankEl.style.color = 'var(--text-secondary)';
    }
    const winProbEl = document.getElementById('winProb');
    if (winProb !== null) {
        const winPercent = (winProb * 100).toFixed(1);
        winProbEl.textContent = `${winPercent}%`;
        if (winPercent >= 70) winProbEl.style.color = 'var(--primary)';
        else if (winPercent >= 50) winProbEl.style.color = 'var(--secondary)';
        else winProbEl.style.color = 'var(--red)';
    } else {
        winProbEl.textContent = '—';
    }
    const equityEl = document.getElementById('equity');
    if (equity !== null) {
        equityEl.textContent = `${equity.toFixed(1)}%`;
        if (equity >= 50) equityEl.style.color = 'var(--primary)';
        else if (equity >= 30) equityEl.style.color = 'var(--secondary)';
        else equityEl.style.color = 'var(--red)';
    } else {
        equityEl.textContent = '—';
    }
    const outsEl = document.getElementById('outs');
    if (outs > 0) {
        outsEl.textContent = outs;
        outsEl.style.color = 'var(--primary)';
    } else if (currentCards.community.length > 0) {
        outsEl.textContent = '0';
        outsEl.style.color = 'var(--text-secondary)';
    } else {
        outsEl.textContent = '—';
    }
    updateOddsDetails(handInfo);
    displayProgressBar(winProb);
}
function updateOddsDetails(handInfo) {
    const detailsEl = document.getElementById('oddsDetails');
    detailsEl.innerHTML = '';
    if (!handInfo || currentCards.community.length === 0) {
        detailsEl.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 10px;">📊 Select community cards to see detailed analysis</p>';
        return;
    }
    let html = '';
    html += `<div class="odds-detail-row">
        <span class="odds-detail-label">✋ Best Hand:</span>
        <span class="odds-detail-value">${handInfo.name}</span>
    </div>`;
    if (currentCards.community.length < 5) {
        const cardsNeeded = 5 - currentCards.community.length;
        html += `<div class="odds-detail-row">
            <span class="odds-detail-label">🃏 Cards to Come:</span>
            <span class="odds-detail-value">${cardsNeeded}</span>
        </div>`;
        const cardsUsed = new Set();
        [...currentCards.player, ...currentCards.community].forEach(c => {
            cardsUsed.add(c.toString());
        });
        const remainingCount = 52 - cardsUsed.size;
        html += `<div class="odds-detail-row">
            <span class="odds-detail-label">📦 Remaining Cards:</span>
            <span class="odds-detail-value">${remainingCount}</span>
        </div>`;
    } else {
        html += `<div class="odds-detail-row">
            <span class="odds-detail-label">🏁 Board Complete:</span>
            <span class="odds-detail-value">FINAL</span>
        </div>`;
    }
    detailsEl.innerHTML = html;
}
function displayProgressBar(winProb) {
    const barEl = document.getElementById('progressBar');
    if (winProb === null) {
        barEl.innerHTML = '';
        return;
    }
    const percentage = Math.round(winProb * 100);
    let statusText = '';
    if (percentage >= 70) statusText = '💪 Strong';
    else if (percentage >= 50) statusText = '⚖️ Balanced';
    else if (percentage >= 30) statusText = '⚠️ Weak';
    else statusText = '❌ Very Weak';
    barEl.innerHTML = `
        <div class="odds-detail-row">
            <span class="odds-detail-label">Overall Strength: ${statusText}</span>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${percentage}%"></div>
            </div>
        </div>
    `;
}
function clearResults() {
    document.getElementById('handRank').textContent = '—';
    document.getElementById('winProb').textContent = '—';
    document.getElementById('equity').textContent = '—';
    document.getElementById('outs').textContent = '—';
    document.getElementById('oddsDetails').innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 10px;">📊 Select community cards to see detailed analysis</p>';
    document.getElementById('progressBar').innerHTML = '';
}
function showError(message) {
    alert(message);
}
function resetCalculator() {
    selectedCardSlots = {
        card1: null,
        card2: null,
        flop1: null,
        flop2: null,
        flop3: null,
        turn: null,
        river: null
    };
    document.querySelectorAll('.card-picker-btn').forEach(btn => {
        const slotId = btn.getAttribute('data-card-slot');
        updateButtonDisplay(slotId, null);
    });
    currentCards = {
        player: [],
        community: []
    };
    updateCardDisplay();
    clearResults();
}