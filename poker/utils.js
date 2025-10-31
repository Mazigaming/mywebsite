const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
const SUITS = ['♠', '♥', '♦', '♣'];
const HAND_NAMES = [
    'High Card',
    'One Pair',
    'Two Pair',
    'Three of a Kind',
    'Straight',
    'Flush',
    'Full House',
    'Four of a Kind',
    'Straight Flush',
    'Royal Flush'
];
class Card {
    constructor(rank, suit) {
        this.rank = rank;
        this.suit = suit;
    }
    toString() {
        return `${this.rank}${this.suit}`;
    }
    static fromString(str) {
        if (!str || str.length < 2) return null;
        return new Card(str[0], str[1]);
    }
    getRankValue() {
        return RANKS.indexOf(this.rank);
    }
}
function generateAllCards() {
    const cards = [];
    for (let rank of RANKS) {
        for (let suit of SUITS) {
            cards.push(new Card(rank, suit));
        }
    }
    return cards;
}
function parseCards(cardStrings) {
    return cardStrings
        .filter(c => c)
        .map(c => Card.fromString(c))
        .filter(c => c !== null);
}
function cardsToString(cards) {
    return cards.map(c => c.toString()).join(' ');
}
function isValidHand(cards) {
    const unique = new Set(cards.map(c => c.toString()));
    return unique.size === cards.length;
}
function evaluateHand(cards) {
    if (cards.length !== 5) return null;
    const sorted = [...cards].sort((a, b) => b.getRankValue() - a.getRankValue());
    const ranks = sorted.map(c => c.getRankValue());
    const suits = sorted.map(c => c.suit);
    const isFlush = suits.every(s => s === suits[0]);
    let isStraight = false;
    let straightHigh = 0;
    if (ranks[0] - ranks[4] === 4 && new Set(ranks).size === 5) {
        isStraight = true;
        straightHigh = ranks[0];
    }
    else if (ranks[0] === 12 && ranks[1] === 3 && ranks[2] === 2 && ranks[3] === 1 && ranks[4] === 0) {
        isStraight = true;
        straightHigh = 3; 
    }
    const rankCounts = {};
    ranks.forEach(r => {
        rankCounts[r] = (rankCounts[r] || 0) + 1;
    });
    const counts = Object.values(rankCounts).sort((a, b) => b - a);
    let handRank = 0;
    if (isStraight && isFlush) {
        handRank = straightHigh === 12 ? 9 : 8; 
    } else if (counts[0] === 4) {
        handRank = 7; 
    } else if (counts[0] === 3 && counts[1] === 2) {
        handRank = 6; 
    } else if (isFlush) {
        handRank = 5; 
    } else if (isStraight) {
        handRank = 4; 
    } else if (counts[0] === 3) {
        handRank = 3; 
    } else if (counts[0] === 2 && counts[1] === 2) {
        handRank = 2; 
    } else if (counts[0] === 2) {
        handRank = 1; 
    }
    return {
        rank: handRank,
        name: HAND_NAMES[handRank],
        cards: sorted
    };
}
function bestHand(cards) {
    if (cards.length < 5) return null;
    const combinations = [];
    const indices = [];
    function generate(start, combo) {
        if (combo.length === 5) {
            combinations.push([...combo]);
            return;
        }
        for (let i = start; i < cards.length; i++) {
            combo.push(cards[i]);
            generate(i + 1, combo);
            combo.pop();
        }
    }
    generate(0, []);
    let best = null;
    combinations.forEach(combo => {
        const evaluated = evaluateHand(combo);
        if (!best || evaluated.rank > best.rank) {
            best = evaluated;
        }
    });
    return best;
}
function compareHands(hand1, hand2) {
    if (hand1.rank !== hand2.rank) {
        return hand1.rank > hand2.rank ? 1 : -1;
    }
    for (let i = 0; i < 5; i++) {
        const r1 = hand1.cards[i].getRankValue();
        const r2 = hand2.cards[i].getRankValue();
        if (r1 !== r2) {
            return r1 > r2 ? 1 : -1;
        }
    }
    return 0;
}
function getOuts(playerCards, communityCards) {
    const usedCards = new Set();
    [...playerCards, ...communityCards].forEach(c => {
        usedCards.add(c.toString());
    });
    const allCards = generateAllCards();
    const remainingCards = allCards.filter(c => !usedCards.has(c.toString()));
    const currentBest = bestHand([...playerCards, ...communityCards]);
    let improvingOuts = 0;
    remainingCards.forEach(card => {
        const testCards = [...playerCards, ...communityCards, card];
        const testBest = bestHand(testCards);
        if (testBest && currentBest && testBest.rank > currentBest.rank) {
            improvingOuts++;
        }
    });
    return improvingOuts;
}