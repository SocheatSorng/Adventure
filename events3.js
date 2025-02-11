(function() {
    // Add to existing handleLateEvents function cases
    window.handleLateEventsExtension = function(playerIndex, position, targetCell, params) {
        const stats = params.inventory.getStats(playerIndex);
        let message = '';
        
        // Calculate grid number
        const gridNumber = position + 1;

        function localCheckHealth() {
            return params.checkHealth(stats, params.playerPositions, playerIndex, targetCell, params.cellOccupancy, params.TOTAL_CELLS);
        }

        switch(gridNumber) {
            case 57: // Sacred Chamber
                const riddleInfo = `Current Stats:\nWisdom: ${stats.wisdom || 0}\nHealth: ${stats.health}\n\n`;
                const riddleAnswer = prompt(
                    riddleInfo +
                    'Answer the riddle:\n' +
                    'I have cities, but no houses.\n' +
                    'I have mountains, but no trees.\n' +
                    'I have water, but no fish.\n' +
                    'I have roads, but no cars.\n' +
                    'What am I? 📜'
                );

                if (riddleAnswer?.toLowerCase() === 'map') {
                    inventory.modifyGold(playerIndex, 1000);
                    stats.wisdom = (stats.wisdom || 0) + 1;
                    message = 'Riddle solved! +1,000 Gold and gained wisdom 📚✨';
                    showGoldAnimation(targetCell, 1000);
                } else {
                    stats.health--;
                    message = localCheckHealth() || 'Wrong answer! Lost 1 health ❌';
                }
                break;

            case 58: // Titan Battle
                const titanInfo = `Your Power:\nStrength: ${stats.strength}\nMystic Staff: ${stats.hasMysticStaff ? 'Yes' : 'No'}\nLuck: ${stats.luck || 0}\n\n`;
                const titanChoice = prompt(
                    titanInfo +
                    'A titan appears! 🗿\n' +
                    'FIGHT: Need Strength 8+\n' +
                    'SNEAK: Need Map or Luck 3+\n' +
                    'BARGAIN: Cost 1,000 Gold\n' +
                    'Type your choice:'
                )?.toUpperCase();

                switch(titanChoice) {
                    case 'FIGHT':
                        if (stats.strength >= 8 || stats.hasMysticStaff) {
                            stats.strength += 2;
                            message = 'Defeated the titan! Strength +2 ⚔️';
                        } else {
                            playerPositions[playerIndex] = 0;
                            message = 'The titan was too powerful! Back to start 🗿';
                        }
                        break;
                    case 'SNEAK':
                        if (stats.hasMap || stats.luck >= 3) {
                            setTimeout(() => movePlayer(playerIndex, 2), 500);
                            message = 'Successfully snuck past! Moving forward 🦶';
                        } else {
                            stats.health--;
                            message = localCheckHealth() || 'Failed to sneak! Lost 1 health 👀';
                        }
                        break;
                    case 'BARGAIN':
                        if (inventory.getGold(playerIndex) >= 1000) {
                            inventory.modifyGold(playerIndex, -1000);
                            stats.titanAlly = true;
                            message = 'The titan becomes your ally! Paid 1,000 Gold 🤝';
                        } else {
                            message = 'Not enough gold to bargain 💰❌';
                        }
                        break;
                    default:
                        playerPositions[playerIndex] = Math.max(0, playerPositions[playerIndex] - 3);
                        message = 'Hesitation cost you! Moved back 3 spaces 🏃';
                }
                break;

            case 59: // Cursed Crown
                const crownInfo = `Status:\nAlignment: ${stats.alignment || 'neutral'}\nKarma: ${stats.karma || 0}\nGold: ${inventory.getGold(playerIndex)}\n\n`;

                if (stats.alignment === 'light' && stats.karma > 0) {
                    message = 'Your pure heart lifts the curse! Crown is yours! 👑✨';
                    stats.hasCrown = true;
                    const crownAnimation = document.createElement('div');
                    crownAnimation.className = 'map-animation';
                    crownAnimation.innerHTML = '👑';
                    targetCell.appendChild(crownAnimation);
                    setTimeout(() => crownAnimation.remove(), 1000);
                } else if (inventory.getGold(playerIndex) >= 5000 && 
                        confirm(crownInfo + 'Pay 5,000 Gold to lift the curse? 👑')) {
                    inventory.modifyGold(playerIndex, -5000);
                    stats.hasCrown = true;
                    message = 'Paid to lift the curse! Crown is yours! 👑';
                } else {
                    stats.cursed = true;
                    message = 'The crown remains cursed! Beware... 💀';
                }
                break;

            case 60: // Final Trial
                const powerStats = `Power Stats:\n` +
                                `Strength: ${stats.strength}\n` +
                                `Magic: ${stats.magic || 0}\n` +
                                `Allies: ${(stats.hasAlly ? 1 : 0) + (stats.titanAlly ? 1 : 0)}\n` +
                                `Artifacts: ${stats.hasMysticStaff ? 'Staff' : 'None'}\n\n`;

                const finalPower = stats.strength + (stats.magic || 0) + 
                                (stats.honor || 0) + (stats.wisdom || 0) +
                                (stats.hasAlly ? 2 : 0) + 
                                (stats.titanAlly ? 3 : 0) +
                                (stats.hasMysticStaff ? 2 : 0) -
                                (stats.cursed ? 4 : 0);

                if (finalPower >= 15) {
                    inventory.modifyGold(playerIndex, 5000);
                    message = '🎉 VICTORY! You are worthy! +5,000 Gold';
                    showGoldAnimation(targetCell, 5000);
                    setTimeout(() => {
                        alert(`Congratulations Player ${playerIndex + 1}!\n` +
                            `Total Gold: ${inventory.getGold(playerIndex)}\n` +
                            `Final Power: ${finalPower}`);
                    }, 1000);
                } else {
                    playerPositions[playerIndex] = Math.max(0, playerPositions[playerIndex] - 10);
                    message = `Trial failed! Power(${finalPower}/15) Not yet worthy! ⚔️`;
                }
                break;

            case 61: // Ultimate Boss Battle
                const totalPower = stats.strength + (stats.magic || 0) + 
                                (stats.honor || 0) + (stats.wisdom || 0) +
                                (stats.hasAlly ? 2 : 0) + 
                                (stats.titanAlly ? 3 : 0) +
                                (stats.hasMysticStaff ? 2 : 0) +
                                (stats.luck || 0) -
                                (stats.cursed ? 4 : 0) +
                                (stats.karma > 0 ? 2 : 0);

                const bossBattleInfo = `Battle Status:\nTotal Power: ${totalPower}\nRequired: 20\n\n`;

                if (confirm(bossBattleInfo + 'Face the Ultimate Boss? ⚔️')) {
                    const battleRoll = rollDice() + rollDice();
                    const finalPower = totalPower + battleRoll;
                    
                    if (finalPower >= 20) {
                        stats.legendaryVictor = true;
                        stats.strength += 3;
                        stats.magic = (stats.magic || 0) + 3;
                        message = `Epic victory! Power(${finalPower}/20) Legendary status achieved! 🏆`;
                    } else {
                        playerPositions[playerIndex] = Math.max(0, playerPositions[playerIndex] - 10);
                        stats.health = Math.max(1, stats.health - 2);
                        message = `Defeated! Power(${finalPower}/20) Retreat and grow stronger... ⚔️`;
                    }
                } else {
                    playerPositions[playerIndex] = Math.max(0, playerPositions[playerIndex] - 5);
                    message = 'Retreated from the ultimate battle 🏃';
                }
                break;

            case 62: // Breaking the Curse
                if (stats.legendaryVictor) {
                    stats.cursed = false;
                    stats.isCrowned = true;
                    inventory.modifyGold(playerIndex, 10000);
                    message = '👑 The curse is broken! Crowned as the new ruler! +10,000 Gold';
                    showGoldAnimation(targetCell, 10000);
                    
                    const coronationAnimation = document.createElement('div');
                    coronationAnimation.className = 'map-animation';
                    coronationAnimation.innerHTML = '👑';
                    coronationAnimation.style.fontSize = '32px';
                    targetCell.appendChild(coronationAnimation);
                    setTimeout(() => coronationAnimation.remove(), 1500);
                    
                    setTimeout(() => {
                        alert('The kingdom celebrates your coronation! 👑');
                    }, 1000);
                } else {
                    message = 'Must prove yourself in ultimate battle first! ⚔️';
                    playerPositions[playerIndex] = Math.max(0, playerPositions[playerIndex] - 1);
                }
                break;

            case 63: // Ruler's Choice
                if (stats.isCrowned) {
                    const rulerChoice = prompt(
                        'How will you rule the kingdom? 👑\n\n' +
                        'WISDOM: Rule with knowledge\n' +
                        'POWER: Rule with strength\n' +
                        'BALANCE: Rule with harmony\n\n' +
                        'Type your choice:'
                    )?.toUpperCase();

                    switch(rulerChoice) {
                        case 'WISDOM':
                            stats.ending = 'wise';
                            message = 'You become a wise and beloved ruler! 📚👑';
                            break;
                        case 'POWER':
                            stats.ending = 'powerful';
                            message = 'You become a powerful but feared ruler! ⚔️👑';
                            break;
                        case 'BALANCE':
                            stats.ending = 'balanced';
                            message = 'You rule with perfect balance! ☯️👑';
                            break;
                        default:
                            stats.ending = 'uncertain';
                            message = 'Your uncertain rule leads to challenges... 👑❓';
                    }
                } else {
                    message = 'You must be crowned to make this choice! 👑❌';
                    playerPositions[playerIndex] = Math.max(0, playerPositions[playerIndex] - 1);
                }
                break;

            case 64: // Victory Celebration
                const finalStats = {
                    gold: inventory.getGold(playerIndex),
                    strength: stats.strength,
                    magic: stats.magic || 0,
                    karma: stats.karma || 0,
                    ending: stats.ending || 'unknown'
                };

                message = '🎉 Congratulations! Adventure completed!';

                setTimeout(() => {
                    const endingMessages = {
                        wise: '📚 Your wisdom brings a golden age of peace and prosperity!',
                        powerful: '⚔️ Your strength ensures security and expansion!',
                        balanced: '☯️ Your balanced rule creates perfect harmony!',
                        uncertain: '❓ Your legacy remains to be written...',
                        unknown: '📜 Your story fades into legend...'
                    };

                    alert(`🏆 Adventure Complete!\n\n` +
                        `Final Gold: ${finalStats.gold} 💰\n` +
                        `Strength: ${finalStats.strength} 💪\n` +
                        `Magic: ${finalStats.magic} ✨\n` +
                        `Karma: ${finalStats.karma} ${finalStats.karma > 0 ? '😇' : '😈'}\n\n` +
                        `${endingMessages[finalStats.ending]}`);
                }, 1000);
                break;

            default:
                // Return null to indicate event not handled
                return null;
        }
        
        return message;
    };

    // Modify existing handleLateEvents to use extension
    const originalHandleLateEvents = window.handleLateEvents;
    window.handleLateEvents = function(playerIndex, position, targetCell, params) {
        // Try extension first
        const extensionResult = window.handleLateEventsExtension(playerIndex, position, targetCell, params);
        if (extensionResult !== null) {
            return extensionResult;
        }
        // Fall back to original handler if extension didn't handle it
        return originalHandleLateEvents(playerIndex, position, targetCell, params);
    };
})();
