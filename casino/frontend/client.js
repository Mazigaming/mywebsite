// Virtual Casino Client

let ws;
let currentUser = null;
let clientId = null;
let isOfflineMode = false;
let selectedDifficulty = 'medium';
const SERVER_URL = 'ws://localhost:3000'; // Change to your server URL
const AVATARS = ['🎰', '🃏', '♠️', '💎', '👑', '🎲', '💰', '🎯', '⭐', '🔥'];

// Offline mode support
function detectOfflineMode() {
    try {
        // Try to connect to server
        fetch('http://localhost:3000/health')
            .then(() => {
                isOfflineMode = false;
                connectToServer();
            })
            .catch(() => {
                isOfflineMode = true;
                console.log('Server not available - using offline mode');
                initializeOfflineMode();
            });
    } catch (err) {
        isOfflineMode = true;
        initializeOfflineMode();
    }
}

function initializeOfflineMode() {
    // Create offline account if not exists
    const offlineUser = localStorage.getItem('offlineUser');
    if (!offlineUser) {
        const newUser = {
            id: 'offline-' + Math.random().toString(36).substr(2, 9),
            username: `Offline_Player_${Math.floor(Math.random() * 1000)}`,
            balance: 5000,
            avatar: Math.floor(Math.random() * AVATARS.length),
            stats: {
                gamesPlayed: 0,
                winCount: 0,
                totalWon: 0,
                totalLost: 0
            }
        };
        localStorage.setItem('offlineUser', JSON.stringify(newUser));
        currentUser = newUser;
    } else {
        currentUser = JSON.parse(offlineUser);
    }
    
    clientId = 'offline-client';
    updateUserPanel();
    updateConnectionStatus(false);
    loadGames();
    loadLeaderboard();
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    detectOfflineMode();
    renderAvatarGrid();
});

function connectToServer() {
    try {
        ws = new WebSocket(SERVER_URL);
        
        ws.onopen = () => {
            console.log('Connected to server');
            updateConnectionStatus(true);
        };

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            handleServerMessage(message);
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            updateConnectionStatus(false);
        };

        ws.onclose = () => {
            console.log('Disconnected from server');
            updateConnectionStatus(false);
            setTimeout(() => connectToServer(), 3000);
        };
    } catch (err) {
        console.error('Connection error:', err);
        updateConnectionStatus(false);
    }
}

function handleServerMessage(message) {
    switch (message.type) {
        case 'INIT':
            currentUser = message.data.user;
            clientId = message.data.clientId;
            updateUserPanel();
            break;
        
        case 'PROFILE_UPDATED':
            currentUser = message.data.user;
            updateUserPanel();
            break;
        
        case 'GAME_CREATED':
            console.log('Game created:', message.data.game);
            loadGames();
            break;
        
        case 'PLAYER_JOINED':
            console.log('Player joined:', message.data.player);
            break;
        
        case 'GAME_ACTION':
            handleGameAction(message.data);
            break;
        
        case 'ERROR':
            alert(`Error: ${message.message}`);
            break;
    }
}

function updateUserPanel() {
    if (!currentUser) return;

    // Handle custom profile image or emoji avatar
    const avatarElement = document.getElementById('userAvatar');
    if (currentUser.customImage) {
        avatarElement.innerHTML = `<img src="${currentUser.customImage}" alt="Profile" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
    } else {
        avatarElement.textContent = AVATARS[currentUser.avatar] || '🎰';
    }
    
    document.getElementById('userName').textContent = currentUser.username;
    const balanceText = `$${currentUser.balance.toLocaleString()}`;
    document.getElementById('userBalance').textContent = balanceText;
    document.getElementById('headerBalance').textContent = balanceText;
    document.getElementById('gamesPlayed').textContent = currentUser.stats.gamesPlayed;
    document.getElementById('winCount').textContent = currentUser.stats.winCount;
    
    const winRate = currentUser.stats.gamesPlayed > 0 
        ? Math.round((currentUser.stats.winCount / currentUser.stats.gamesPlayed) * 100)
        : 0;
    document.getElementById('winRate').textContent = winRate + '%';
}

function updateConnectionStatus(connected) {
    const status = document.getElementById('connectionStatus');
    if (connected) {
        status.textContent = '● Connected';
        status.style.color = '#4ade80';
    } else {
        status.textContent = '● Disconnected';
        status.style.color = '#ff6b6b';
    }
}

function loadGames() {
    // Fetch available games from server
    fetch('http://localhost:3000/api/games')
        .then(res => res.json())
        .then(games => {
            const container = document.getElementById('gamesContainer');
            container.innerHTML = `
                <div class="game-card" onclick="startGame('holdem')">
                    <div class="game-emoji">🃏</div>
                    <div class="game-name">Texas Hold'em</div>
                    <div class="game-info">1-6 players | Multiplayer</div>
                </div>
                <div class="game-card" onclick="startGame('poker-offline')">
                    <div class="game-emoji">♠️</div>
                    <div class="game-name">Offline Poker</div>
                    <div class="game-info">vs AI Dealer | Offline</div>
                </div>
                <div class="game-card" onclick="startGame('blackjack')">
                    <div class="game-emoji">🎲</div>
                    <div class="game-name">Blackjack</div>
                    <div class="game-info">vs Dealer | Single Player</div>
                </div>
                <div class="game-card" onclick="startGame('slots')">
                    <div class="game-emoji">🎰</div>
                    <div class="game-name">Slots</div>
                    <div class="game-info">5x3 Reels | Instant</div>
                </div>
                <div class="game-card" onclick="startGame('plinko')">
                    <div class="game-emoji">⚪</div>
                    <div class="game-name">Plinko</div>
                    <div class="game-info">Risk/Reward | Instant</div>
                </div>
                <div class="game-card" onclick="startGame('coinflip')">
                    <div class="game-emoji">🪙</div>
                    <div class="game-name">Coin Flip</div>
                    <div class="game-info">50/50 Odds | Instant</div>
                </div>
            `;
        })
        .catch(err => {
            // Fallback if server not available
            const container = document.getElementById('gamesContainer');
            container.innerHTML = `
                <div class="game-card" onclick="startGame('holdem')">
                    <div class="game-emoji">🃏</div>
                    <div class="game-name">Texas Hold'em</div>
                    <div class="game-info">1-6 players | Multiplayer</div>
                </div>
                <div class="game-card" onclick="startGame('poker-offline')">
                    <div class="game-emoji">♠️</div>
                    <div class="game-name">Offline Poker</div>
                    <div class="game-info">vs AI Dealer | Offline</div>
                </div>
                <div class="game-card" onclick="startGame('blackjack')">
                    <div class="game-emoji">🎲</div>
                    <div class="game-name">Blackjack</div>
                    <div class="game-info">vs Dealer | Single Player</div>
                </div>
                <div class="game-card" onclick="startGame('slots')">
                    <div class="game-emoji">🎰</div>
                    <div class="game-name">Slots</div>
                    <div class="game-info">5x3 Reels | Instant</div>
                </div>
                <div class="game-card" onclick="startGame('plinko')">
                    <div class="game-emoji">⚪</div>
                    <div class="game-name">Plinko</div>
                    <div class="game-info">Risk/Reward | Instant</div>
                </div>
                <div class="game-card" onclick="startGame('coinflip')">
                    <div class="game-emoji">🪙</div>
                    <div class="game-name">Coin Flip</div>
                    <div class="game-info">50/50 Odds | Instant</div>
                </div>
            `;
        });
}

function loadMyGames() {
    alert('My Games feature coming soon!');
}

function loadLeaderboard() {
    fetch('http://localhost:3000/api/leaderboard')
        .then(res => res.json())
        .then(leaderboard => {
            const list = document.getElementById('leaderboardList');
            list.innerHTML = leaderboard.map((player, idx) => `
                <div class="leaderboard-item">
                    <span class="leaderboard-rank">#${idx + 1}</span>
                    <span>${player.username.substr(0, 10)}</span>
                    <span class="leaderboard-amount">$${player.balance.toLocaleString()}</span>
                </div>
            `).join('');
        })
        .catch(err => console.error('Error loading leaderboard:', err));
}

function startGame(gameType) {
    if (!currentUser) {
        alert('Please wait for user data to load');
        return;
    }

    switch (gameType) {
        case 'holdem':
            openDifficultyModal('holdem');
            break;
        case 'poker-offline':
            window.location.href = 'poker-offline.html';
            break;
        case 'blackjack':
            openDifficultyModal('blackjack');
            break;
        case 'slots':
            openDifficultyModal('slots');
            break;
        case 'plinko':
            openPlinkoGame();
            break;
        case 'coinflip':
            openCoinflipGame();
            break;
    }
}

function openDifficultyModal(gameType) {
    const modalId = `difficultyModal${gameType.charAt(0).toUpperCase() + gameType.slice(1)}`;
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

function closeDifficultyModal() {
    document.getElementById('difficultyModalBlackjack').classList.remove('active');
    document.getElementById('difficultyModalHoldem').classList.remove('active');
    document.getElementById('difficultyModalSlots').classList.remove('active');
}

function selectDifficulty(gameType, difficulty) {
    selectedDifficulty = difficulty;
    closeDifficultyModal();

    switch (gameType) {
        case 'holdem':
            openHoldemGame(difficulty);
            break;
        case 'blackjack':
            openBlackjackGame(difficulty);
            break;
        case 'slots':
            openSlotsGame(difficulty);
            break;
    }
}

function openCoinflipGame() {
    window.location.href = 'coinflip.html';
}

function openHoldemGame(difficulty = 'medium') {
    const buyIn = prompt('Enter buy-in amount ($100-$10000):', '1000');
    if (!buyIn || isNaN(buyIn)) return;

    const amount = parseInt(buyIn);
    if (amount < 100 || amount > 10000) {
        alert('Invalid buy-in amount');
        return;
    }

    if (amount > currentUser.balance) {
        alert('Insufficient balance');
        return;
    }

    // Save difficulty to localStorage for game page
    localStorage.setItem('gameDifficulty', difficulty);

    // Send create game message (only if online)
    if (!isOfflineMode && ws) {
        ws.send(JSON.stringify({
            type: 'CREATE_GAME',
            data: {
                gameType: 'holdem',
                buyIn: amount,
                difficulty: difficulty
            }
        }));
    }

    window.location.href = 'holdem.html';
}

function openBlackjackGame(difficulty = 'medium') {
    // Save difficulty to localStorage for game page
    localStorage.setItem('gameDifficulty', difficulty);
    window.location.href = 'blackjack.html';
}

function openSlotsGame(difficulty = 'medium') {
    // Save difficulty to localStorage for game page
    localStorage.setItem('gameDifficulty', difficulty);
    window.location.href = 'slots.html';
}

function openPlinkoGame() {
    window.location.href = 'plinko.html';
}

function renderAvatarGrid() {
    const grid = document.getElementById('avatarGrid');
    grid.innerHTML = AVATARS.map((avatar, idx) => `
        <button class="btn" style="width: 100%; padding: 15px;" onclick="selectAvatar(${idx})">
            ${avatar}
        </button>
    `).join('');
}

let selectedAvatarIdx = 0;

function selectAvatar(idx) {
    selectedAvatarIdx = idx;
    document.querySelectorAll('#avatarGrid button').forEach((btn, i) => {
        if (i === idx) {
            btn.style.background = '#8a4cff';
            btn.style.borderColor = '#b088ff';
        } else {
            btn.style.background = '#4b3a6b';
            btn.style.borderColor = '#6a4c93';
        }
    });
}

function openProfileModal() {
    const modal = document.getElementById('profileModal');
    document.getElementById('usernameInput').value = currentUser.username;
    selectedAvatarIdx = currentUser.avatar;
    renderAvatarGrid();
    selectAvatar(selectedAvatarIdx);
    modal.classList.add('active');
}

function closeProfileModal() {
    document.getElementById('profileModal').classList.remove('active');
}

function saveProfile() {
    const username = document.getElementById('usernameInput').value;
    const customImage = document.getElementById('profileImageInput')?.files?.[0];
    
    if (!username || username.length < 3) {
        alert('Username must be at least 3 characters');
        return;
    }

    // Handle offline mode profile save
    if (isOfflineMode) {
        const offlineUser = JSON.parse(localStorage.getItem('offlineUser'));
        offlineUser.username = username;
        offlineUser.avatar = selectedAvatarIdx;
        
        // If custom image uploaded, save as data URL
        if (customImage) {
            const reader = new FileReader();
            reader.onload = (e) => {
                offlineUser.customImage = e.target.result;
                localStorage.setItem('offlineUser', JSON.stringify(offlineUser));
                currentUser = offlineUser;
                updateUserPanel();
                closeProfileModal();
            };
            reader.readAsDataURL(customImage);
            return;
        }
        
        // Remove custom image if switching back to emojis
        delete offlineUser.customImage;
        localStorage.setItem('offlineUser', JSON.stringify(offlineUser));
        currentUser = offlineUser;
        updateUserPanel();
        closeProfileModal();
        return;
    }

    // Online mode - send to server
    if (!ws) return;
    
    ws.send(JSON.stringify({
        type: 'UPDATE_PROFILE',
        data: {
            username,
            avatar: selectedAvatarIdx
        }
    }));

    closeProfileModal();
}

// Stats requests
function getStats() {
    ws.send(JSON.stringify({
        type: 'GET_STATS'
    }));
}

// Game action handler
function handleGameAction(data) {
    console.log('Game action:', data);
    // Game-specific handlers will be in individual game files
}

// Auto-load leaderboard every 30 seconds
setInterval(loadLeaderboard, 30000);

// Close modals on outside click
document.getElementById('profileModal').addEventListener('click', (e) => {
    if (e.target.id === 'profileModal') {
        closeProfileModal();
    }
});

// Close difficulty modals on outside click
if (document.getElementById('difficultyModalBlackjack')) {
    document.getElementById('difficultyModalBlackjack').addEventListener('click', (e) => {
        if (e.target.id === 'difficultyModalBlackjack') {
            closeDifficultyModal();
        }
    });
}

if (document.getElementById('difficultyModalHoldem')) {
    document.getElementById('difficultyModalHoldem').addEventListener('click', (e) => {
        if (e.target.id === 'difficultyModalHoldem') {
            closeDifficultyModal();
        }
    });
}

if (document.getElementById('difficultyModalSlots')) {
    document.getElementById('difficultyModalSlots').addEventListener('click', (e) => {
        if (e.target.id === 'difficultyModalSlots') {
            closeDifficultyModal();
        }
    });
}