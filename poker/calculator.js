class PokerCalculator {
    constructor() {
        this.cache = {};
    }
    /**
     * Calculate win probability against random opponents
     */
    calculateWinProbability(playerCards, communityCards, numOpponents = 1) {
        if (playerCards.length !== 2) return null;
        if (communityCards.length === 0 || communityCards.length > 5) return null;
        const cardsUsed = new Set();
        [...playerCards, ...communityCards].forEach(c => {
            cardsUsed.add(c.toString());
        });
        const allCards = generateAllCards();
        const remaining = allCards.filter(c => !cardsUsed.has(c.toString()));
        let simulations = 10000;
        if (communityCards.length === 0) simulations = 5000;
        else if (communityCards.length === 3) simulations = 8000;
        else if (communityCards.length >= 4) simulations = 15000;
        let playerWins = 0;
        let ties = 0;
        for (let i = 0; i < simulations; i++) {
            const completedBoard = this.completeBoard(communityCards, remaining, cardsUsed);
            const playerBest = bestHand([...playerCards, ...completedBoard]);
            let opponentBetter = false;
            for (let opp = 0; opp < numOpponents; opp++) {
                const oppCards = this.drawRandomCards(2, remaining, cardsUsed, [
                    ...playerCards,
                    ...completedBoard
                ]);
                const oppBest = bestHand([...oppCards, ...completedBoard]);
                if (compareHands(oppBest, playerBest) > 0) {
                    opponentBetter = true;
                    break;
                }
                if (compareHands(oppBest, playerBest) === 0) {
                    ties++;
                }
            }
            if (!opponentBetter) {
                playerWins++;
            }
        }
        const winProb = playerWins / simulations;
        return winProb;
    }
    /**
     * Calculate equity against opponents
     */
    calculateEquity(playerCards, communityCards, numOpponents = 1) {
        if (playerCards.length !== 2) return null;
        const cardsUsed = new Set();
        [...playerCards, ...communityCards].forEach(c => {
            cardsUsed.add(c.toString());
        });
        const allCards = generateAllCards();
        const remaining = allCards.filter(c => !cardsUsed.has(c.toString()));
        let playerEquity = 0;
        const simulations = 5000;
        for (let i = 0; i < simulations; i++) {
            const completedBoard = this.completeBoard(communityCards, remaining, cardsUsed);
            const playerBest = bestHand([...playerCards, ...completedBoard]);
            let ties = 0;
            let playerWins = 0;
            for (let opp = 0; opp < numOpponents; opp++) {
                const oppCards = this.drawRandomCards(2, remaining, cardsUsed, [
                    ...playerCards,
                    ...completedBoard
                ]);
                const oppBest = bestHand([...oppCards, ...completedBoard]);
                const comparison = compareHands(oppBest, playerBest);
                if (comparison < 0) {
                    playerWins++;
                } else if (comparison === 0) {
                    ties++;
                }
            }
            playerEquity += (playerWins + ties * 0.5) / numOpponents;
        }
        return (playerEquity / simulations) * 100;
    }
    /**
     * Calculate probability of improving to specific hands
     */
    calculateImprovementOdds(playerCards, communityCards) {
        const cardsUsed = new Set();
        [...playerCards, ...communityCards].forEach(c => {
            cardsUsed.add(c.toString());
        });
        const allCards = generateAllCards();
        const remaining = allCards.filter(c => !cardsUsed.has(c.toString()));
        const currentHand = bestHand([...playerCards, ...communityCards]);
        if (!currentHand) return null;
        let improvements = {};
        for (let i = 0; i < HAND_NAMES.length; i++) {
            improvements[HAND_NAMES[i]] = 0;
        }
        remaining.forEach(card => {
            const testCards = [...playerCards, ...communityCards, card];
            const testHand = bestHand(testCards);
            if (testHand && testHand.rank >= currentHand.rank) {
                improvements[testHand.name]++;
            }
        });
        Object.keys(improvements).forEach(key => {
            improvements[key] = (improvements[key] / remaining.length * 100).toFixed(2);
        });
        return improvements;
    }
    /**
     * Calculate odds to hit specific outs
     */
    calculateOdds(playerCards, communityCards) {
        const cardsUsed = new Set();
        [...playerCards, ...communityCards].forEach(c => {
            cardsUsed.add(c.toString());
        });
        const allCards = generateAllCards();
        const remaining = allCards.filter(c => !cardsUsed.has(c.toString()));
        const cardsNeeded = 5 - communityCards.length;
        const outs = {
            pair: this.countOuts(playerCards, communityCards, 'pair'),
            twoPair: this.countOuts(playerCards, communityCards, 'twopair'),
            trips: this.countOuts(playerCards, communityCards, 'trips'),
            straight: this.countOuts(playerCards, communityCards, 'straight'),
            flush: this.countOuts(playerCards, communityCards, 'flush'),
            fullHouse: this.countOuts(playerCards, communityCards, 'fullhouse'),
        };
        const remainingCards = remaining.length;
        const oddsPercentage = {};
        Object.keys(outs).forEach(key => {
            const outCount = outs[key];
            if (outCount > 0) {
                if (cardsNeeded === 1) {
                    oddsPercentage[key] = (outCount / remainingCards * 100).toFixed(1);
                } else {
                    const prob = 1 - ((remainingCards - outCount) / remainingCards) * 
                                     ((remainingCards - outCount - 1) / (remainingCards - 1));
                    oddsPercentage[key] = (prob * 100).toFixed(1);
                }
            } else {
                oddsPercentage[key] = '0.0';
            }
        });
        return { outs, oddsPercentage };
    }
    countOuts(playerCards, communityCards, outType) {
        const cardsUsed = new Set();
        [...playerCards, ...communityCards].forEach(c => {
            cardsUsed.add(c.toString());
        });
        const allCards = generateAllCards();
        const remaining = allCards.filter(c => !cardsUsed.has(c.toString()));
        let count = 0;
        remaining.forEach(card => {
            const testCards = [...playerCards, ...communityCards, card];
            const hand = bestHand(testCards);
            if (!hand) return;
            switch (outType) {
                case 'pair':
                    if (hand.rank >= 1) count++;
                    break;
                case 'twopair':
                    if (hand.rank >= 2) count++;
                    break;
                case 'trips':
                    if (hand.rank >= 3) count++;
                    break;
                case 'straight':
                    if (hand.rank === 4 || hand.rank === 8) count++;
                    break;
                case 'flush':
                    if (hand.rank === 5 || hand.rank === 8 || hand.rank === 9) count++;
                    break;
                case 'fullhouse':
                    if (hand.rank >= 6) count++;
                    break;
            }
        });
        return count;
    }
    /**
     * Complete the board by drawing random cards
     */
    completeBoard(communityCards, remaining, used) {
        const needed = 5 - communityCards.length;
        const completed = [...communityCards];
        const tempUsed = new Set([...used]);
        for (let i = 0; i < needed; i++) {
            const available = remaining.filter(c => !tempUsed.has(c.toString()));
            if (available.length === 0) break;
            const randomCard = available[Math.floor(Math.random() * available.length)];
            completed.push(randomCard);
            tempUsed.add(randomCard.toString());
        }
        return completed;
    }
    /**
     * Draw random cards for opponent
     */
    drawRandomCards(count, remaining, used, excludeCards) {
        const cards = [];
        const tempUsed = new Set([...used]);
        excludeCards.forEach(c => tempUsed.add(c.toString()));
        for (let i = 0; i < count; i++) {
            const available = remaining.filter(c => !tempUsed.has(c.toString()));
            if (available.length === 0) break;
            const randomCard = available[Math.floor(Math.random() * available.length)];
            cards.push(randomCard);
            tempUsed.add(randomCard.toString());
        }
        return cards;
    }
}
const calculator = new PokerCalculator();