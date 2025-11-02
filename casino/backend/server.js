const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json());

// Storage paths
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const GAMES_FILE = path.join(DATA_DIR, 'games.json');

// Initialize storage
function initStorage() {
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify({}));
  }
  if (!fs.existsSync(GAMES_FILE)) {
    fs.writeFileSync(GAMES_FILE, JSON.stringify({}));
  }
}

// User management
function getUsers() {
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function getGames() {
  return JSON.parse(fs.readFileSync(GAMES_FILE, 'utf8'));
}

function saveGames(games) {
  fs.writeFileSync(GAMES_FILE, JSON.stringify(games, null, 2));
}

// Hash IP for privacy
function hashIP(ip) {
  return crypto.createHash('sha256').update(ip).digest('hex');
}

// Get or create user
function getOrCreateUser(ip) {
  const ipHash = hashIP(ip);
  const users = getUsers();
  
  if (users[ipHash]) {
    // Check daily reward
    const user = users[ipHash];
    const lastRewardDate = new Date(user.lastRewardDate || 0);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    
    if (lastRewardDate < today) {
      user.balance += 1000;
      user.lastRewardDate = new Date().toISOString();
      saveUsers(users);
    }
    return user;
  }
  
  // Create new user
  const newUser = {
    id: uuidv4(),
    ipHash,
    balance: 5000,
    username: `Player_${Math.random().toString(36).substr(2, 9)}`,
    stats: {
      gamesPlayed: 0,
      winCount: 0,
      totalWon: 0,
      totalLost: 0
    },
    createdAt: new Date().toISOString(),
    lastRewardDate: new Date().toISOString(),
    avatar: Math.floor(Math.random() * 10)
  };
  
  users[ipHash] = newUser;
  saveUsers(users);
  return newUser;
}

// WebSocket connections
const clients = new Map();
const gameRooms = new Map();

wss.on('connection', (ws, req) => {
  const ip = req.socket.remoteAddress;
  const user = getOrCreateUser(ip);
  const clientId = uuidv4();
  
  clients.set(clientId, {
    ws,
    user,
    ip,
    gameId: null,
    roomId: null
  });
  
  console.log(`Client connected: ${clientId} (${user.username})`);
  
  // Send initial user data
  ws.send(JSON.stringify({
    type: 'INIT',
    data: { clientId, user }
  }));
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      handleMessage(clientId, message);
    } catch (err) {
      console.error('Message parse error:', err);
    }
  });
  
  ws.on('close', () => {
    clients.delete(clientId);
    console.log(`Client disconnected: ${clientId}`);
  });
});

function handleMessage(clientId, message) {
  const client = clients.get(clientId);
  if (!client) return;
  
  switch (message.type) {
    case 'CREATE_GAME':
      createGame(clientId, message.data);
      break;
    case 'JOIN_GAME':
      joinGame(clientId, message.data);
      break;
    case 'CREATE_ROOM':
      createRoom(clientId, message.data);
      break;
    case 'JOIN_ROOM':
      joinRoom(clientId, message.data);
      break;
    case 'LEAVE_ROOM':
      leaveRoom(clientId);
      break;
    case 'LIST_ROOMS':
      listRooms(clientId);
      break;
    case 'GAME_ACTION':
      gameAction(clientId, message.data);
      break;
    case 'UPDATE_PROFILE':
      updateProfile(clientId, message.data);
      break;
    case 'GET_STATS':
      getStats(clientId);
      break;
  }
}

function createGame(clientId, data) {
  const client = clients.get(clientId);
  const gameId = uuidv4();
  const games = getGames();
  
  const game = {
    id: gameId,
    type: data.gameType, // 'holdem', 'blackjack', 'slots', 'plinko'
    createdBy: client.user.id,
    players: [client.user.id],
    status: 'waiting',
    createdAt: new Date().toISOString(),
    buyIn: data.buyIn || 100,
    state: {}
  };
  
  games[gameId] = game;
  saveGames(games);
  
  client.gameId = gameId;
  
  // Broadcast game creation
  broadcast({
    type: 'GAME_CREATED',
    data: { game }
  });
}

function joinGame(clientId, data) {
  const client = clients.get(clientId);
  const games = getGames();
  const game = games[data.gameId];
  
  if (!game) {
    client.ws.send(JSON.stringify({
      type: 'ERROR',
      message: 'Game not found'
    }));
    return;
  }
  
  if (game.players.includes(client.user.id)) {
    client.ws.send(JSON.stringify({
      type: 'ERROR',
      message: 'Already in this game'
    }));
    return;
  }
  
  // Check buy-in
  if (client.user.balance < game.buyIn) {
    client.ws.send(JSON.stringify({
      type: 'ERROR',
      message: 'Insufficient balance'
    }));
    return;
  }
  
  game.players.push(client.user.id);
  client.gameId = data.gameId;
  saveGames(games);
  
  // Notify all clients in game
  broadcast({
    type: 'PLAYER_JOINED',
    data: { gameId: data.gameId, player: client.user }
  });
}

function gameAction(clientId, data) {
  const client = clients.get(clientId);
  const games = getGames();
  const game = games[client.gameId];
  
  if (!game) return;
  
  // Game-specific logic handled by game engines
  broadcast({
    type: 'GAME_ACTION',
    data: { 
      gameId: client.gameId,
      playerId: client.user.id,
      action: data.action,
      payload: data.payload
    }
  });
}

function updateProfile(clientId, data) {
  const client = clients.get(clientId);
  const users = getUsers();
  const user = users[client.user.ipHash];
  
  if (data.username) user.username = data.username.substr(0, 20);
  if (data.avatar !== undefined) user.avatar = data.avatar;
  
  saveUsers(users);
  client.user = user;
  
  client.ws.send(JSON.stringify({
    type: 'PROFILE_UPDATED',
    data: { user }
  }));
}

function getStats(clientId) {
  const client = clients.get(clientId);
  
  client.ws.send(JSON.stringify({
    type: 'STATS',
    data: client.user.stats
  }));
}

// Room management for multiplayer games
function createRoom(clientId, data) {
  const client = clients.get(clientId);
  const roomId = uuidv4();
  
  const room = {
    id: roomId,
    name: data.name || `Room ${roomId.substr(0, 6)}`,
    gameType: data.gameType || 'holdem',
    creator: client.user.id,
    players: [client.user.id],
    maxPlayers: data.maxPlayers || 6,
    buyIn: data.buyIn || 100,
    status: 'waiting',
    createdAt: new Date().toISOString()
  };
  
  gameRooms.set(roomId, room);
  client.roomId = roomId;
  
  // Notify all clients about new room
  broadcast({
    type: 'ROOM_CREATED',
    data: { room }
  });
  
  console.log(`Room created: ${roomId} by ${client.user.username}`);
}

function joinRoom(clientId, data) {
  const client = clients.get(clientId);
  const room = gameRooms.get(data.roomId);
  
  if (!room) {
    client.ws.send(JSON.stringify({
      type: 'ERROR',
      message: 'Room not found'
    }));
    return;
  }
  
  if (room.players.length >= room.maxPlayers) {
    client.ws.send(JSON.stringify({
      type: 'ERROR',
      message: 'Room is full'
    }));
    return;
  }
  
  if (client.user.balance < room.buyIn) {
    client.ws.send(JSON.stringify({
      type: 'ERROR',
      message: 'Insufficient balance for buy-in'
    }));
    return;
  }
  
  room.players.push(client.user.id);
  client.roomId = data.roomId;
  
  // Notify all clients in the room
  broadcastToRoom(data.roomId, {
    type: 'PLAYER_JOINED',
    data: { player: client.user, room: room }
  });
  
  console.log(`Player ${client.user.username} joined room ${data.roomId}`);
}

function leaveRoom(clientId) {
  const client = clients.get(clientId);
  if (!client.roomId) return;
  
  const room = gameRooms.get(client.roomId);
  if (room) {
    room.players = room.players.filter(id => id !== client.user.id);
    
    if (room.players.length === 0) {
      gameRooms.delete(client.roomId);
    } else {
      broadcastToRoom(client.roomId, {
        type: 'PLAYER_LEFT',
        data: { playerId: client.user.id, room: room }
      });
    }
  }
  
  client.roomId = null;
}

function listRooms(clientId) {
  const client = clients.get(clientId);
  const rooms = Array.from(gameRooms.values()).filter(r => r.status === 'waiting');
  
  client.ws.send(JSON.stringify({
    type: 'ROOMS_LIST',
    data: { rooms }
  }));
}

function broadcastToRoom(roomId, message) {
  const data = JSON.stringify(message);
  const room = gameRooms.get(roomId);
  if (!room) return;
  
  clients.forEach(client => {
    if (room.players.includes(client.user.id) && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(data);
    }
  });
}

function broadcast(message) {
  const data = JSON.stringify(message);
  clients.forEach(client => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(data);
    }
  });
}

// HTTP Routes
app.get('/api/user', (req, res) => {
  const ip = req.ip;
  const user = getOrCreateUser(ip);
  res.json(user);
});

app.get('/api/games', (req, res) => {
  const games = getGames();
  const activeGames = Object.values(games).filter(g => g.status === 'waiting');
  res.json(activeGames);
});

app.get('/api/rooms', (req, res) => {
  const rooms = Array.from(gameRooms.values())
    .filter(r => r.status === 'waiting')
    .map(r => ({
      id: r.id,
      name: r.name,
      gameType: r.gameType,
      players: r.players.length,
      maxPlayers: r.maxPlayers,
      buyIn: r.buyIn,
      createdAt: r.createdAt
    }));
  res.json(rooms);
});

app.post('/api/rooms', (req, res) => {
  const { name, gameType, maxPlayers, buyIn } = req.body;
  const roomId = uuidv4();
  const ip = req.ip;
  const user = getOrCreateUser(ip);
  
  const room = {
    id: roomId,
    name: name || `Room ${roomId.substr(0, 6)}`,
    gameType: gameType || 'holdem',
    creator: user.id,
    players: [user.id],
    maxPlayers: maxPlayers || 6,
    buyIn: buyIn || 100,
    status: 'waiting',
    createdAt: new Date().toISOString()
  };
  
  gameRooms.set(roomId, room);
  res.json(room);
});

app.get('/api/leaderboard', (req, res) => {
  const users = getUsers();
  const leaderboard = Object.values(users)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 50)
    .map(u => ({
      username: u.username,
      balance: u.balance,
      stats: u.stats
    }));
  res.json(leaderboard);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Initialize and start
initStorage();

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Virtual Casino Server running on port ${PORT}`);
  console.log(`WebSocket server ready`);
});