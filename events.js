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
    currentPlayer,
    nextTurn  // Add this parameter
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
            currentPlayer,
            nextTurn  // Add this line to pass nextTurn to late events
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
                    nextTurn(); // Now nextTurn is available
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
                    showLostGoldAnimation(targetCell, lostGold);
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
                GF.showItemAnimation(targetCell, '🔮');
                break;

            case 10: // Lose turn
                stats.turns -= 1;
                message = 'A storm approaches! You lose 1 turn';
                break;

            case 11: // Good karma
                stats.angel = true;
                message = 'You helped a lost child! + 😇';
                GF.showItemAnimation(targetCell, '😇');
                break;

            case 12: // Mystic sword
                stats.strength += 2;
                message = 'You found a mystic sword! +2💪';
                GF.showItemAnimation(targetCell, '💪');
                break;

            case 13: // Thieves
                const lostGold = Math.floor(Math.random() * 101) + 50; // Random 50-150
                inventory.modifyGold(playerIndex, -lostGold);
                message = `Thieves stole ${lostGold} 💰 from you!`;
                showLostGoldAnimation(targetCell, lostGold);
                break;

            case 14: // Horse
                const horseSteps = Math.floor(Math.random() * 3) + 1; // Random 1-3 steps
                message = `You tamed a horse! Moving ${horseSteps} steps forward!`;
                setTimeout(() => {
                    movePlayer(playerIndex, horseSteps);
                    showEventMessage(`Your horse carried you ${horseSteps} steps forward!`);
                }, 1000);
                
                break;

            case 15: // Ghost encounter
                // Determine karma effects
                if (stats.angel) {
                    stats.hasAlly = true;
                    stats.angel = false;
                    message = 'The ghost is moved by your pure heart! +🤝';
                    GF.showItemAnimation(targetCell, '🤝');
                } else {
                    stats.devil = true;
                    message = 'The ghost curses you with dark karma! +😈';
                    GF.showItemAnimation(targetCell, '😈');
                }
                break;

            case 16: // Rare gem
                // Random gem value between 400-600 gold
                const gemValue = Math.floor(Math.random() * 201) + 400;  // 400-600 range
                inventory.modifyGold(playerIndex, gemValue);
                message = `Found a rare gem! +${gemValue} 💰`;
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
                            GF.showItemAnimation(targetCell, '💪');
                        } else if (choice === '1') {
                            message = 'Not enough 💰 to buy the armor!';
                        } else {
                            message = 'You declined the merchant\'s offer!';
                        }
                        showEventMessage(message);
                        updatePlayerStats(playerIndex);
                        updateGoldDisplay(playerIndex);
                        nextTurn(); // Now nextTurn is available
                    }
                );
                return;

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
                        stats.strength += strength;
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
                                    GF.showItemAnimation(targetCell, '🔮');
                                } else {
                                    message = 'Not enough strength to trade! 💪❌';
                                }
                                break;
                            case '2':
                                if (stats.magic >= 2) {
                                    stats.magic -= 2;
                                    stats.strength += 3;
                                    message = 'Traded 2 magic for 3 strength! 🔮➡️💪';
                                    GF.showItemAnimation(targetCell, '💪');
                                } else {
                                    message = 'Not enough magic to trade! 🔮❌';
                                }
                                break;
                            default:
                                message = 'Declined the sorcerer\'s offer';
                        }
                        GF.showEventMessage(message);
                        updatePlayerStats(playerIndex);
                        nextTurn(); // Now nextTurn is available
                    }
                );
                return;

            case 23: // Village help
                stats.hasAlly = true;
                message = 'You saved the village! + 🤝';
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
                        nextTurn(); // Now nextTurn is available
                    }
                );
                break;

            case 25: // Cross the river
                if (stats.strength >= 5) {
                    stats.strength -= 2;
                    message = 'You crossed the river safely but lost 2 💪 due to the exhaustion.';
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
                    stats.hasAlly = true;
                    inventory.modifyGold(playerIndex, 400);
                    message = 'Rescued a trapped traveler! +🤝 +400 💰';
                    showGoldAnimation(targetCell, 400);
                    GF.showItemAnimation(targetCell, '🤝');
                } else {
                    message = 'Not strong enough to help the traveler 😢';
                }
                break;

            case 27: // Mysterious Fog
                if (stats.hasMap) {
                    message = 'Your map helped you navigate through the fog! 🗺️';
                    stats.hasMap = false;
                    inventory.markItemAsUsed(playerIndex, 'map');
                } else {
                    message = 'Lost in mysterious fog! Skip 1 turn';
                    stats.skipNextTurn = true;
                }
                break;

            case 28: // Abandoned ship
                if (stats.hasClue) {
                    stats.hasClue = false;
                    inventory.markItemAsUsed(playerIndex, 'clue');
                    const shipLoot = Math.floor(Math.random() * 300) + 200; // 200-500 gold
                    inventory.modifyGold(playerIndex, shipLoot);
                    message = `Found ${shipLoot} 💰 on the abandoned ship!`;
                    showGoldAnimation(targetCell, shipLoot);
                } else {
                    const smallLoot = Math.floor(Math.random() * 100) + 50; // 50-150 gold
                    inventory.modifyGold(playerIndex, smallLoot);
                    message = `Found ${smallLoot} 💰 on the ship. Map would help find more!`;
                    showGoldAnimation(targetCell, smallLoot);
                }
                break;

            case 29: // Dragon encounter
            const canFight = stats.strength >= 6;
            const canBribe = inventory.getGold(playerIndex) >= 500;
            const hasAlly = stats.hasAlly;
        
            if (!canFight && !canBribe && !hasAlly) {
                // Automatic run away if no other options
                const isLucky = Math.random() < 0.5;
                const steps = Math.floor(Math.random() * 6) + 1;
                
                if (isLucky) {
                    setTimeout(() => {
                        movePlayer(playerIndex, steps);
                    }, 1000);
                    message = `Found an escape route! Moving forward ${steps} steps 🏃`;
                } else {
                    // Move backward with animation
                    const token = targetCell.querySelector(`.player${playerIndex + 1}`);
                    if (token) {
                        token.classList.add('token-moving');
                        setTimeout(() => {
                            const newPosition = Math.max(0, playerPositions[playerIndex] - steps);
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
                    message = `Dragon chased you back ${steps} steps! 🐲`;
                }
                showEventMessage(message);
                updatePlayerStats(playerIndex);
                updateGoldDisplay(playerIndex);
            } else {
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
                                stats.strength -= 4;
                                message = 'You defeated the dragon but exhausted and lost 4 💪!';
                            } else {
                                playerPositions[playerIndex] = 0;
                                message = 'The dragon was too powerful! Back to start';
                            }
                        } else if (choice === '2') {
                            if (inventory.getGold(playerIndex) >= 500) {
                                inventory.modifyGold(playerIndex, -500);
                                message = 'Paid 500 💰 to appease the dragon';
                            } else {
                                playerPositions[playerIndex] = 0;
                                message = 'Not enough 💰 to bribe! Back to start';
                            }
                        } else if (stats.hasAlly) {
                            // Ally sacrifices themselves
                            stats.hasAlly = false;
                            inventory.markItemAsUsed(playerIndex, 'ally');
                            message = 'Your ally sacrificed themselves to save you from the dragon! 🤝😢';
                            movePlayer(playerIndex, 1); // Move forward 1 space safely
                        } else {
                            // Random run away outcome with animation
                            const isLucky = Math.random() < 0.5;
                            const steps = Math.floor(Math.random() * 6) + 1;
                            
                            if (isLucky) {
                                setTimeout(() => {
                                    movePlayer(playerIndex, steps);
                                }, 1000);
                                message = `Found an escape route! Moving forward ${steps} steps 🏃`;
                            } else {
                                const token = targetCell.querySelector(`.player${playerIndex + 1}`);
                                if (token) {
                                    // Add animation class
                                    token.classList.add('token-moving');
                                    
                                    setTimeout(() => {
                                        const newPosition = Math.max(0, playerPositions[playerIndex] - steps);
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
                                message = `Dragon chased you back ${steps} steps!`;
                            }
                        }
                        showEventMessage(message);
                        updatePlayerStats(playerIndex);
                        updateGoldDisplay(playerIndex);
                    }
                );
            }
                return;

            case 30: // Cursed Temple
                if (stats.hasClover) {
                    GF.createChoiceUI(
                        `You found a cursed temple! \n`,
                        `Risk your clover for 1,000 gold?`,
                        [
                            'Use clover (1,000 💰)',
                            'Keep clover'
                        ],
                        (choice) => {
                            if (choice === '1') {
                                inventory.modifyGold(playerIndex, 1000);
                                stats.hasClover = false;
                                inventory.markItemAsUsed(playerIndex, 'clover');
                                message = 'Your lucky clover turned the curse into gold! +1,000 💰 🍀✨';
                                showGoldAnimation(targetCell, 1000);
                            } else {
                                message = 'Decided to keep your lucky clover for later 🍀';
                            }
                            showEventMessage(message);
                            updatePlayerStats(playerIndex);
                            updateGoldDisplay(playerIndex);
                        }
                    );
                } else {
                    message = 'A cursed temple... better stay away!';
                    showEventMessage(message);
                }
                return; // Exit early due to async nature

            case 31: // Fairy Blessing
                const blessing = Math.floor(Math.random() * 2);
                switch(blessing) {
                    case 0:
                        stats.magic++;
                        message = 'A fairy blessed you with magic! +1 🔮';
                        GF.showItemAnimation(targetCell, '🔮');
                        break;
                    case 1:
                        stats.potions++;
                        message = 'A fairy gave you a strength! +1 💪';
                        GF.showItemAnimation(targetCell, '💪');
                        break;
                }
                break;

            case 32: // Strange noises
                if (stats.magic > 2) {
                    message = 'Your 🔮 warded off the danger!';
                    stats.magic -= 1;
                } else {
                    const danger = Math.random() < 0.5;
                    if (danger) {
                        stats.skipNextTurn = true;
                        message = 'Surprise attack in the night! Lost 1 turn';
                    } else {
                        message = 'Strange noises in the night... but nothing happened';
                    }
                }
                updatePlayerStats(playerIndex);
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
