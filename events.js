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
    
    // Fix grid number calculation - use position directly since it's already 0-based
    const gridNumber = playerPositions[playerIndex] + 1;  // Convert to 1-based grid numbers
    console.log('Current grid:', gridNumber); // Debug log

    switch(gridNumber) {
        case 1: // Gold column (first grid)
            playerGold[playerIndex] += 50;
            message = 'Found 50 gold!';
            showGoldAnimation(targetCell, 50);
            break;

        case 2: // Secret map (second grid)
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
            
        case 9: // Secret spell (ninth grid)
            stats.magic++;
            message = 'You learned a secret spell! Magic +1';
            break;

        case 10: // Lose turn
            stats.turns -= 1;
            message = 'A storm approaches! You lose 1 turn';
            break;

        case 11: // Good karma
            stats.status = 'good karma';
            message = 'You helped a lost child! You gain good karma';
            break;

        case 12: // Mystic sword
            stats.strength += 2;
            message = 'You found a mystic sword! Strength +2';
            break;

        case 13: // Thieves
            playerGold[playerIndex] = Math.max(0, playerGold[playerIndex] - 100);
            message = 'Thieves stole your gold! Lost 100 gold';
            break;

        case 14: // Horse
            // Move 2 extra steps
            setTimeout(() => {
                movePlayer(playerIndex, 2);
                showEventMessage('Your horse carries you 2 steps further!');
            }, 1000);
            message = 'You tamed a horse!';
            break;

        case 15: // Riddle
            const answers = ['A', 'B', 'C'];
            const correctAnswer = Math.floor(Math.random() * answers.length);
            const playerAnswer = prompt(`Solve the riddle!\nWhat goes up but never comes down?\nA) Age\nB) Growth\nC) Time\nEnter A, B, or C:`);
            
            if (playerAnswer && playerAnswer.toUpperCase() === answers[correctAnswer]) {
                playerGold[playerIndex] += 200;
                message = 'Correct answer! Won 200 gold!';
                showGoldAnimation(targetCell, 200);
            } else {
                message = 'Wrong answer! Better luck next time!';
            }
            break;

        case 16: // Rare gem
            playerGold[playerIndex] += 500;
            message = 'Found a rare gem! Gained 500 gold!';
            showGoldAnimation(targetCell, 500);
            break;
    }

    if (message && gridNumber !== 4) {
        showEventMessage(message);
        updatePlayerStats(playerIndex);
        updateGoldDisplay(playerIndex);
    } else {
        updatePlayerStats(playerIndex);
        updateGoldDisplay(playerIndex);
    }
}
