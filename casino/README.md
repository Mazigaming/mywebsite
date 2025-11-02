# Virtual Casino 🎰

A P2P multiplayer virtual casino built with WebSocket and Node.js. Users earn and gamble virtual currency with real casino game mechanics.

## Features

### Games
- **Texas Hold'em** - Multiplayer poker with real hand rankings
- **Blackjack** - Single-player vs dealer with 6-deck shoe
- **Slots** - 5x3 reels with 96% RTP
- **Plinko** - Risk/reward game with variable difficulty

### User System
- IP-based user identification (hashed for privacy)
- Starting balance: $5,000
- Daily reward: $1,000 at 00:00 UTC (checked on login)
- Profile customization (username, avatar)
- Stats tracking (games played, win count, total won/lost)

### Real Casino Mechanics
- Proper probability and RTP (Return to Player)
- Blackjack with correct hand evaluation
- Poker hand rankings and chip management
- Slot machine with weighted symbol probabilities
- Plinko with realistic Gaussian distribution

## Installation

### Backend Setup

1. Install dependencies:
```bash
cd casino/backend
npm install
```

2. Start the server:
```bash
npm start
```

Server runs on `http://localhost:3000`

### Frontend Setup

1. Open `casino/frontend/index.html` in a web browser
2. Or serve with a local server:
```bash
cd casino/frontend
npx http-server -p 8000
```

## Configuration

### Server URL

Edit in `frontend/client.js`:
```javascript
const SERVER_URL = 'ws://localhost:3000'; // Change this for production
```

## File Structure

```
casino/
├── backend/
│   ├── server.js           # Main WebSocket server
│   ├── package.json        # Dependencies
│   └── data/               # User and game storage
├── frontend/
│   ├── index.html          # Main lobby
│   ├── blackjack.html      # Blackjack UI
│   ├── slots.html          # Slots UI
│   ├── plinko.html         # Plinko UI
│   ├── client.js           # WebSocket client
│   ├── blackjack-game.js   # Blackjack logic
│   ├── slots-game.js       # Slots logic
│   └── plinko-game.js      # Plinko logic
├── games/
│   ├── holdem.js           # Texas Hold'em engine
│   ├── blackjack.js        # Blackjack engine
│   ├── slots.js            # Slots engine
│   └── plinko.js           # Plinko engine
└── README.md
```

## API Endpoints

### HTTP

- `GET /api/user` - Get current user data
- `GET /api/games` - Get active games
- `GET /api/leaderboard` - Get top 50 players
- `GET /health` - Server health check

### WebSocket Messages

**Client → Server:**
- `CREATE_GAME` - Create new game session
- `JOIN_GAME` - Join existing game
- `GAME_ACTION` - Perform game action (fold, bet, etc.)
- `UPDATE_PROFILE` - Update username/avatar
- `GET_STATS` - Request player stats

**Server → Client:**
- `INIT` - Initial connection with user data
- `GAME_CREATED` - Game started
- `PLAYER_JOINED` - Player joined game
- `GAME_ACTION` - Game action broadcast
- `PROFILE_UPDATED` - Profile changes
- `STATS` - Player statistics
- `ERROR` - Error message

## Game Details

### Texas Hold'em
- 1-6 players per table
- Configurable buy-in ($100-$10,000)
- Pre-flop, flop, turn, river betting rounds
- Proper hand evaluation

### Blackjack
- Single player vs dealer
- 6-deck shoe (auto-reshuffle at 70%)
- Blackjack pays 3:2
- Dealer hits on 16, stands on 17+

### Slots
- 5 reels, 3 rows
- 8 different symbols with varying payouts
- 96% RTP (4% house edge)
- Potential jackpot: 1 in 10,000 spins

### Plinko
- 3 difficulty levels (8, 10, 12 rows)
- Ball drops through pegs into bottom buckets
- Multipliers vary by landing position
- 95% RTP

## Security

- IP addresses are hashed (SHA-256) for privacy
- No real money transactions
- All balances server-side stored
- WebSocket over WS (use WSS in production)

## Deployment

### Docker

```dockerfile
FROM node:18
WORKDIR /app
COPY casino/backend ./
RUN npm install
EXPOSE 3000
CMD ["npm", "start"]
```

### Cloud Hosting

- **Heroku**: `Procfile` required
- **Railway**: Direct from GitHub
- **AWS EC2**: Node.js environment
- **DigitalOcean**: App Platform

## Future Enhancements

- [ ] Real multiplayer Hold'em with spectators
- [ ] Tournament mode with brackets
- [ ] Chat system
- [ ] Friends/social features
- [ ] Achievements and badges
- [ ] Themed events and promotions
- [ ] Mobile app version
- [ ] Real gambling API integration (if legal)

## License

MIT

## Author

Mazi - Virtual Casino Dev