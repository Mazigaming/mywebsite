// Coin Flip Game - Enhanced Version

let selectedChoice = null;
let userBalance = 5000;
let gameStats = {
    flipsPlayed: 0,
    wins: 0,
    losses: 0
};
let isFlipping = false;

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    loadBalance();
    updateDisplay();
});

function selectChoice(choice) {
    if (isFlipping) return;
    
    selectedChoice = choice;
    document.getElementById('headsBtn').classList.remove('selected');
    document.getElementById('tailsBtn').classList.remove('selected');
    
    if (choice === 'heads') {
        document.getElementById('headsBtn').classList.add('selected');
        document.getElementById('selectedChoice').textContent = '👑 HEADS - Selected!';
    } else {
        document.getElementById('tailsBtn').classList.add('selected');
        document.getElementById('selectedChoice').textContent = '🎭 TAILS - Selected!';
    }
}

function flipCoin() {
    if (isFlipping) return;
    if (!selectedChoice) {
        alert('Please select Heads or Tails!');
        return;
    }

    const betAmount = parseInt(document.getElementById('betAmount').value);

    if (!betAmount || isNaN(betAmount) || betAmount <= 0) {
        alert('Please enter a valid bet amount!');
        return;
    }

    if (betAmount > userBalance) {
        alert('Insufficient balance! 💔');
        return;
    }

    isFlipping = true;
    document.getElementById('flipBtn').disabled = true;
    document.getElementById('headsBtn').disabled = true;
    document.getElementById('tailsBtn').disabled = true;

    // Determine result
    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    const won = result === selectedChoice;

    // Animate coin flip
    animateCoinFlip(result, betAmount, won);
}

function animateCoinFlip(result, betAmount, won) {
    const coinEl = document.getElementById('coin');
    const resultEl = document.getElementById('result');
    const finalRotation = result === 'heads' ? 0 : 180;
    
    // Calculate total rotation (at least 10 full rotations = 3600 degrees)
    const extraRotation = (Math.floor(Math.random() * 5) + 10) * 360;
    const totalRotation = extraRotation + finalRotation;

    // Animate the coin spin
    let startTime = Date.now();
    const duration = 2000; // 2 seconds
    
    const animationFrame = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for deceleration
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
        // Calculate current rotation
        const currentRotation = totalRotation * easeProgress;
        
        coinEl.style.transform = `rotateY(${currentRotation}deg) rotateX(${currentRotation * 0.5}deg)`;
        
        if (progress < 1) {
            requestAnimationFrame(animationFrame);
        } else {
            // Animation complete
            coinEl.style.transform = `rotateY(${finalRotation}deg)`;
            showResult(won, betAmount, result);
        }
    };
    
    requestAnimationFrame(animationFrame);
}

function showResult(won, betAmount, result) {
    const resultEl = document.getElementById('result');
    
    // Update balance and stats
    if (won) {
        userBalance += betAmount;
        gameStats.wins++;
        resultEl.textContent = `✓ YOU WON $${betAmount}! 🎉`;
        resultEl.style.color = '#00ff88';
        
        // Create particles
        createParticles('win');
    } else {
        userBalance -= betAmount;
        gameStats.losses++;
        resultEl.textContent = `✕ YOU LOST $${betAmount}! 😢`;
        resultEl.style.color = '#ff00ff';
        
        // Create particles
        createParticles('loss');
    }

    gameStats.flipsPlayed++;
    updateDisplay();
    saveBalance();

    // Reset for next flip
    setTimeout(() => {
        resultEl.textContent = '';
        document.getElementById('betAmount').value = '';
        document.getElementById('selectedChoice').textContent = '—';
        selectedChoice = null;
        document.getElementById('headsBtn').classList.remove('selected');
        document.getElementById('tailsBtn').classList.remove('selected');
        document.getElementById('headsBtn').disabled = false;
        document.getElementById('tailsBtn').disabled = false;
        document.getElementById('flipBtn').disabled = false;
        isFlipping = false;
    }, 2000);
}

function createParticles(type) {
    const gameArea = document.querySelector('.game-area');
    const particleCount = 12;
    const color = type === 'win' ? '#00ff88' : '#ff00ff';
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = '50%';
        particle.style.top = '50%';
        particle.style.background = color;
        particle.style.boxShadow = `0 0 10px ${color}`;
        
        const angle = (i / particleCount) * Math.PI * 2;
        const distance = 80 + Math.random() * 40;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        
        particle.style.setProperty('--tx', `${tx}px`);
        particle.style.setProperty('--ty', `${ty}px`);
        
        gameArea.appendChild(particle);
        
        setTimeout(() => particle.remove(), 1000);
    }
}

function updateDisplay() {
    document.getElementById('balance').textContent = `$${userBalance.toLocaleString()}`;
    document.getElementById('flipsPlayed').textContent = gameStats.flipsPlayed;
    document.getElementById('wins').textContent = gameStats.wins;
    document.getElementById('losses').textContent = gameStats.losses;
    
    // Calculate win rate
    if (gameStats.flipsPlayed > 0) {
        const winRate = Math.round((gameStats.wins / gameStats.flipsPlayed) * 100);
        document.getElementById('winRate').textContent = `${winRate}%`;
    } else {
        document.getElementById('winRate').textContent = '0%';
    }
}

function saveBalance() {
    // Save balance to main offlineUser storage
    const offlineUser = localStorage.getItem('offlineUser');
    if (offlineUser) {
        const user = JSON.parse(offlineUser);
        user.balance = userBalance;
        localStorage.setItem('offlineUser', JSON.stringify(user));
    }
}

function loadBalance() {
    // Load balance from main offlineUser storage
    const offlineUser = localStorage.getItem('offlineUser');
    if (offlineUser) {
        const user = JSON.parse(offlineUser);
        userBalance = user.balance || 5000;
    }
}

// Allow Enter key to flip
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !isFlipping) {
        flipCoin();
    }
});