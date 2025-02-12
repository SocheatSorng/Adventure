function handleColumnEvent(playerIndex, position, targetCell, {
    inventory,
    playerPositions,
    showEventMessage,
    updatePlayerStats,
    updateGoldDisplay,
    showGoldAnimation,
    showLostGoldAnimation,
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
            showLostGoldAnimation,
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
                stats.hasMap = true;
                message = 'Found a secret map! 🗺️';

                // Add map gained animation
                GF.showItemAnimation(targetCell, '🗺️');
                break;

            case 3: // Bandit attack
                // Lose 1 turn and random gold amount (50-150)
                stats.skipNextTurn = true;
                const stolenGold = Math.floor(Math.random() * 101) + 50; // Random 50-150
                inventory.modifyGold(playerIndex, -stolenGold);
                showLostGoldAnimation(targetCell, stolenGold);
                message = `Bandits ambushed you! Lost ${stolenGold} 💰 and next turn!`;
                break;

            case 4: // Health loss
                if (stats.hasPotion) {
                    message = 'Your 🧪 protected you from harm!';
                    stats.hasPotion = false;
                    inventory.markItemAsUsed(playerIndex, 'potion');
                } else {
                    // Send player back to start
                    GF.sendPlayerToStart(playerIndex, playerPositions, targetCell, cellOccupancy, TOTAL_CELLS);
                    message = 'No potion to protect you! Back to start!';
                }
                break;

            case 5: // Health gain and potion
                stats.hasPotion = true;
                message = 'Gained a 🧪!';

                // Add potion gained animation
                GF.showItemAnimation(targetCell, '🧪');
                break;

            case 6: // Gambling with two dice
                // Player's turn
                const playerRoll = rollDice();
                message = `You rolled ${playerRoll}... `;
                
                // Short pause before tavern owner roll
                setTimeout(() => {
                    const tavernOwnerRoll = rollDice();
                    if (playerRoll > tavernOwnerRoll) {
                        const wonGold = Math.floor(Math.random() * 201) + 100; // Random 100-300
                        inventory.modifyGold(playerIndex, wonGold);
                        message += `Tavern owner rolled ${tavernOwnerRoll}. You won ${wonGold} 💰!`;
                        showGoldAnimation(targetCell, wonGold);
                    } else {
                        inventory.modifyGold(playerIndex, -100);
                        message += `Tavern owner rolled ${tavernOwnerRoll}. You lost 100 💰!`;
                    }
                    showEventMessage(message);
                    updatePlayerStats(playerIndex);
                    updateGoldDisplay(playerIndex);
                }, 1000);
                return; // Exit early due to async nature

            case 7: // Trap
                if (stats.hasMap) {
                    message = 'Your map revealed the hidden trap! Safe passage 🗺️✨';
                    stats.hasMap = false;
                    inventory.markItemAsUsed(playerIndex, 'map');
                } else {
                    const lostGold = Math.floor(Math.random() * 101) + 50; // Random 50-150
                    inventory.modifyGold(playerIndex, -lostGold);
                    message = `Fell into a trap! Lost ${lostGold} 💰!`;
                }
                break;

            case 8: // Bridge collapse - back to start
                if (stats.hasClue) {
                    message = 'Your 📜 helped you find a safe path across!';
                    stats.hasClue = false;
                    inventory.markItemAsUsed(playerIndex, 'clue');
                } else {
                    message = 'Bridge collapsed! Back to start 🌉💥';
                    
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
                }
                break;
                
            case 9: // Secret spell (ninth grid)
                stats.magic++;
                message = 'You learned a secret spell! +1🔮';

                // Create floating animation for magic icon
                GF.showItemAnimation(targetCell, '🔮');
                break;

            case 10: // Lose turn
                stats.turns -= 1;
                message = 'A storm approaches! You lose 1 turn';
                break;

            case 11: // Good karma
                stats.status = 'good karma';
                message = 'You helped a lost child! + 😇';
                
                // Create floating animation for karma icon
                GF.showItemAnimation(targetCell, '😇');
                break;

            case 12: // Mystic sword
                stats.strength += 2;
                message = 'You found a mystic sword! +2💪';
                GF.showItemAnimation(targetCell, '💪');
                break;

            case 13: // Thieves
                const lostGold = Math.floor(Math.random() * 101) + 50; // Random 50-150
                inventory.modifyGold(playerIndex, lostGold);
                message = `Thieves stole ${lostGold} 💰 from you!`;
                break;

            case 14: // Horse
                // Move 2 extra steps
                message = 'You tamed a horse! 🐎';
                setTimeout(() => {
                    movePlayer(playerIndex, 2);
                    showEventMessage('Your horse carries you 2 steps further!');
                }, 1000);
                
                break;

            case 15: // Ghost encounter
                // Determine karma effects
                if (stats.angel) {
                    stats.hasAlly = true;
                    message = 'The ghost is moved by your pure heart! +🤝';
                    
                    // Show ally animation
                    GF.showItemAnimation(targetCell, '🤝');
                } else {
                    stats.devil = true;
                    message = 'The ghost curses you with dark karma! +😈';
                    
                    // Show devil karma animation
                    GF.showItemAnimation(targetCell, '😈');
                }
                break;

            case 16: // Rare gem
                // Random gem value between 400-600 gold
                const gemValue = Math.floor(Math.random() * 201) + 400;  // 400-600 range
                inventory.modifyGold(playerIndex, gemValue);
                message = `Found a rare gem! +${gemValue} 💰`;
                
                // Show gem and gold animation
                GF.showGoldAnimation(targetCell, gemValue);
                break;

            case 17: // Lost in dark forest
                if (stats.hasMap) {
                    message = 'Your 🗺️ helped you navigate the dark forest!';
                    inventory.markItemAsUsed(playerIndex, 'map');
                    stats.hasMap = false;  // Remove map after use
                } else {
                    stats.skipNextTurn = true;
                    message = 'Lost in a dark forest! Skip next turn 🌲';
                }
                break;

            case 18: // Merchant's armor
                GF.createChoiceUI(
                    `A merchant offers powerful armor! Effect: +3 💪`,
                    [
                        'Buy Armor (300 💰)',
                        'Decline Offer'
                    ],
                    (choice) => {
                        if (choice === '1' && inventory.getGold(playerIndex) >= 300) {
                            inventory.modifyGold(playerIndex, -300);
                            stats.strength += 3;
                            message = 'You bought powerful armor! +3 💪';
                        } else if (choice === '1') {
                            message = 'Not enough 💰 to buy the armor!';
                        } else {
                            message = 'You declined the merchant\'s offer!';
                        }
                        showEventMessage(message);
                        updatePlayerStats(playerIndex);
                        updateGoldDisplay(playerIndex);
                    }
                );
                return; // Exit early due to async nature

            case 19: // Snake encounter
                if (stats.strength >= 3) {
                    // Fight with strength
                    stats.strength = Math.max(0, stats.strength - 3);
                    message = 'You defeated the snake but lost 3 💪!';
                } else if (stats.potions > 0) {
                    // Use potion to escape
                    stats.hasPotion = false;
                    message = 'Used a 🧪 to escape the snake!';
                    inventory.markItemAsUsed(playerIndex, 'potion');
                    setTimeout(() => {
                        movePlayer(playerIndex, 1);
                    }, 1000);
                } else {
                    // No options - return to start
                    GF.sendPlayerToStart(playerIndex, playerPositions, targetCell, cellOccupancy, TOTAL_CELLS);
                    message = 'The snake was too powerful! Back to start';
                }
                break;

            case 20: // Ancient treasure
                const treasureType = Math.floor(Math.random() * 7);
                switch(treasureType) {
                    case 0:
                        inventory.modifyGold(playerIndex, 400);
                        message = 'Found ancient golds! +400 💰';
                        showGoldAnimation(targetCell, 400);
                        break;
                    case 1:
                        const magic = Math.floor(Math.random() *3);
                        stats.magic += magic;
                        message = `Found ancient scrolls! +${magic} 🔮`;
                        GF.showItemAnimation(targetCell, '🔮');
                        break;
                    case 2:
                        const strength = Math.floor(Math.random() * 3);
                        stats.strength += 2;
                        message = `Found ancient weapons! +${strength} 💪`;
                        GF.showItemAnimation(targetCell, '💪');
                        break;
                    case 3:
                        stats.hasClue = true;
                        message = 'Found ancient clues! + 📜';
                        GF.showItemAnimation(targetCell, '📜');
                        break;
                    case 4:
                        stats.hasMap = true;
                        message = 'Found ancient maps! + 🗺️';
                        GF.showItemAnimation(targetCell, '🗺️');
                        break;
                    case 5:
                        stats.hasPotion = true;
                        message = 'Found ancient potions! + 🧪';
                        GF.showItemAnimation(targetCell, '🧪');
                        break;
                    case 6:
                        stats.hasClover = true;
                        message = 'Found ancient clover! + 🍀';
                        GF.showItemAnimation(targetCell, '🍀');
                        break;
                }
                break;

            case 21: // Pit trap
                if (stats.hasMap) {
                    message = 'Your map warned you about the pit trap! You avoided it!';
                    stats.hasMap = false;
                    inventory.markItemAsUsed(playerIndex, 'map');
                } else {
                    stats.skipNextTurn = true;
                    message = 'Fell into a pit trap! Lost 1 turn';
                }
                break;

            case 22: // Sorcerer's deal
                GF.createChoiceUI(
                    'A mysterious sorcerer offers a trade!\n',
                    [
                        'Trade 2 💪 for 3 🔮',
                        'Trade 2 🔮 for 3 💪',
                        'Decline offer'
                    ],
                    (choice) => {
                        switch(choice) {
                            case '1':
                                if (stats.strength >= 2) {
                                    stats.strength -= 2;
                                    stats.magic += 3;
                                    message = 'Traded 2 strength for 3 magic! 💪➡️🔮';
                                } else {
                                    message = 'Not enough strength to trade! 💪❌';
                                }
                                break;
                            case '2':
                                if (stats.magic >= 2) {
                                    stats.magic -= 2;
                                    stats.strength += 3;
                                    message = 'Traded 2 magic for 3 strength! 🔮➡️💪';
                                } else {
                                    message = 'Not enough magic to trade! 🔮❌';
                                }
                                break;
                            default:
                                message = 'Declined the sorcerer\'s offer';
                        }
                        GF.showEventMessage(message);
                        params.updatePlayerStats(playerIndex);
                    }
                );
                return; // Exit early due to async choice

            case 23: // Village help
                stats.hasAlly = true;
                message = 'You saved the village! + 🤝';

                // Add ally gained animation
                GF.showItemAnimation(targetCell, '🤝');
                break;

            case 24: // Magic ring
                GF.createChoiceUI(
                    'The 💍 grants one wish!\n',
                    [
                        '+3 💪',
                        '+3 🔮',
                        '+300 💰'
                    ],
                    (choice) => {
                        switch(choice) {
                            case '1':
                                stats.strength += 3;
                                message = 'Your wish for strength was granted! +3 💪';
                                GF.showItemAnimation(targetCell, '💪');
                                break;
                            case '2':
                                stats.magic += 3;
                                message = 'Your wish for magic was granted! +3 🔮';
                                GF.showItemAnimation(targetCell, '🔮');
                                break;
                            case '3':
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
                    stats.strength -= 2;
                    message = 'You crossed the river safely thanks to your 💪!';
                } else {
                    message = 'Too weak to cross! The current pushes you back!';
                    const token = targetCell.querySelector(`.player${playerIndex + 1}`);
                    if (token) {
                        // Add animation class
                        token.classList.add('token-moving');
                        
                        setTimeout(() => {
                            const newPosition = Math.max(0, playerPositions[playerIndex] - 2);
                            playerPositions[playerIndex] = newPosition;
                            const targetRow = Math.floor(newPosition / 8);
                            const targetCol = newPosition % 8;
                            const newCell = document.querySelector(`#gameTable tr:nth-child(${targetRow + 1}) td:nth-child(${targetCol + 1})`);
                            
                            if (newCell) {
                                // Animate movement
                                const currentRect = token.getBoundingClientRect();
                                const targetRect = newCell.getBoundingClientRect();
                                const xDiff = targetRect.left - currentRect.left;
                                const yDiff = targetRect.top - currentRect.top;
                                
                                token.style.transition = 'transform 1s ease-in-out';
                                token.style.transform = `translate(${xDiff}px, ${yDiff}px)`;
                                
                                // After animation, move token to new cell
                                setTimeout(() => {
                                    token.style.transition = '';
                                    token.style.transform = '';
                                    newCell.appendChild(token);
                                    token.style.top = '50%';
                                    token.style.left = '50%';
                                    token.classList.remove('token-moving');
                                }, 1000);
                            }
                        }, 500);
                    }
                }
                break;

            case 26: // Rescue traveler
                if (stats.strength >= 2) {
                    inventory.modifyGold(playerIndex, 400);
                    message = 'Rescued a trapped traveler! Gained 400 💰';
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
                    message = `Found ${shipLoot} 💰 on the abandoned ship! 🚢`;
                    showGoldAnimation(targetCell, shipLoot);
                } else {
                    const smallLoot = Math.floor(Math.random() * 100) + 50; // 50-150 gold
                    inventory.modifyGold(playerIndex, smallLoot);
                    message = `Found ${smallLoot} 💰 on the ship. Map would help find more! ⛵`;
                    showGoldAnimation(targetCell, smallLoot);
                }
                break;

            case 29: // Dragon encounter
                GF.createChoiceUI(
                    `A fierce dragon blocks your path! 🐲\n` +
                    (stats.hasAlly ? 'Your ally offers to distract the dragon!\n' : '') +
                    `What will you do?`,
                    [
                        `Fight the dragon (need 6 💪)`,
                        `Bribe with 500 💰`,
                        stats.hasAlly ? 'Let ally help (lose 🤝)' : 'Run away (random)'
                    ],
                    (choice) => {
                        if (choice === '1') {
                            if (stats.strength >= 6) {
                                stats.strength += 2;
                                message = 'You defeated the dragon with your strength! +2 💪';
                            } else {
                                playerPositions[playerIndex] = 0;
                                message = 'The dragon was too powerful! Back to start 🐲';
                            }
                        } else if (choice === '2') {
                            if (inventory.getGold(playerIndex) >= 500) {
                                inventory.modifyGold(playerIndex, -500);
                                message = 'Paid 500 💰 to appease the dragon';
                            } else {
                                playerPositions[playerIndex] = 0;
                                message = 'Not enough 💰 to bribe! Back to start 🐲';
                            }
                        } else if (stats.hasAlly) {
                            // Ally sacrifices themselves
                            stats.hasAlly = false;
                            message = 'Your ally sacrificed themselves to save you from the dragon! 🤝😢';
                            movePlayer(playerIndex, 1); // Move forward 1 space safely
                        } else {
                            // Random run away outcome (existing code)
                            const isLucky = Math.random() < 0.5;
                            const steps = Math.floor(Math.random() * 6) + 1;
                            if (isLucky) {
                                setTimeout(() => {
                                    movePlayer(playerIndex, steps);
                                }, 1000);
                                message = `Found an escape route! Moving forward ${steps} steps 🏃`;
                            } else {
                                const newPosition = Math.max(0, playerPositions[playerIndex] - steps);
                                setTimeout(() => {
                                    const targetRow = Math.floor(newPosition / 8);
                                    const targetCol = newPosition % 8;
                                    const newCell = document.querySelector(`#gameTable tr:nth-child(${targetRow + 1}) td:nth-child(${targetCol + 1})`);
                                    const token = targetCell.querySelector(`.player${playerIndex + 1}`);
                                    if (token && newCell) {
                                        token.classList.add('token-moving');
                                        newCell.appendChild(token);
                                        token.style.top = '50%';
                                        token.style.left = '50%';
                                        setTimeout(() => token.classList.remove('token-moving'), 1000);
                                    }
                                    playerPositions[playerIndex] = newPosition;
                                }, 1000);
                                message = `Dragon chased you back ${steps} steps! 🐲🏃`;
                            }
                        }
                        showEventMessage(message);
                        updatePlayerStats(playerIndex);
                        updateGoldDisplay(playerIndex);
                    }
                );
                return;

            case 30: // Cursed Temple
                GF.createChoiceUI(
                    `You found a cursed temple! 🏛️\n` +
                    `Your Health: ${stats.health}\n` +
                    (stats.health > 2 ? 'Risk 1 Health for 1,000 💰?' : 'Need more than 2 Health to risk!'),
                    [
                        stats.health > 2 ? 'Risk Health' : 'Leave',
                        'Avoid Temple'
                    ],
                    (choice) => {
                        if (choice === '1' && stats.health > 2) {
                            if (stats.magic >= 2) {
                                inventory.modifyGold(playerIndex, 1000);
                                message = 'Your magic protected you! Found 1,000 💰! 🏛️✨';
                                showGoldAnimation(targetCell, 1000);
                            } else {
                                inventory.modifyGold(playerIndex, 1000);
                                stats.health--;
                                message = 'Gained 1,000 💰 but lost 1 Health! 🏛️';
                                showGoldAnimation(targetCell, 1000);
                            }
                        } else {
                            message = stats.health <= 2 ? 
                                'Not enough health to risk the temple! 🏛️❌' : 
                                'Wisely avoided the cursed temple 🏛️';
                        }
                        showEventMessage(message);
                        updatePlayerStats(playerIndex);
                        updateGoldDisplay(playerIndex);
                    }
                );
                return; // Exit early due to async nature

            case 31: // Fairy Blessing
                const blessing = Math.floor(Math.random() * 3);
                switch(blessing) {
                    case 0:
                        stats.health++;
                        message = 'A fairy blessed you with health! +1 ❤️';
                        break;
                    case 1:
                        stats.magic++;
                        message = 'A fairy blessed you with magic! +1 🔮';
                        break;
                    case 2:
                        stats.potions++;
                        message = 'A fairy gave you a potion! +1 🧪';
                        break;
                }
                break;

            case 32: // Strange noises
                if (stats.magic > 0) {
                    message = 'Your 🔮 warded off the danger!';
                    stats.magic--;
                } else {
                    const danger = Math.random() < 0.5;
                    if (danger) {
                        stats.health--;
                        message = localCheckHealth() || 'Surprise attack in the night! Lost 1 ❤️';
                    } else {
                        message = 'Strange noises in the night... but nothing happened 🌙';
                    }
                }
                break;
        }
    }

    if (message) {
        GF.showEventMessage(message);
        updatePlayerStats(playerIndex);
        updateGoldDisplay(playerIndex);
    } else {
        updatePlayerStats(playerIndex);
        updateGoldDisplay(playerIndex);
    }
}
