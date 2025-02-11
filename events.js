function handleColumnEvent(playerIndex, position, targetCell, {
    inventory,
    playerPositions,
    showEventMessage,
    updatePlayerStats,
    updateGoldDisplay,
    showGoldAnimation,
    rollDice,
    cellOccupancy,
    TOTAL_CELLS,
    movePlayer,
    currentPlayer
}) {
    const stats = inventory.getStats(playerIndex);
    let message = '';
    const GF = window.GameFunctions;
    
    // Helper function that uses the global function but with our parameters
    function localCheckHealth() {
        return GF.checkHealth(stats, playerPositions, playerIndex, targetCell, cellOccupancy, TOTAL_CELLS);
    }

    // Calculate grid number directly from position (1-based)
    const gridNumber = position + 1;
    console.log('Current grid:', gridNumber);

    // Initialize health if undefined before any event
    if (typeof stats.health === 'undefined') {
        stats.health = 0;
    }

    // Handle late events
    if (gridNumber >= 33 && gridNumber <= 64) {
        message = window.handleLateEvents(playerIndex, position, targetCell, {
            inventory,
            playerPositions,
            showEventMessage,
            updatePlayerStats,
            updateGoldDisplay,
            showGoldAnimation,
            rollDice,
            cellOccupancy,
            TOTAL_CELLS,
            movePlayer,
            currentPlayer
        });
    } else {
        switch(gridNumber) {
            case 1: // Gold column (first grid)
                inventory.modifyGold(playerIndex, 50);
                message = 'Found 50 💰!';
                showGoldAnimation(targetCell, 50);
                break;

            case 2: // Secret map
                if (!stats.hasMap) {
                    stats.hasMap = true;
                    message = 'Found a secret map! 🗺️';
                    const mapAnimation = document.createElement('div');
                    mapAnimation.className = 'map-animation';
                    mapAnimation.innerHTML = '🗺️';
                    targetCell.appendChild(mapAnimation);
                    setTimeout(() => mapAnimation.remove(), 3000);
                }
                break;

            case 3: // Bandit attack
                if (stats.strength < 3) {
                    inventory.modifyGold(playerIndex, -100);
                    message = 'Lost to bandits! -100 💰';
                } else {
                    inventory.modifyGold(playerIndex, 150);
                    message = 'Defeated bandits! +150 💰';
                    showGoldAnimation(targetCell, 150);
                }
                break;

            case 4: // Health loss 
                if (stats.potions > 0) {
                    // First show choice before any health changes
                    GF.createChoiceUI(
                        `You stepped on a poisonous plant! 🌿\nYou have ${stats.potions} potion(s).\nCurrent Health: ${stats.health}\n\nUse a potion to survive?`,
                        [
                            'Use potion',
                            'Save potion'
                        ],
                        (choice) => {
                            if (choice === '1') {
                                stats.potions--;
                                message = 'Used a health potion to survive! 🧪';
                            } else {
                                stats.health = Math.max(0, stats.health - 1);
                                message = stats.health <= 0 ? 
                                    'Stepped on a poisonous plant! Back to start 🌿' : 
                                    'Lost 1 health! 💔';
                                if (stats.health <= 0) {
                                    GF.sendPlayerToStart(playerIndex, playerPositions, targetCell, cellOccupancy, TOTAL_CELLS);
                                }
                            }
                            showEventMessage(message);
                            updatePlayerStats(playerIndex);
                        }
                    );
                    return; // Exit early to prevent additional message updates
                } else {
                    stats.health = Math.max(0, stats.health - 1);
                    message = stats.health <= 0 ? 
                        'Stepped on a poisonous plant! Back to start 🌿' : 
                        'Lost 1 health! 💔';
                    if (stats.health <= 0) {
                        GF.sendPlayerToStart(playerIndex, playerPositions, targetCell, cellOccupancy, TOTAL_CELLS);
                    }
                }
                break;

            case 5: // Health gain and potion
                stats.potions++;
                message = 'Gained a potion!';
                break;

            case 6: // Gambling with two dice
                // Player's turn
                const playerRoll = rollDice();
                message = `You rolled ${playerRoll}... `;
                
                // Short pause before computer roll
                setTimeout(() => {
                    const houseRoll = rollDice();
                    if (playerRoll > houseRoll) {
                        inventory.modifyGold(playerIndex, 200);
                        message += `Computer rolled ${houseRoll}. You won 200 💰!`;
                        showGoldAnimation(targetCell, 200);
                    } else {
                        inventory.modifyGold(playerIndex, -100);
                        message += `Computer rolled ${houseRoll}. You lost 100 💰!`;
                    }
                    showEventMessage(message);
                    updatePlayerStats(playerIndex);
                    updateGoldDisplay(playerIndex);
                }, 1000);
                return; // Exit early due to async nature

            case 7: // Trap
                inventory.modifyGold(playerIndex, -50);
                message = 'Fell into a trap! Lost 50 💰.';
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
                message = 'You learned a secret spell! +1🔮';
                break;

            case 10: // Lose turn
                stats.turns -= 1;
                message = 'A storm approaches! You lose 1 turn';
                break;

            case 11: // Good karma
                stats.status = 'good karma';
                message = 'You helped a lost child! You gain good karma 😇';
                
                // Create floating animation for karma icon
                const karmaAnimation = document.createElement('div');
                karmaAnimation.className = 'map-animation';
                karmaAnimation.innerHTML = '😇';
                karmaAnimation.style.fontSize = '24px';  // Make emoji bigger
                targetCell.appendChild(karmaAnimation);
                setTimeout(() => karmaAnimation.remove(), 1000);
                break;

            case 12: // Mystic sword
                stats.strength += 2;
                message = 'You found a mystic sword! +2💪';
                break;

            case 13: // Thieves
                inventory.modifyGold(playerIndex, -100);
                message = 'Thieves stole your 💰! Lost 100 💰';
                break;

            case 14: // Horse
                // Move 2 extra steps
                setTimeout(() => {
                    movePlayer(playerIndex, 2);
                    showEventMessage('Your horse carries you 2 steps further!');
                }, 1000);
                message = 'You tamed a horse! 🐎';
                break;

            case 15: // Math Problem
                const num1 = Math.floor(Math.random() * 10) + 1;
                const num2 = Math.floor(Math.random() * 10) + 1;
                const operator = ['+', '-', '*'][Math.floor(Math.random() * 3)];
                const correctAnswer = operator === '+' ? num1 + num2 : 
                                    operator === '-' ? num1 - num2 : 
                                    num1 * num2;

                GF.createChoiceUI(
                    `Solve: ${num1} ${operator} ${num2} = ?`,
                    [
                        `${correctAnswer - 1}`,
                        `${correctAnswer}`,
                        `${correctAnswer + 1}`,
                        `${correctAnswer + 2}`
                    ],
                    (choice) => {
                        if (choice === '2') {  // Second option is always correct
                            inventory.modifyGold(playerIndex, 200);
                            message = 'Correct! You won 200 💰!';
                            showGoldAnimation(targetCell, 200);
                        } else {
                            message = 'Wrong answer! Better luck next time!';
                        }
                        showEventMessage(message);
                        updatePlayerStats(playerIndex);
                        updateGoldDisplay(playerIndex);
                    }
                );
                return; // Exit early due to async nature

            case 16: // Rare gem
                inventory.modifyGold(playerIndex, 500);
                message = 'Found a rare gem! Gained 500 💰!';
                showGoldAnimation(targetCell, 500);
                break;

            case 17: // Lost in dark forest
                if (stats.hasMap && !inventory.hasUsedItem(playerIndex, 'map') && confirm('Use your map to navigate safely through the forest?')) {
                    message = 'Your map helped you navigate the dark forest!';
                    inventory.markItemAsUsed(playerIndex, 'map');
                    stats.hasMap = false;  // Remove map after use
                } else {
                    stats.turns = Math.max(0, (stats.turns || 0) - 1);
                    message = 'Lost in a dark forest! Skip a turn 🌲';
                }
                break;

            case 18: // Merchant's armor
                GF.createChoiceUI(
                    `A merchant offers powerful armor!\nCost: 300 💰\nYour Gold: ${inventory.getGold(playerIndex)}\nEffect: +2 Health\n\nWhat would you like to do?`,
                    [
                        'Buy Armor (300 💰)',
                        'Decline Offer'
                    ],
                    (choice) => {
                        if (choice === '1' && inventory.getGold(playerIndex) >= 300) {
                            inventory.modifyGold(playerIndex, -300);
                            stats.health += 2;
                            message = 'You bought powerful armor! +2 💪';
                        } else if (choice === '1') {
                            message = 'Not enough gold to buy the armor! 💰❌';
                        } else {
                            message = 'You declined the merchant\'s offer 🛡️';
                        }
                        showEventMessage(message);
                        updatePlayerStats(playerIndex);
                        updateGoldDisplay(playerIndex);
                    }
                );
                return; // Exit early due to async nature

            case 19: // Snake encounter
                const requiredStrength = 3;
                let canFight = stats.strength >= requiredStrength;
                let hasPotion = stats.potions > 0;
                let choices = [];
                
                if (canFight) choices.push('Fight the snake');
                if (hasPotion) choices.push('Use potion to survive');

                if (choices.length === 0) {
                    // No options available - instant defeat
                    GF.sendPlayerToStart(playerIndex, playerPositions, targetCell, cellOccupancy, TOTAL_CELLS);
                    message = 'The snake was too powerful! Back to start 🐍';
                    showEventMessage(message);
                    updatePlayerStats(playerIndex);
                    return;
                }

                GF.createChoiceUI(
                    `A huge 🐍 blocks your path! \n` +
                    `Required: ${requiredStrength} 💪\n` +
                    `Potions: ${stats.potions} 🧪\n\n` +
                    `What will you do?`,
                    choices,
                    (choice) => {
                        if (choice === '1' && canFight) {
                            stats.strength = Math.max(0, stats.strength - 3);
                            message = 'You defeated the snake but lost 3 💪 due to exhaustion!';
                        } else if ((choice === '2' && hasPotion) || (choice === '1' && hasPotion)) {
                            stats.potions--;
                            message = 'Used a potion to escape the snake! 🧪';

                            setTimeout(() => {
                                movePlayer(playerIndex, 1);
                            }, 1000);
                        }
                        showEventMessage(message);
                        updatePlayerStats(playerIndex);
                    }
                );
                return; // Exit early due to async nature

            case 20: // Ancient treasure
                const treasureType = Math.floor(Math.random() * 4);
                switch(treasureType) {
                    case 0:
                        inventory.modifyGold(playerIndex, 400);
                        message = 'Found ancient golds! +400 💰';
                        showGoldAnimation(targetCell, 400);
                        break;
                    case 1:
                        stats.potions += 3;
                        message = 'Found ancient potions! +3 🧪';
                        break;
                    case 2:
                        stats.magic += 2;
                        message = 'Found ancient scrolls! +2 🔮';
                        break;
                    case 3:
                        stats.strength += 2;
                        message = 'Found ancient weapons! +2 💪';
                        break;
                }
                break;

            case 21: // Pit trap
                if (stats.hasMap) {
                    message = 'Your map warned you about the pit trap! You avoided it! -1 🗺️';
                    stats.hasMap = false;
                } else {
                    stats.turns = Math.max(0, (stats.turns || 0) - 1);
                    message = 'Fell into a pit trap! Lost 1 turn 🕳️';
                }
                break;

            case 22: // Sorcerer's deal
                GF.createChoiceUI(
                    `A mysterious sorcerer appears!\n Trade 200 💰 For 2 🔮 or Decline the offer?`,
                    [
                        'Accept offer (200 💰)',
                        'Decline offer'
                    ],
                    (choice) => {
                        if (choice === '1' && inventory.getGold(playerIndex) >= 200) {
                            inventory.modifyGold(playerIndex, -200);
                            stats.magic += 2;
                            message = 'The sorcerer granted you power! +2 🔮';
                        } else if (choice === '1') {
                            message = 'Not enough gold for the sorcerer\'s offer! 💰❌';
                        } else {
                            message = 'You declined the sorcerer\'s offer';
                        }
                        showEventMessage(message);
                        updatePlayerStats(playerIndex);
                        updateGoldDisplay(playerIndex);
                    }
                );
                return; // Exit early due to async nature

            case 23: // Village help
                stats.hasAlly = true;
                stats.strength += 2;
                inventory.modifyGold(playerIndex, 100);
                message = 'You saved the village! + ally (🤝), +2 💪, +100 💰';
                
                // Add ally gained animation
                const allyAnimation = document.createElement('div');
                allyAnimation.className = 'map-animation';
                allyAnimation.innerHTML = '🤝';
                allyAnimation.style.fontSize = '24px';
                targetCell.appendChild(allyAnimation);
                setTimeout(() => allyAnimation.remove(), 3000);
                
                showGoldAnimation(targetCell, 100);
                break;

            case 24: // Magic ring
                GF.createChoiceUI(
                    'The 💍 grants one wish!\n',
                    [
                        '+3 ❤️',
                        '+3 💪',
                        '+3 🔮',
                        '+300 💰'
                    ],
                    (choice) => {
                        switch(choice) {
                            case '1':
                                stats.health += 3;
                                message = 'Your wish for health was granted! +3 ❤️';
                                break;
                            case '2':
                                stats.strength += 3;
                                message = 'Your wish for strength was granted! +3 💪';
                                break;
                            case '3':
                                stats.magic += 3;
                                message = 'Your wish for magic was granted! +3 🔮';
                                break;
                            case '4':
                                inventory.modifyGold(playerIndex, 300);
                                message = 'Your wish for gold was granted! +300 💰';
                                showGoldAnimation(targetCell, 300);
                                break;
                        }
                        showEventMessage(message);
                        updatePlayerStats(playerIndex);
                    }
                );
                break;

            case 25: // Cross the river
                if (stats.strength >= 5) {
                    stats.strength++;
                    message = 'You crossed the river safely! Strength +1';
                } else {
                    stats.health = Math.max(0, stats.health - 1);
                    message = localCheckHealth() || 'Too weak to cross! Lost 1 health';
                }
                break;

            case 26: // Rescue traveler
                if (stats.strength >= 2) {
                    inventory.modifyGold(playerIndex, 400);
                    message = 'Rescued a trapped traveler! Gained 400 💰 🦸';
                    showGoldAnimation(targetCell, 400);
                } else {
                    message = 'Not strong enough to help the traveler 😢';
                }
                break;

            case 27: // Mysterious Fog
                if (!stats.hasMap) {
                    stats.turns = Math.max(0, (stats.turns || 0) - 1);
                    message = 'Lost in mysterious fog! Skip 1 turn 🌫️';
                } else {
                    message = 'Your map helped you navigate through the fog! 🗺️';
                }
                break;

            case 28: // Abandoned ship
                if (stats.hasMap) {
                    const shipLoot = Math.floor(Math.random() * 300) + 200; // 200-500 gold
                    inventory.modifyGold(playerIndex, shipLoot);
                    message = `Found ${shipLoot} Gold on the abandoned ship! 🚢`;
                    showGoldAnimation(targetCell, shipLoot);
                } else {
                    const smallLoot = Math.floor(Math.random() * 100) + 50; // 50-150 gold
                    inventory.modifyGold(playerIndex, smallLoot);
                    message = `Found ${smallLoot} Gold on the ship. Map would help find more! ⛵`;
                    showGoldAnimation(targetCell, smallLoot);
                }
                break;

            case 29: // Dragon encounter
                const dragonChoice = confirm(
                    `A fierce dragon blocks your path! 🐲\n` +
                    `Your Strength: ${stats.strength}\n` +
                    `Required Strength: 6\n` +
                    `Current Gold: ${inventory.getGold(playerIndex)}\n` +
                    `Bribe Cost: 500\n\n` +
                    `Fight the dragon? (OK to fight, Cancel to bribe)`
                );
                
                if (dragonChoice) {
                    if (stats.strength >= 6 || stats.hasAlly) {
                        message = stats.hasAlly ? 
                            'You and your ally defeated the dragon! 🐲⚔️' :
                            'You defeated the dragon with your strength! 🐲⚔️';
                        stats.strength += 2;
                    } else {
                        playerPositions[playerIndex] = 0;
                        message = 'The dragon was too powerful! Back to start 🐲';
                    }
                } else {
                    if (inventory.getGold(playerIndex) >= 500) {
                        inventory.modifyGold(playerIndex, -500);
                        message = 'Paid 500 💰 to appease the dragon 🐲💰';
                    } else {
                        playerPositions[playerIndex] = 0;
                        message = 'Not enough 💰 to bribe! Back to start 🐲';
                    }
                }
                break;

            case 30: // Cursed Temple
                if (stats.magic >= 2) {
                    inventory.modifyGold(playerIndex, 1000);
                    message = 'Your magic protected you! Found 1,000 💰! 🏛️✨';
                    showGoldAnimation(targetCell, 1000);
                } else if (confirm('Risk losing 1 Health for 1,000 💰? 🏛️')) {
                    inventory.modifyGold(playerIndex, 1000);
                    stats.health--;
                    message = 'Gained 1,000 💰 but lost 1 Health! 🏛️';
                    showGoldAnimation(targetCell, 1000);
                    const healthCheck = localCheckHealth();
                    if (healthCheck) message = healthCheck;
                } else {
                    message = 'Wisely avoided the cursed temple 🏛️';
                }
                break;

            case 31: // Fairy Blessing
                const blessing = Math.floor(Math.random() * 3);
                switch(blessing) {
                    case 0:
                        stats.health++;
                        message = 'A fairy blessed you with health! +1 HP 🧚‍♀️❤️';
                        break;
                    case 1:
                        stats.magic++;
                        message = 'A fairy blessed you with magic! Magic +1 🧚‍♀️✨';
                        break;
                    case 2:
                        stats.potions++;
                        message = 'A fairy gave you a potion! +1 Potion 🧚‍♀️🧪';
                        break;
                }
                break;

            case 32: // Strange noises
                if (stats.magic > 0) {
                    message = 'Your magic warded off the danger! 🌟';
                } else {
                    const danger = Math.random() < 0.5;
                    if (danger) {
                        stats.health--;
                        message = localCheckHealth() || 'Surprise attack in the night! Lost 1 health 🌙';
                    } else {
                        message = 'Strange noises in the night... but nothing happened 🌙';
                    }
                }
                break;
        }
    }

    // Change the healthModifyingGrids array to remove grid 21 since it no longer affects health
    const healthModifyingGrids = [4, 19];  // Removed 21 from the array
    if (healthModifyingGrids.includes(gridNumber)) {
        const healthCheck = localCheckHealth();
        if (healthCheck) {
            message = healthCheck;
        }
    }

    if (message && gridNumber !== 4) {
        GF.showEventMessage(message);
        updatePlayerStats(playerIndex);
        updateGoldDisplay(playerIndex);
    } else {
        updatePlayerStats(playerIndex);
        updateGoldDisplay(playerIndex);
    }
}
