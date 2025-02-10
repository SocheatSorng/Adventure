function handleColumnEvent(playerIndex, col, targetCell, {
    playerStats,
    playerGold,
    playerPositions,
    showEventMessage,
    updatePlayerStats,
    updateGoldDisplay,
    showGoldAnimation,
    rollDice,
    cellOccupancy,  // Add this parameter
    TOTAL_CELLS     // Add this parameter
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

        case 5: // Health gain and potion
            stats.health++;
            stats.potions++;
            message = 'Gained 1 health and received a potion!';
            break;

        case 6: // Gambling with two dice
            // Player's turn
            const playerRoll = rollDice();
            message = `You rolled ${playerRoll}... `;
            
            // Short pause before computer roll
            setTimeout(() => {
                const houseRoll = rollDice();
                if (playerRoll > houseRoll) {
                    playerGold[playerIndex] += 200;
                    message += `Computer rolled ${houseRoll}. You won 200 gold!`;
                    showGoldAnimation(targetCell, 200);
                } else {
                    playerGold[playerIndex] = Math.max(0, playerGold[playerIndex] - 100);
                    message += `Computer rolled ${houseRoll}. You lost 100 gold!`;
                }
                showEventMessage(message);
                updatePlayerStats(playerIndex);
                updateGoldDisplay(playerIndex);
            }, 1000);
            return; // Exit early due to async nature

        case 7: // Trap
            playerGold[playerIndex] = Math.max(0, playerGold[playerIndex] - 50);
            message = 'Fell into a trap! Lost 50 gold.';
            break;

        case 8: // Bridge collapse - back to start
            message = 'Bridge collapsed! Back to start.';
            
            // Move token back to start
            const token = targetCell.querySelector(`.player${playerIndex + 1}`);
            if (token) {
                const startCell = document.querySelector('#gameTable tr:first-child td:first-child');
                startCell.appendChild(token);
                token.style.top = '50%';
                token.style.left = '50%';
                
                // Reset player position to start (0)
                playerPositions[playerIndex] = 0;
                cellOccupancy[TOTAL_CELLS - 1] = Math.max(0, cellOccupancy[TOTAL_CELLS - 1] - 1);
                cellOccupancy[0]++;
            }
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
