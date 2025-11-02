// Slots Game Client

const SYMBOLS = ['🍒', '🍊', '🍋', '🔔', '💎', '👑', '7️⃣', '🎰'];
const RTP = 0.96;

let gameState = {
    balance: 5000,
    bet: 100,
    spinning: false,
    lastWin: 0
};

document.addEventListener('DOMContentLoaded', () => {
    loadBalance();
    updateDisplay();
    
    document.getElementById('betInput').addEventListener('change', (e) => {
        gameState.bet = Math.max(10, Math.min(gameState.balance, parseInt(e.target.value) || 100));
        updateDisplay();
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
}

function updateDisplay() {
    document.getElementById('balance').textContent = '$' + gameState.balance.toLocaleString();
    document.getElementById('betInput').value = gameState.bet;
    document.getElementById('betInput').max = gameState.balance;
    document.getElementById('betDisplay').textContent = '$' + gameState.bet.toLocaleString();
    document.getElementById('maxWin').textContent = '$' + Math.floor(gameState.bet * 100 * RTP).toLocaleString();
    
    // Save balance to localStorage for offline persistence
    const offlineUser = localStorage.getItem('offlineUser');
    if (offlineUser) {
        const user = JSON.parse(offlineUser);
        user.balance = gameState.balance;
        localStorage.setItem('offlineUser', JSON.stringify(user));
    }
}

function getSymbol() {
    const rand = Math.random();
    
    if (rand < 0.35) return '🍒';
    if (rand < 0.50) return '🍊';
    if (rand < 0.60) return '🍋';
    if (rand < 0.70) return '🔔';
    if (rand < 0.80) return '💎';
    if (rand < 0.90) return '👑';
    if (rand < 0.98) return '7️⃣';
    return '🎰';
}

function spin() {
    if (gameState.spinning) return;
    if (gameState.bet > gameState.balance) {
        alert('Insufficient balance');
        return;
    }

    gameState.spinning = true;
    document.getElementById('spinBtn').disabled = true;
    document.getElementById('paylineText').textContent = 'Spinning...';
    document.getElementById('winAmount').textContent = '';

    gameState.balance -= gameState.bet;
    updateDisplay();

    const reels = document.getElementById('reels').querySelectorAll('.reel');
    const result = [];

    // Generate result
    for (let i = 0; i < 5; i++) {
        result[i] = getSymbol();
    }

    // Animate reels
    let completed = 0;
    reels.forEach((reel, idx) => {
        spinReel(reel, result[idx], () => {
            completed++;
            if (completed === 5) {
                checkWin(result);
                gameState.spinning = false;
                document.getElementById('spinBtn').disabled = false;
            }
        });
    });
}

function spinReel(reel, finalSymbol, callback) {
    const symbols = reel.querySelectorAll('.symbol');
    const duration = 500 + Math.random() * 200;
    const startTime = Date.now();

    reel.classList.add('spinning');

    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Simulate spinning by cycling through symbols
        const cycleCount = Math.floor(progress * 10);
        const randomIdx = Math.floor(Math.random() * SYMBOLS.length);
        
        if (symbols[0]) {
            symbols[0].textContent = progress < 0.95 
                ? SYMBOLS[randomIdx]
                : finalSymbol;
        }

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            if (symbols[0]) {
                symbols[0].textContent = finalSymbol;
            }
            reel.classList.remove('spinning');
            callback();
        }
    }

    animate();
}

function checkWin(result) {
    const payouts = {
        '🍒': { 3: 50, 4: 100, 5: 200 },
        '🍊': { 3: 75, 4: 150, 5: 300 },
        '🍋': { 3: 100, 4: 250, 5: 500 },
        '🔔': { 3: 150, 4: 400, 5: 800 },
        '💎': { 3: 200, 4: 600, 5: 1200 },
        '👑': { 3: 250, 4: 800, 5: 2000 },
        '7️⃣': { 3: 500, 4: 1500, 5: 5000 },
        '🎰': { 3: 1000, 4: 5000, 5: 10000 }
    };

    let totalWin = 0;
    const winLines = [];
    const reels = document.getElementById('reels').querySelectorAll('.reel');

    // Check horizontal lines (middle row is most common)
    // Check middle row
    const middle = result[0];
    if (result.every(s => s === middle)) {
        const multiplier = payouts[middle]?.[5] || 0;
        totalWin = multiplier * gameState.bet * RTP;
        winLines.push(`All 5 match: ${middle.repeat(5)}`);
        // Highlight all reels on big win
        reels.forEach(reel => reel.classList.add('win-highlight'));
    } else {
        // Check for 3 in a row
        for (let i = 0; i <= 2; i++) {
            if (result[i] === result[i + 1] && result[i + 1] === result[i + 2]) {
                const multiplier = payouts[result[i]]?.[3] || 0;
                totalWin = multiplier * gameState.bet * RTP;
                winLines.push(`3 in a row: ${result[i].repeat(3)}`);
                // Highlight winning reels
                for (let j = i; j < i + 3; j++) {
                    reels[j].classList.add('win-highlight');
                }
                break;
            }
        }
    }

    // Jackpot chance (1 in 10000)
    if (Math.random() < 0.0001) {
        totalWin = gameState.bet * 1000;
        winLines.push('🎰 JACKPOT! 🎰');
        // Highlight all reels on jackpot
        reels.forEach(reel => reel.classList.add('win-highlight'));
    }

    if (totalWin > 0) {
        gameState.lastWin = Math.floor(totalWin);
        gameState.balance += gameState.lastWin;
        document.getElementById('paylineText').textContent = winLines.join(' | ');
        document.getElementById('winAmount').textContent = `WIN: $${gameState.lastWin.toLocaleString()}`;
        document.getElementById('winAmount').style.color = '#00ff88';
        document.getElementById('winAmount').style.textShadow = '0 0 20px rgba(0, 255, 136, 1)';
    } else {
        document.getElementById('paylineText').textContent = 'No match - Try again!';
        document.getElementById('winAmount').textContent = '';
    }

    // Clean up highlights after animation completes
    setTimeout(() => {
        reels.forEach(reel => reel.classList.remove('win-highlight'));
    }, 800);

    updateDisplay();
}

function goBack() {
    window.location.href = 'index.html';
}