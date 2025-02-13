(function () {
    window.handleLateEvents = function (playerIndex, position, targetCell, {
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

        // Pass nextTurn in params object
        const eventParams = {
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
            nextTurn  // Add this to params
        };

        // Calculate grid number
        const gridNumber = position + 1;

        // Helper that uses GameFunctions.checkHealth
        function localCheckHealth() {
            return GF.checkHealth(stats, playerPositions, playerIndex, targetCell, cellOccupancy, TOTAL_CELLS);
        }

        switch (gridNumber) {
            case 33: // City of Gold
                const cityGold = Math.floor(Math.random() * 300) + 200;
                inventory.modifyGold(playerIndex, cityGold);
                message = `Welcome to the City of Gold! Found ${cityGold} 💰! `;
                showGoldAnimation(targetCell, cityGold);
                break;

            case 34: // Luck Potion
                GF.createChoiceUI(
                    'You found a luck potion! 🧪',
                    [
                        'DRINK - Gain 🍀',
                        'SELL - Get 500 💰',
                    ],
                    (choice) => {
                        switch (choice) {
                            case '1': // DRINK
                                stats.hasClover = true;
                                message = 'Drank the luck potion! Gained luck 🍀';
                                GF.showItemAnimation(targetCell, '🍀');
                                break;
                            case '2': // SELL
                                inventory.modifyGold(playerIndex, 500);
                                message = 'Sold the luck potion for 500 Gold 💰';
                                showGoldAnimation(targetCell, 500);
                                break;
                        }
                        showEventMessage(message);
                        updatePlayerStats(playerIndex);
                        updateGoldDisplay(playerIndex);
                        nextTurn(); // Add turn progression after choice
                    }
                )
                return; // Exit early for choice events

            case 35: // Pickpocket
                if (stats.hasClover) {
                    // Show choice if player has clover
                    GF.createChoiceUI(
                        `A pickpocket is trying to steal your 💰!\nYou have a Lucky Clover! 🍀`,
                        [
                            'CATCH - Roll dice to catch',
                            'USE 🍀 - Prevent theft'
                        ],
                        (choice) => {
                            switch (choice) {
                                case '1': // CATCH
                                    const dexRoll = rollDice();
                                    if (dexRoll >= 5) {
                                        message = `Rolled ${dexRoll}! Caught the pickpocket! 🦹‍♂️❌`;
                                    } else {
                                        const stolenAmount = Math.min(300, inventory.getGold(playerIndex));
                                        inventory.modifyGold(playerIndex, -stolenAmount);
                                        message = `Rolled ${dexRoll}! Pickpocket stole ${stolenAmount} gold! 🦹‍♂️💰`;
                                        inventory.modifyGold(playerIndex, -stolenAmount);
                                    }
                                    break;
                                case '2': // USE CLOVER
                                    if (stats.hasClover) {
                                        stats.hasClover = false;
                                        inventory.markItemAsUsed(playerIndex, 'clover');
                                        message = 'Your Lucky Clover wards off the pickpocket! 🍀';
                                    }
                                    break;
                            }
                            showEventMessage(message);
                            updatePlayerStats(playerIndex);
                            updateGoldDisplay(playerIndex);
                            nextTurn(); // Add turn progression after choice
                        }
                        
                );
                return; // Exit early for choice events
                } else {
                    // Auto CATCH if no clover
                    const dexRoll = rollDice();
                    if (dexRoll >= 3) {
                        message = `Rolled ${dexRoll}! Caught the pickpocket!`;
                    } else {
                        const stolenAmount = Math.min(300, inventory.getGold(playerIndex));
                        inventory.modifyGold(playerIndex, -stolenAmount);
                        message = `Rolled ${dexRoll}! Pickpocket stole ${stolenAmount} gold! 🦹‍♂️💰`;
                        showLostGoldAnimation(targetCell, -stolenAmount);
                    }
                    showEventMessage(message);
                    updatePlayerStats(playerIndex);
                    updateGoldDisplay(playerIndex);
                }
                break;

            case 36: // Noble's job
                if (stats.hasTitan) {
                    // Royal effect with titan
                    message = 'Your titan impressed the noble! Gain 🏰 ';
                    stats.getRoyal = true;
                    stats.hasTitan = false;
                    GF.showItemAnimation(targetCell, '🏰');
                } else {
                    // Random gold reward up to 500
                    const reward = Math.floor(Math.random() * 501); // 0-500 range
                    inventory.modifyGold(playerIndex, reward);
                    message = `Completed a job for the noble! +${reward} 💰`;
                    showGoldAnimation(targetCell, reward);
                }
                showEventMessage(message);
                updatePlayerStats(playerIndex);
                updateGoldDisplay(playerIndex);
                break;

            case 37: // Buy house
                GF.createChoiceUI(
                    'You found a house for sale! 🏠',
                    [
                        'BUY - 1000 Gold',
                        'DECLINE - Save your gold'
                    ],
                    (choice) => {
                        switch (choice) {
                            case '1': // BUY
                                if (inventory.getGold(playerIndex) >= 1000) {
                                    inventory.modifyGold(playerIndex, -1000);
                                    stats.hasHouse = true;
                                    message = 'Bought the 🏠!';
                                    GF.showItemAnimation(targetCell, '🏠');
                                } else {
                                    message = 'Not enough gold to buy a house!';
                                }
                                break;
                            default: // DECLINE
                                message = 'Declined to buy the house';
                                break;
                        }
                        showEventMessage(message);
                        updatePlayerStats(playerIndex);
                        updateGoldDisplay(playerIndex);
                        nextTurn(); // Add turn progression after choice
                    }
                );
                return; // Exit early for choice events

            case 38: // Dangerous mission
                GF.createChoiceUI(
                    `You are offered a dangerous mission! ⚔️\n` +
                    `Your Strength: ${stats.strength}\n` +
                    `Required: 5 💪\n` +
                    (stats.hasAlly ? 'Your ally can help complete the mission!\n' : ''),
                    [
                        'Accept mission',
                        'Decline mission'
                    ],
                    (choice) => {
                        if (choice === '1') {
                            if (stats.hasAlly) {
                                // Complete mission with ally's help
                                stats.hasAlly = false;
                                inventory.modifyGold(playerIndex, 2000);
                                message = 'Your ally helped complete the mission but had to part ways! +2000 💰 -1 🤝';
                                showGoldAnimation(targetCell, 2000);
                            } else if (stats.strength >= 5) {
                                // Move forward to Arena Battle
                                playerPositions[playerIndex] = 39; // Index 39 = Grid 40
                                const arenaCell = document.querySelector(`#gameTable tr:nth-child(${Math.floor(39/8) + 1}) td:nth-child(${39%8 + 1})`);
                                const token = targetCell.querySelector(`.player${playerIndex + 1}`);
                                if (token && arenaCell) {
                                    arenaCell.appendChild(token);
                                    token.style.top = '50%';
                                    token.style.left = '50%';
                                }
                                message = 'Your strength impressed them! Moving to the Arena Battle!';
                            } else {
                                // Move back to Pickpocket
                                playerPositions[playerIndex] = 32; // Index 32 = Grid 33
                                const pickpocketCell = document.querySelector(`#gameTable tr:nth-child(${Math.floor(34/8) + 1}) td:nth-child(${34%8 + 1})`);
                                const token = targetCell.querySelector(`.player${playerIndex + 1}`);
                                if (token && pickpocketCell) {
                                    pickpocketCell.appendChild(token);
                                    token.style.top = '50%';
                                    token.style.left = '50%';
                                }
                                message = 'Mission too dangerous! Moved back to city';
                            }
                        } else {
                            message = 'Declined the dangerous mission';
                        }
                        showEventMessage(message);
                        updatePlayerStats(playerIndex);
                        updateGoldDisplay(playerIndex);
                        nextTurn(); // Add turn progression after choice
                    }
                );
                return; // Exit early for choice events

            case 39: // Guards arrest
                GF.createChoiceUI(
                    'Guards are arresting you! 👮',
                    [
                        'PAY - 500 Gold to bribe guards',
                        'FIGHT - Fight guards (Strength 5)',
                        'SURRENDER - Return to start'
                    ],
                    (choice) => {
                        switch (choice) {
                            case '1': // PAY
                                if (inventory.getGold(playerIndex) >= 500) {
                                    inventory.modifyGold(playerIndex, -500);
                                    message = 'Paid the guards 500 💰 to avoid arrest!';
                                } else {
                                    message = 'Not enough 💰 to bribe! Guards take you to jail';
                                    GF.sendPlayerToStart(playerIndex, playerPositions, targetCell, cellOccupancy, TOTAL_CELLS);
                                }
                                break;
                            case '2': // FIGHT
                                if (stats.strength >= 5) {
                                    message = 'Successfully fought off the guards! 💪';
                                    stats.strength++;
                                } else {
                                    const newPosition = Math.max(0, playerPositions[playerIndex] - 5);
                                    GF.sendPlayerToStart(playerIndex, playerPositions, targetCell, cellOccupancy, TOTAL_CELLS);
                                    message = 'Lost the fight! Moved back 5 spaces 🏃';
                                }
                                break;
                            default: // SURRENDER
                                GF.sendPlayerToStart(playerIndex, playerPositions, targetCell, cellOccupancy, TOTAL_CELLS);
                                message = 'Surrendered to the guards! Back to start';
                                break;
                        }
                        showEventMessage(message);
                        updatePlayerStats(playerIndex);
                        updateGoldDisplay(playerIndex);
                        nextTurn(); // Add turn progression after choice
                    }
                )
                return; // Exit early for choice events

            case 40: // Arena Battle
                GF.createChoiceUI(
                    `Arena Battle Challenge! ⚔️\n`,
                    [
                        'FIGHT - Roll dice for glory',
                        'DECLINE - Return to start',
                        stats.potions ? 'USE 🧪 - Auto win' : null
                    ].filter(Boolean),
                    (choice) => {
                        switch (choice) {
                            case '1': // FIGHT
                                const battleRoll = rollDice();
                                if (battleRoll >= 6) {
                                    const goldWon = Math.floor(Math.random() * 501); // Random 0-500
                                    inventory.modifyGold(playerIndex, goldWon);
                                    message = `Arena victory! Rolled ${battleRoll}! Won ${goldWon} 💰`;
                                    showGoldAnimation(targetCell, goldWon);
                                } else {
                                    // Send player back to start
                                    GF.sendPlayerToStart(playerIndex, playerPositions, targetCell, cellOccupancy, TOTAL_CELLS);
                                    message = `Arena defeat! Rolled ${battleRoll}! Back to start ⚔️`;
                                }
                                break;
                            case '2': // DECLINE
                                GF.sendPlayerToStart(playerIndex, playerPositions, targetCell, cellOccupancy, TOTAL_CELLS);
                                message = 'Declined the arena battle. Back to start ⚔️';
                                break;
                            case '3': // USE POTION
                                if (stats.hasPotion) {
                                    stats.hasPotion = false;
                                    inventory.modifyGold(playerIndex, 500);
                                    message = 'Used 🧪 to win! +500 💰';
                                    showGoldAnimation(targetCell, 500);
                                }
                                break;
                        }
                        showEventMessage(message);
                        updatePlayerStats(playerIndex);
                        updateGoldDisplay(playerIndex);
                        nextTurn(); // Add turn progression after choice
                    }
                );
                return; // Exit early for choice events

            case 41: // Secret treasure room
                if (stats.hasClover) {
                    // Found secret treasure room with lucky clover
                    const foundGold = Math.floor(Math.random() * 501) + 50; // Random 50-500
                    inventory.modifyGold(playerIndex, foundGold);
                    stats.hasClover = false;
                    inventory.markItemAsUsed(playerIndex, 'clover');
                    message = `Your 🍀 led you to a secret treasure room! +${foundGold} 💰`;
                    showGoldAnimation(targetCell, foundGold);
                } else {
                    message = 'Nothing interesting here...';
                }
                showEventMessage(message);
                updatePlayerStats(playerIndex);
                updateGoldDisplay(playerIndex);
                break;

            case 42: // Clue to final goal
                stats.hasClue = true;
                message = 'Found a clue! This will help you solve future obstacles and find the Golden Crown! 📜';
                GF.showItemAnimation(targetCell, '📜');
                break;

            case 43: // Crime Lord's deal
                GF.createChoiceUI(
                    'You met the Crime Lord! 💰',
                    [
                        'ACCEPT - 500 Gold but gained bad karma',
                        'REFUSE - Keep your honor'
                    ],
                    (choice) => {
                        switch (choice) {
                            case '1': // ACCEPT
                                inventory.modifyGold(playerIndex, 500);
                                message = 'Accepted dark deal! +500 💰, +😈';
                                stats.devil = true;
                                stats.angel = false;
                                showGoldAnimation(targetCell, 500);
                                GF.showItemAnimation(targetCell, '😈');
                                break;
                            default: // REFUSE
                                message = 'Refused the Crime Lord. +😇';
                                GF.showItemAnimation(targetCell, '😇');
                                stats.angel = true;
                                stats.devil = false;
                                break;
                        }
                        showEventMessage(message);
                        updatePlayerStats(playerIndex);
                        updateGoldDisplay(playerIndex);
                        nextTurn(); // Add turn progression after choice
                    }
                )
                return; // Exit early for choice events

            case 44: // Wizard's teleport
                if (stats.magic >= 3) {
                    setTimeout(() => {
                        movePlayer(playerIndex, 1);
                        showEventMessage('Used 🔮 to move 1 step forward!');
                    }, 1000);
                    
                    if (stats.hasStaff) {
                        // With wand: moves based on magic amount (max 10)
                        const stepsForward = Math.min(stats.magic, 10);
                        setTimeout(() => {
                            movePlayer(playerIndex, stepsForward);
                            showEventMessage(`🪄 amplifies your magic! Moving ${stepsForward} steps forward!`);
                        }, 1000);
                    }
                } else {
                    message = 'Not enough magic to cast teleport! Need at least 3 🔮';
                }
                showEventMessage(message);
                break;

            case 45: // Royal Feast
                if (stats.angel) {
                    message = 'The nobles welcome you!';
                } else if (stats.devil) {
                    GF.sendPlayerToStart(playerIndex, playerPositions, targetCell, cellOccupancy, TOTAL_CELLS);
                    message = 'The nobles recognize your dark dealings! Back to start';
                } else {
                    message = 'You were not invited to the Royal Feast!';
                }
                showEventMessage(message);
                updatePlayerStats(playerIndex);
                stats.getRoyal = true;
                break;

                case 46: // Queen's Secret Mission
                const getGold = Math.floor(Math.random() * 351) + 150; // Random 150-500
                if (stats.angel) {
                    // Angel karma: Auto-success and bonus gold
                    inventory.modifyGold(playerIndex, getGold);
                    message = `The Queen trusts your pure heart! Mission success! +${getGold} 💰`;
                    showGoldAnimation(targetCell, getGold);
                } else if (stats.devil) {
                    // Devil karma: Guards catch you
                    GF.sendPlayerToStart(playerIndex, playerPositions, targetCell, cellOccupancy, TOTAL_CELLS);
                    message = 'The Queen\'s guards recognize your evil deeds! Back to start';
                } else {
                    // No karma: Normal mission choice
                    GF.createChoiceUI(
                        'The Queen offers you a secret mission!',
                        [
                            'ACCEPT - Risk golds for golds',
                            'DECLINE - Keep your golds'
                        ],
                        (choice) => {
                            switch (choice) {
                                case '1': // ACCEPT
                                    const missionRoll = rollDice();
                                    if (missionRoll >= 4) {
                                        inventory.modifyGold(playerIndex, getGold);
                                        message = `Mission successful! +${getGold} 💰`;
                                        showGoldAnimation(targetCell, getGold);
                                    } else {
                                        message = `Mission failed! Lost ${getGold} 💰`;
                                        inventory.modifyGold(playerIndex, -getGold);
                                        showLostGoldAnimation(targetCell, -getGold);
                                    }
                                    break;
                                default: // DECLINE
                                    message = 'Declined the Queen\'s mission';
                                    break;
                            }
                            showEventMessage(message);
                            updatePlayerStats(playerIndex);
                            updateGoldDisplay(playerIndex);
                            nextTurn(); // Add turn progression after choice
                        }
                    );
                    return; // Exit early for choice events
                }
                showEventMessage(message);
                updatePlayerStats(playerIndex);
                updateGoldDisplay(playerIndex);
                stats.getRoyal = true;
                break;

            case 47: // Secret Society
                GF.createChoiceUI(
                    'You found a secret society!',
                    [
                        'JOIN - Light Society (+2 🔮)',
                        'JOIN - Dark Society (+2 💪)',
                        'DECLINE - Stay neutral'
                    ],
                    (choice) => {
                        switch (choice) {
                            case '1': // JOIN LIGHT
                                stats.alignment = 'light';
                                stats.magic = (stats.magic || 0) + 2;
                                message = 'Joined the Light Society! Magic +2 🔮';
                                GF.showItemAnimation(targetCell, '🔮');
                                break;
                            case '2': // JOIN DARK
                                stats.alignment = 'dark';
                                stats.strength += 2;
                                message = 'Joined the Dark Society! Strength +2 💪';
                                GF.showItemAnimation(targetCell, '💪');
                                break;
                            default: // DECLINE
                                message = 'Declined to join any society';
                                break;
                        }
                        showEventMessage(message);
                        updatePlayerStats(playerIndex);
                        nextTurn(); // Add turn progression after choice
                    }
                )
                return; // Exit early for choice events

            case 48: // City in Chaos
                if (stats.hasAlly) {
                    message = 'Your 🤝 helped you escape the chaos safely!';
                    stats.hasAlly = false; // Ally leaves after helping
                    inventory.markItemAsUsed(playerIndex, 'ally');
                } else {
                    // Send player back to start
                    GF.sendPlayerToStart(playerIndex, playerPositions, targetCell, cellOccupancy, TOTAL_CELLS);
                    message = 'Got caught in the chaos! Back to start!';
                }
                showEventMessage(message);
                updatePlayerStats(playerIndex);
                break;

            case 49: // Dark Warrior
                // Store initial magic for message and drain all magic immediately
                const initialMagic = stats.magic || 0;
                stats.magic = 0;
                
                message = `The Dark Warrior drains all your magic! Lost ${initialMagic} 🔮❌`;
                showEventMessage(message);
                updatePlayerStats(playerIndex);
                break;

            case 50: // Haunted Castle
                if (stats.hasClover) {
                    // Lucky clover protects from the curse
                    stats.hasClover = false; // Use up the clover
                    inventory.markItemAsUsed(playerIndex, 'clover');
                    message = 'Your 🍀 protected you from the castle\'s curse!';
                
                } else {
                    // Lose everything without clover protection
                    const oldGold = inventory.getGold(playerIndex);
                    inventory.modifyGold(playerIndex, -oldGold);
                    stats.strength = 0;
                    stats.magic = 0;
                    stats.hasMap = false;
                    stats.hasAlly = false;
                    stats.hasClover = false;  
                    stats.hasClue = false;
                    stats.hasStaff = false;
                    stats.hasPotion = false;
                    stats.hasTitan = false;
                    stats.hasCrown = false;
            
                    message = 'The castle\'s curse took everything from you!';
                }
                showEventMessage(message);
                updatePlayerStats(playerIndex);
                updateGoldDisplay(playerIndex);
                break;

            case 51: // Dungeon Trapdoor
                if (stats.hasClue) {
                    // Player with clue knows how to escape safely
                    message = 'Your 📜 helped you escape the trapdoor!';
                    stats.hasClue = false; // Use up the clue
                    inventory.markItemAsUsed(playerIndex, 'clue');
                } else {
                    // Player without clue loses a turn
                    stats.skipNextTurn = true;
                    message = 'You fell into the trapdoor! Lost next turn to climb out!';
                }
                showEventMessage(message);
                updatePlayerStats(playerIndex);
                break;

            case 52: // Mystic Staff
                stats.hasStaff = true;
                message = 'Found the Mystic Staff! +🪄';
                showEventMessage(message);
                GF.showItemAnimation(targetCell, '🪄');
                break;

            case 53: // Demon's Lord
                if (stats.strength >= 5) {
                    message = 'Your 💪 protected you from demon lord\'s curse!';
                    stats.strength -= 3;
                } else if (stats.magic >= 5) {
                    message = 'Your 🔮 protected you from demon lord\'s curse!';
                    stats.magic -= 3;
                } else {
                    
                    stats.magic = 0;
                    stats.strength = 0;
                    const oldGold = inventory.getGold(playerIndex);
                    inventory.modifyGold(playerIndex, -oldGold);
                    showLostGoldAnimation(targetCell, -oldGold);
            
                    message = 'You fought the demon lord but were exhausted! Lost all 💪 and 🔮 and all 💰!';
                }
                showEventMessage(message);
                updatePlayerStats(playerIndex);
                
                break;

            case 54: // Rival Chase
                // Determine what item to steal based on player's inventory
                let itemToSteal = '';
                if (stats.hasMap) itemToSteal = 'map';
                else if (stats.hasStaff) itemToSteal = 'staff';
                else if (stats.hasClover) itemToSteal = 'lucky clover';
                else if (stats.hasClue) itemToSteal = 'clue';
                else if (stats.hasAlly) itemToSteal = 'ally';
                else if (stats.hasCrown) itemToSteal = 'crown';
                else if (stats.hasPotion) itemToSteal = 'potion';
                else if (stats.hasTitan) itemToSteal = 'titan';
                else {
                    message = 'The rival found nothing worth stealing!';
                    showEventMessage(message);
                    break;
                }
            
                GF.createChoiceUI(
                    `Rival stole your ${itemToSteal}!\n`,
                    [
                        'BRIBE - 300 💰 to get it back',
                        'RUN - Lose the item'
                    ],
                    (choice) => {
                        switch (choice) {
                            case '1': // BRIBE
                                if (inventory.getGold(playerIndex) >= 300) {
                                    inventory.modifyGold(playerIndex, -300);
                                    message = `Paid 300 💰 to get your ${itemToSteal} back!`;
                                    showLostGoldAnimation(targetCell, -300);
                                } else {
                                    // Remove stolen item
                                    switch (itemToSteal) {
                                        case 'map': stats.hasMap = false; break;
                                        case 'staff': stats.hasStaff = false; break;
                                        case 'lucky clover': stats.hasClover = false; break;
                                        case 'clue': stats.hasClue = false; break;
                                        case 'ally': stats.hasAlly = false; break;
                                        case 'crown': stats.hasCrown = false; break;
                                        case 'potion': stats.hasPotion = false; break;
                                        case 'titan': stats.hasTitan = false; break;
                                    }
                                    message = `Not enough 💰! Lost your ${itemToSteal}!`;
                                }
                                break;
                            default: // RUN
                                // Remove stolen item
                                switch (itemToSteal) {
                                    case 'map': stats.hasMap = false; break;
                                    case 'staff': stats.hasStaff = false; break;
                                    case 'lucky clover': stats.hasClover = false; break;
                                    case 'clue': stats.hasClue = false; break;
                                    case 'ally': stats.hasAlly = false; break;
                                    case 'crown': stats.hasCrown = false; break;
                                    case 'potion': stats.hasPotion = false; break;
                                    case 'titan': stats.hasTitan = false; break;
                                }
                                message = `Ran away! Lost your ${itemToSteal}!`;
                                break;
                        }
                        showEventMessage(message);
                        updatePlayerStats(playerIndex);
                        updateGoldDisplay(playerIndex);
                        nextTurn(); // Add turn progression after choice
                    }
                );
                return; // Exit early for choice events

            case 55: // Mysterious Portal
                message = 'A mysterious portal swirls before you...';
                showEventMessage(message);
                break;

            case 56: // Meet Guardian
                if (stats.getRoyal) {
                    message = 'The guardian welcomes you!';
                } else {
                    GF.sendPlayerToStart(playerIndex, playerPositions, targetCell, cellOccupancy, TOTAL_CELLS);
                    message = 'The guardian does not recognize you! Back to start';
                }
                showEventMessage(message);
                updatePlayerStats(playerIndex);
                break;
        }

        return message;
    };
})();