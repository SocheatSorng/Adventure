function handleColumnEvent(playerIndex, position, targetCell, {
    playerStats,
    playerGold,
    playerPositions,
    showEventMessage,
    updatePlayerStats,
    updateGoldDisplay,
    showGoldAnimation,
    rollDice,
    cellOccupancy,
    TOTAL_CELLS,
    movePlayer,  // Add movePlayer to the parameters
    currentPlayer  // Add currentPlayer parameter
}) {
    const stats = playerStats[playerIndex];
    let message = '';
    
    // Calculate grid number directly from position (1-based)
    const gridNumber = position + 1;
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

        case 17: // Lost in dark forest
            if (stats.hasMap) {
                message = 'Your map helped you navigate the dark forest!';
            } else {
                stats.turns = Math.max(0, (stats.turns || 0) - 1);
                message = 'Lost in a dark forest! Skip a turn 🌲';
            }
            break;

        case 18: // Merchant's armor
            if (playerGold[playerIndex] >= 300 && confirm('Buy powerful armor for 300 gold? (+2 Health)')) {
                playerGold[playerIndex] -= 300;
                stats.health += 2;
                message = 'You bought powerful armor! Health +2 🛡️';
            } else {
                message = 'You cannot afford the armor or declined 🛡️';
            }
            break;

        case 19: // Snake encounter
            if (confirm('A huge snake blocks your path! Fight it? (OK to fight, Cancel to flee) 🐍')) {
                if (stats.strength >= 3) {
                    stats.strength++;
                    message = 'You defeated the snake! Strength +1 🐍';
                } else {
                    stats.health = Math.max(0, stats.health - 2);
                    message = 'The snake was too strong! Lost 2 health 🐍';
                    if (stats.health <= 0) {
                        playerPositions[playerIndex] = 0;
                        message = 'The snake defeated you! Back to start 🐍';
                    }
                }
            } else {
                stats.health = Math.max(0, stats.health - 1);
                message = 'You fled but got bit! Lost 1 health 🐍';
                if (stats.health <= 0) {
                    playerPositions[playerIndex] = 0;
                    message = 'The snake\'s bite was fatal! Back to start 🐍';
                }
            }
            break;

        case 20: // Ancient treasure
            const treasureType = Math.floor(Math.random() * 4);
            switch(treasureType) {
                case 0:
                    playerGold[playerIndex] += 400;
                    message = 'Found ancient gold! +400 gold 🏆';
                    showGoldAnimation(targetCell, 400);
                    break;
                case 1:
                    stats.potions += 3;
                    message = 'Found ancient potions! +3 potions 🏆';
                    break;
                case 2:
                    stats.magic += 2;
                    message = 'Found ancient scrolls! Magic +2 🏆';
                    break;
                case 3:
                    stats.strength += 2;
                    message = 'Found ancient weapons! Strength +2 🏆';
                    break;
            }
            break;

        case 21: // Pit trap
            if (stats.hasMap) {
                message = 'Your map warned you about the pit trap! 🕳️';
            } else {
                stats.turns = Math.max(0, (stats.turns || 0) - 1);
                stats.health = Math.max(0, stats.health - 1);
                message = 'Fell into a pit trap! Lose 1 turn and 1 health 🕳️';
            }
            break;

        case 22: // Sorcerer's deal
            if (playerGold[playerIndex] >= 200 && confirm('The sorcerer offers: Pay 200 gold for +2 Magic. Accept? ⚡')) {
                playerGold[playerIndex] -= 200;
                stats.magic += 2;
                message = 'The sorcerer granted you power! Magic +2 ⚡';
            } else {
                message = 'You declined the sorcerer\'s offer ⚡';
            }
            break;

        case 23: // Village help
            stats.hasAlly = true;
            stats.strength += 2;
            playerGold[playerIndex] += 100;
            message = 'You saved the village! Gained an ally, Strength +2, Gold +100 🏡';
            showGoldAnimation(targetCell, 100);
            break;

        case 24: // Magic ring
            const wishes = ['health', 'strength', 'magic', 'gold'];
            const wishChoice = prompt('The ring grants one wish! Choose:\n1) Health +3\n2) Strength +3\n3) Magic +3\n4) Gold +300\nEnter 1-4:');
            
            switch(wishChoice) {
                case '1':
                    stats.health += 3;
                    message = 'Your wish for health was granted! Health +3 💍';
                    break;
                case '2':
                    stats.strength += 3;
                    message = 'Your wish for strength was granted! Strength +3 💍';
                    break;
                case '3':
                    stats.magic += 3;
                    message = 'Your wish for magic was granted! Magic +3 💍';
                    break;
                case '4':
                    playerGold[playerIndex] += 300;
                    message = 'Your wish for gold was granted! +300 gold 💍';
                    showGoldAnimation(targetCell, 300);
                    break;
                default:
                    stats.magic += 1;
                    message = 'You failed to make a wish! Got Magic +1 instead 💍';
            }
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
