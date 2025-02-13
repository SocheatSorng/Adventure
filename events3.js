(function() {
    // Add to existing handleLateEvents function cases
    window.handleLateEventsExtension = function(playerIndex, position, targetCell, {
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
        
        // Calculate grid number
        const gridNumber = position + 1;

        function localCheckHealth() {
            return params.checkHealth(stats, playerPositions, playerIndex, targetCell, cellOccupancy, TOTAL_CELLS);
        }

        switch(gridNumber) {
            case 57: // Sacred Chamber
            if (stats.devil) {
                // Evil karma: move backward to grid 55 (index 54)
                stats.devil = false;
                playerPositions[playerIndex] = 54;  // Move to grid 55
                
                // Move token to grid 55
                const portalCell = document.querySelector(`#gameTable tr:nth-child(${Math.floor(54/8) + 1}) td:nth-child(${54%8 + 1})`);
                const token = targetCell.querySelector(`.player${playerIndex + 1}`);
                
                if (token && portalCell) {
                    // Animate token movement
                    setTimeout(() => {
                        portalCell.appendChild(token);
                        token.style.top = '50%';
                        token.style.left = '50%';
                        walkingAnimation.remove();
                        message = 'Dark aura sends you to the Mysterious Portal!';
                        GF.showEventMessage(message);
                        }, 1000);
                    }
                inventory.markItemAsUsed(playerIndex, 'devil');
                } else if (stats.angel) {
                    // Good karma: receive random item
                    stats.angel = false;
                    const possibleItems = [
                        { name: 'lucky clover', stat: 'hasClover', emoji: '🍀' },
                        { name: 'map', stat: 'hasMap', emoji: '🗺️' },
                        { name: 'staff', stat: 'hasStaff', emoji: '🪄' },
                        { name: 'ally', stat: 'hasAlly', emoji: '🤝' },
                        { name: 'clue', stat: 'hasClue', emoji: '📜' },
                        { name: 'potion', stat: 'hasPotion', emoji: '🧪' }
                    ];

                    // Filter out items player already has
                    const availableItems = possibleItems.filter(item => !stats[item.stat]);

                    if (availableItems.length > 0) {
                        // Pick random item from available ones
                        const randomItem = availableItems[Math.floor(Math.random() * availableItems.length)];
                        stats[randomItem.stat] = true;
                        message = `Sacred blessing! Received ${randomItem.name}! ${randomItem.emoji}`;

                        // Show item animation
                        GF.showItemAnimation(targetCell, randomItem.emoji);
                    } else {
                        message = 'Sacred chamber shines with approval!';
                    }
                } else {
                    message = 'The sacred chamber remains silent...';
                }
                GF.showEventMessage(message);
                updatePlayerStats(playerIndex);
                break;

            case 58: // Titan Battle
                if (stats.strength >= 10) {
                    message = 'Your incredible strength defeats the Titan!';
                    if(stats.hasAlly)
                        stats.titanAlly = true; // Titan becomes ally
                    stats.strength -= 5;

                } else if (stats.hasAlly) {
                    GF.createChoiceUI(
                        'The Titan is too strong! Your ally offers to help!\n',
                        [
                            'SACRIFICE - Ally fights Titan',
                            'RETREAT - Move to grid 17'
                        ],
                        (choice) => {
                            if (choice === '1') {
                                
                                inventory.markItemAsUsed(playerIndex, 'ally');
                                message = 'Your 🤝 sacrificed themselves to save you!';
                            } else {
                                // Move to grid 17 (index 16)
                                playerPositions[playerIndex] = 16;
                                const newCell = document.querySelector(`#gameTable tr:nth-child(${Math.floor(16/8) + 1}) td:nth-child(${16%8 + 1})`);
                                const token = targetCell.querySelector(`.player${playerIndex + 1}`);
                                if (token && newCell) {
                                    newCell.appendChild(token);
                                    token.style.top = '50%';
                                    token.style.left = '50%';
                                }
                                message = 'Retreated from the Titan! Moved back to the forest';
                            }
                            GF.showEventMessage(message);
                            updatePlayerStats(playerIndex);
                        }
                    );
                    return; // Exit early due to async choice
                } else {
                    // Move to grid 17 (index 16)
                    playerPositions[playerIndex] = 16;
                    const newCell = document.querySelector(`#gameTable tr:nth-child(${Math.floor(16/8) + 1}) td:nth-child(${16%8 + 1})`);
                    const token = targetCell.querySelector(`.player${playerIndex + 1}`);
                    if (token && newCell) {
                        newCell.appendChild(token);
                        token.style.top = '50%';
                        token.style.left = '50%';
                    }
                    message = 'The Titan is too powerful! Moved back to the forest';
                }
                GF.showEventMessage(message);
                updatePlayerStats(playerIndex);
                break;
                
            case 59: // Cursed Crown
                if (stats.hasCrown) {
                    // Auto-win if player has crown
                    inventory.modifyGold(playerIndex, 10000);
                    message = '👑 VICTORY! The crown recognizes its true ruler! +10,000 💰';
                    GF.showGoldAnimation(targetCell, 10000);
                    
                    // Show crown animation
                    GF.showItemAnimation(targetCell, '👑');
                    
                    setTimeout(() => {
                        alert(`Congratulations Player ${playerIndex + 1}!\nYou have won the game with the 👑! `);
                    }, 1000);
                } else {
                    message = 'A mysterious crown beckons in the distance...';
                }
                GF.showEventMessage(message);
                updatePlayerStats(playerIndex);
                break;

            case 60: // Earthquake Trial
                if (stats.hasStaff) {
                    // Teleport to Mysterious Portal (grid 55, index 54)
                    playerPositions[playerIndex] = 54;
                    const portalCell = document.querySelector(`#gameTable tr:nth-child(${Math.floor(54/8) + 1}) td:nth-child(${54%8 + 1})`);
                    const token = targetCell.querySelector(`.player${playerIndex + 1}`);
                    if (token && portalCell) {
                        portalCell.appendChild(token);
                        token.style.top = '50%';
                        token.style.left = '50%';
                    }
                    message = 'Your 🪄 protected you! Teleported to the Mysterious Portal!';
                    inventory.markItemAsUsed(playerIndex, 'staff');
                } else if (stats.hasMap) {
                    // Move player forward 1 step
                    playerPositions[playerIndex] = Math.min(TOTAL_CELLS - 1, playerPositions[playerIndex] + 1);
                    message = `Your 🗺️ guides you! Moved forward 1 step!`;
                    inventory.markItemAsUsed(playerIndex, 'map');
                } else {
                    // Send player back to start
                    GF.sendPlayerToStart(playerIndex, playerPositions, targetCell, cellOccupancy, TOTAL_CELLS);
                    message = 'Earthquake throws you back to the beginning!';
                }
                GF.showEventMessage(message);
                updatePlayerStats(playerIndex);
                break;

            case 61: // Ultimate Boss Battle
                // Automatically lose a turn
                stats.skipNextTurn = true;
                message = 'The Ultimate Boss drains your energy! Lost next turn!';
                GF.showEventMessage(message);
                updatePlayerStats(playerIndex);
                break;
            
            case 62: // Breaking the Curse
                if (stats.hasClue) { 
                    if (stats.angel) {
                        message = 'Your pure heart and ancient knowledge reveals the crown!';
                        stats.hasCrown = true;
                        stats.hasClue = false;
                        stats.angel = false;
                        inventory.markItemAsUsed(playerIndex, 'angel');
                        inventory.markItemAsUsed(playerIndex, 'clue');
                        GF.showItemAnimation(targetCell, '👑');
                    } else if (stats.devil) {
                        // Evil karma gets crown but sent to start
                        GF.sendPlayerToStart(playerIndex, playerPositions, targetCell, cellOccupancy, TOTAL_CELLS);
                        message = 'Dark magic reveals the crown, but at a price! Back to start!';
                        stats.devil = false;
                    }
                    
                    message = 'You have the clue, but you don\'t know how to break the curse yet...';
                } else {
                    message = 'The curse remains unbroken... Need a clue to proceed 📜❌';
                }
                GF.showEventMessage(message);
                updatePlayerStats(playerIndex);
                break;

            case 63: // Ruler's Choice
                if (stats.hasHouse) {
                    // Player with house is considered established and trustworthy
                    message = 'Your established status as a homeowner earns respect! Safe passage granted 🏠✨';
                } else if (stats.hasTitan){
                    // Player with Titan ally is considered powerful
                    message = 'Your powerful Titan ally commands respect! Safe passage granted 🧌✨';
                    stats.hasTitan = false;
                    inventory.markItemAsUsed(playerIndex, 'titan');
                }
                    else {
                    // Move player backward randomly (1-6 steps)
                    const backSteps = Math.floor(Math.random() * 6) + 1;
                    playerPositions[playerIndex] = Math.max(0, playerPositions[playerIndex] - backSteps);
                    message = `Lack of status betrays you! Moved back ${backSteps} steps! 👑❌`;
                    
                    // Move player token
                    const newPos = playerPositions[playerIndex];
                    const newCell = document.querySelector(`#gameTable tr:nth-child(${Math.floor(newPos/8) + 1}) td:nth-child(${newPos%8 + 1})`);
                    const token = targetCell.querySelector(`.player${playerIndex + 1}`);
                    if (token && newCell) {
                        newCell.appendChild(token);
                        token.style.top = '50%';
                        token.style.left = '50%';
                    }
                }
                GF.showEventMessage(message);
                updatePlayerStats(playerIndex);
                break;

            case 64: // Victory Celebration
                // Calculate final stats
                const finalStats = {
                    gold: inventory.getGold(playerIndex),
                    strength: stats.strength || 0,
                    magic: stats.magic || 0
                };
            
                // Determine ending based on stats
                let ending;
                if (finalStats.magic > finalStats.strength) {
                    ending = 'wise';
                } else if (finalStats.strength > finalStats.magic) {
                    ending = 'powerful';
                } else if (stats.angel) {
                    ending = 'balanced';
                } else if (stats.devil) {
                    ending = 'uncertain';
                } else {
                    ending = 'unknown';
                }
            
                // Store ending type
                stats.ending = ending;
            
                // Show victory message and animation
                message = '🎉 Victory! Your adventure is complete!';
                const celebrationAnimation = document.createElement('div');
                celebrationAnimation.className = 'map-animation';
                celebrationAnimation.innerHTML = '🏆';
                celebrationAnimation.style.fontSize = '32px';
                targetCell.appendChild(celebrationAnimation);
                setTimeout(() => celebrationAnimation.remove(), 2000);
            
                // Show ending dialog after animation
                setTimeout(() => {
                    const endingMessages = {
                        wise: '📚 Your wisdom brings a golden age of peace and prosperity!',
                        powerful: '⚔️ Your strength ensures security and expansion!',
                        balanced: '☯️ Your balanced rule creates perfect harmony!',
                        uncertain: '❓ Your legacy remains to be written...',
                        unknown: '📜 Your story fades into legend...'
                    };
            
                    alert(
                        `🏆 Adventure Complete!\n\n` +
                        `Final Stats:\n` +
                        `Gold: ${finalStats.gold} 💰\n` +
                        `Strength: ${finalStats.strength} 💪\n` +
                        `Magic: ${finalStats.magic} ✨\n\n` +
                        `${endingMessages[ending]}`
                    );
                }, 1000);
            
                GF.showEventMessage(message);
                updatePlayerStats(playerIndex);
                break;

            default:
                // Return null to indicate event not handled
                return null;
        }
        
        return message;
    };

    // Modify existing handleLateEvents to use extension
    const originalHandleLateEvents = window.handleLateEvents;
    window.handleLateEvents = function(playerIndex, position, targetCell, {
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
        // Try extension first
        const extensionResult = window.handleLateEventsExtension(playerIndex, position, targetCell, {
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
            nextTurn
        });
        if (extensionResult !== null) {
            return extensionResult;
        }
        // Fall back to original handler if extension didn't handle it
        return originalHandleLateEvents(playerIndex, position, targetCell, {
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
            nextTurn
        });
    };
})();
