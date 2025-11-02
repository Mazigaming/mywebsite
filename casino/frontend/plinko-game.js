// Plinko Game Client

const RTP = 0.95;

let gameState = {
    balance: 5000,
    bet: 100,
    difficulty: 8,
    playing: false,
    multipliers: []
};

document.addEventListener('DOMContentLoaded', () => {
    loadBalance();
    setDifficulty(8, document.querySelector('.risk-option'));
    
    document.getElementById('betInput').addEventListener('change', (e) => {
        gameState.bet = Math.max(10, Math.min(gameState.balance, parseInt(e.target.value) || 100));
        document.getElementById('betInput').value = gameState.bet;
    });
});

function loadBalance() {
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
        localStorage.setItem('offlineUser', JSON.stringify(user));
    }
}

function setDifficulty(difficulty, element) {
    gameState.difficulty = difficulty;
    document.querySelectorAll('.risk-option').forEach(opt => opt.classList.remove('active'));
    element.classList.add('active');
    document.getElementById('difficultyDisplay').textContent = difficulty + ' rows';
    renderBoard();
}

function generateMultipliers(rows) {
    const multipliers = [];
    const center = rows / 2;
    
    for (let i = 0; i <= rows; i++) {
        const distance = Math.abs(i - center);
        const baseMultiplier = Math.max(0.5, 2 - (distance * 0.15));
        multipliers.push(parseFloat(baseMultiplier.toFixed(2)));
    }
    
    return multipliers;
}

function renderBoard() {
    gameState.multipliers = generateMultipliers(gameState.difficulty);
    
    // Render pegs
    const pegsContainer = document.getElementById('pegsContainer');
    pegsContainer.innerHTML = '';
    
    for (let row = 0; row < gameState.difficulty; row++) {
        const pegRow = document.createElement('div');
        pegRow.className = 'peg-row';
        
        for (let col = 0; col <= row; col++) {
            const peg = document.createElement('div');
            peg.className = 'peg';
            pegRow.appendChild(peg);
        }
        
        pegsContainer.appendChild(pegRow);
    }
    
    // Render buckets
    renderBuckets();
}

function renderBuckets() {
    const bucketsContainer = document.getElementById('bucketsContainer');
    bucketsContainer.innerHTML = '';
    
    gameState.multipliers.forEach((mult, idx) => {
        const bucket = document.createElement('div');
        bucket.className = 'bucket';
        bucket.innerHTML = `<div class="multiplier">${mult}x</div>`;
        bucket.id = `bucket-${idx}`;
        bucketsContainer.appendChild(bucket);
    });
}

function dropBall() {
    if (gameState.playing) return;
    if (gameState.bet > gameState.balance) {
        alert('Insufficient balance');
        return;
    }

    gameState.playing = true;
    document.getElementById('dropBtn').disabled = true;
    document.getElementById('resultPanel').classList.remove('active');
    
    gameState.balance -= gameState.bet;
    updateBalance();

    // Create visual ball element
    const board = document.querySelector('.board');
    const ball = document.createElement('div');
    ball.className = 'ball';
    const pegsContainer = document.getElementById('pegsContainer');
    pegsContainer.appendChild(ball);

    // Simulate ball drop with physics
    let position = gameState.difficulty / 2;
    let row = 0;
    let xOffset = 0;
    const speed = 60;
    const bounceAmount = 15;
    
    function dropStep() {
        const bounce = Math.random() < 0.5 ? -1 : 1;
        position += bounce;
        xOffset += bounce * bounceAmount;
        position = Math.max(0, Math.min(position, gameState.difficulty));
        row++;

        // Update ball position with easing
        const baseY = (row / gameState.difficulty) * 300;
        const rotation = (row * 45 + xOffset * 2) % 360;
        ball.style.transform = `translateX(${xOffset}px) translateY(${baseY}px) rotateZ(${rotation}deg) scale(1)`;

        if (row <= gameState.difficulty) {
            setTimeout(dropStep, speed);
        } else {
            // Final drop animation
            ball.style.animation = 'ballImpact 0.4s ease-out';
            setTimeout(() => {
                ball.remove();
                endGame(Math.floor(position));
            }, 400);
        }
    }

    dropStep();
}

function endGame(finalPosition) {
    const multiplier = gameState.multipliers[finalPosition];
    const winAmount = Math.floor(gameState.bet * multiplier * RTP);
    
    gameState.balance += winAmount;
    updateBalance();

    // Highlight winning bucket with animation
    document.querySelectorAll('.bucket').forEach(b => b.classList.remove('active', 'win'));
    const winBucket = document.getElementById(`bucket-${finalPosition}`);
    winBucket.classList.add('active');
    winBucket.classList.add('win');

    // Show result
    const resultPanel = document.getElementById('resultPanel');
    document.getElementById('resultText').textContent = `Ball landed in bucket ${finalPosition}!`;
    document.getElementById('winAmount').textContent = `${multiplier}x - WIN: $${winAmount.toLocaleString()}`;
    
    // Color the win amount based on magnitude
    const winAmountEl = document.getElementById('winAmount');
    if (multiplier >= 1.5) {
        winAmountEl.style.color = '#4ade80';
        winAmountEl.style.textShadow = '0 0 20px rgba(0, 255, 136, 1)';
    } else if (multiplier >= 1.0) {
        winAmountEl.style.color = '#00ffff';
        winAmountEl.style.textShadow = '0 0 15px rgba(0, 255, 255, 0.8)';
    } else {
        winAmountEl.style.color = '#c0b0e0';
        winAmountEl.style.textShadow = 'none';
    }
    
    resultPanel.classList.add('active');

    // Clean up win animation after it completes
    setTimeout(() => {
        winBucket.classList.remove('win');
    }, 600);

    gameState.playing = false;
    document.getElementById('dropBtn').disabled = false;
}

function goBack() {
    window.location.href = 'index.html';
}