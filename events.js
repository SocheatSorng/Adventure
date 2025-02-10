export function handleColumnEvent(playerIndex, col, targetCell, {
    playerStats,
    playerGold,
    playerPositions,
    showEventMessage,
    updatePlayerStats,
    updateGoldDisplay,
    showGoldAnimation,
    rollDice
}) {
    const stats = playerStats[playerIndex];
    let message = '';

    switch(col + 1) {
        case 1: // Gold column
            playerGold[playerIndex] += 50;
            message = 'Found 50 gold!';
            showGoldAnimation(targetCell, 50);
            break;

        case 2: // Secret map
            if (!stats.hasMap) {
                stats.hasMap = true;
                message = 'Found a secret map!';
                const mapAnimation = document.createElement('div');
                mapAnimation.className = 'map-animation';
                mapAnimation.innerHTML = '🗺️';
                targetCell.appendChild(mapAnimation);
                setTimeout(() => mapAnimation.remove(), 1000);
            }
            break;

        case 3: // Bandit attack
            if (stats.strength < 3) {
                playerGold[playerIndex] = Math.max(0, playerGold[playerIndex] - 100);
                message = 'Lost to bandits! -100 gold';
            } else {
                playerGold[playerIndex] += 150;
                message = 'Defeated bandits! +150 gold';
                showGoldAnimation(targetCell, 150);
            }
            break;

        case 4: // Health loss
            if (stats.potions > 0) {
                stats.potions--;
                message = 'Used a health potion to survive!';
            } else if (stats.health > 0) {
                stats.health--;
                message = 'Lost 1 health!';
                if (stats.health === 0) {
                    playerPositions[playerIndex] = 0;
                    message = 'Lost all health! Back to start.';
                }
            } else {
                message = 'Already at 0 health!';
            }
            showEventMessage(message);
            break;

        case 5: // Receive potion
            stats.potions++;
            message = 'Received a health potion!';
            break;

        case 6: // Gambling
            const playerRoll = rollDice();
            const houseRoll = rollDice();
            message = `You rolled ${playerRoll}, house rolled ${houseRoll}. `;
            if (playerRoll > houseRoll) {
                playerGold[playerIndex] += 200;
                message += 'Won 200 gold!';
                showGoldAnimation(targetCell, 200);
            } else {
                playerGold[playerIndex] = Math.max(0, playerGold[playerIndex] - 100);
                message += 'Lost 100 gold!';
            }
            break;

        case 7: // Trap
            playerGold[playerIndex] = Math.max(0, playerGold[playerIndex] - 50);
            message = 'Fell into a trap! Lost 50 gold.';
            break;

        case 8: // Bridge collapse
            playerPositions[playerIndex] = 0;
            message = 'Bridge collapsed! Back to start.';
            break;
    }

    if (message && col + 1 !== 4) {
        showEventMessage(message);
        updatePlayerStats(playerIndex);
        updateGoldDisplay(playerIndex);
    } else {
        updatePlayerStats(playerIndex);
        updateGoldDisplay(playerIndex);
    }
}
