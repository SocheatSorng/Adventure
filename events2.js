(function() {
    window.handleLateEvents = function(playerIndex, position, targetCell, params) {
        const stats = params.inventory.getStats(playerIndex);
        let message = '';
        const GF = window.GameFunctions;
        
        // Calculate grid number
        const gridNumber = position + 1;

        // Helper that uses GameFunctions.checkHealth
        function localCheckHealth() {
            return GF.checkHealth(stats, params.playerPositions, playerIndex, targetCell, params.cellOccupancy, params.TOTAL_CELLS);
        }

        switch(gridNumber) {
            case 33: // City of Gold
                const cityGold = Math.floor(Math.random() * 300) + 200;
                params.inventory.modifyGold(playerIndex, cityGold);
                message = `Welcome to the City of Gold! Found ${cityGold} gold! 🏰💰`;
                GF.showGoldAnimation(targetCell, cityGold);
                break;

            case 34: // Luck Potion
                if (params.inventory.getGold(playerIndex) >= 500 && confirm('Buy luck potion for 500 Gold? (Increases success rates) 🧪')) {
                    params.inventory.modifyGold(playerIndex, -500);
                    stats.luck = (stats.luck || 0) + 2;
                    message = 'Bought a luck potion! Luck +2 🍀';
                } else {
                    message = 'Declined to buy the luck potion 🧪';
                }
                break;

            case 35: // Pickpocket
                const dexRoll = params.rollDice();
                if (stats.luck > 0 && confirm('Use your luck to catch the pickpocket? 🍀')) {
                    params.inventory.markItemAsUsed(playerIndex, 'luckPotion');
                    message = 'Your luck helped you catch the pickpocket! 🍀';
                } else if (dexRoll >= 5) {
                    message = `Rolled ${dexRoll}! Caught the pickpocket! 🦹‍♂️❌`;
                } else {
                    const stolenAmount = Math.min(300, params.inventory.getGold(playerIndex));
                    params.inventory.modifyGold(playerIndex, -stolenAmount);
                    message = `Rolled ${dexRoll}! Pickpocket stole ${stolenAmount} gold! 🦹‍♂️💰`;
                }
                break;

            case 36: // Noble's job
                if (stats.hasMap || stats.luck > 0) {
                    params.inventory.modifyGold(playerIndex, 1000);
                    message = 'Your reputation helped! Earned 1000 Gold from the noble! 👑';
                    GF.showGoldAnimation(targetCell, 1000);
                } else {
                    params.inventory.modifyGold(playerIndex, 800);
                    message = 'Completed a job for a noble! Earned 800 Gold 👑';
                    GF.showGoldAnimation(targetCell, 800);
                }
                break;

            case 37: // Buy house
                if (params.inventory.getGold(playerIndex) >= 1000 && confirm('Invest 1000 Gold in a house? (Provides passive benefits) 🏠')) {
                    params.inventory.modifyGold(playerIndex, -1000);
                    stats.hasHouse = true;
                    stats.health++; // Bonus health for having a house
                    message = 'Invested in a house! Health +1 from rest 🏠❤️';
                } else {
                    message = 'Declined to invest in property 🏠';
                }
                break;

            case 38: // Dangerous mission
                const missionInfo = `Current Stats:\nStrength: ${stats.strength}\nHealth: ${stats.health}\nAllies: ${stats.hasAlly ? 'Yes' : 'No'}\n\n`;
                if (confirm(missionInfo + 'Accept dangerous mission for 2,000 Gold? ⚔️')) {
                    if (stats.strength >= 5 || stats.hasAlly) {
                        params.inventory.modifyGold(playerIndex, 2000);
                        message = 'Mission successful! Earned 2,000 Gold 🎯';
                        GF.showGoldAnimation(targetCell, 2000);
                    } else {
                        stats.health--;
                        message = localCheckHealth() || 'Mission failed! Lost 1 health ❌';
                    }
                } else {
                    message = 'Declined the dangerous mission 🏃';
                }
                break;

            case 39: // Guards arrest
                const guardInfo = `Your Status:\nGold: ${params.inventory.getGold(playerIndex)}\nStrength: ${stats.strength}\n\n`;
                const guardChoice = prompt(
                    guardInfo +
                    'Guards are arresting you! 👮\n' +
                    '1: Pay 500 Gold to bribe guards\n' +
                    '2: Fight guards (needs Strength 5)\n' +
                    '3: Surrender (return to start)\n' +
                    'Enter 1, 2, or 3:'
                );

                switch(guardChoice) {
                    case '1':
                        if (params.inventory.getGold(playerIndex) >= 500) {
                            params.inventory.modifyGold(playerIndex, -500);
                            message = 'Paid the guards 500 Gold to avoid arrest 💰';
                        } else {
                            message = 'Not enough gold to bribe! Guards take you to jail 🚓';
                            // Send to start
                            const startCell = document.querySelector('#gameTable tr:first-child td:first-child');
                            const token = targetCell.querySelector(`.player${playerIndex + 1}`);
                            if (token) {
                                startCell.appendChild(token);
                                token.style.top = '50%';
                                token.style.left = '50%';
                                params.cellOccupancy[params.TOTAL_CELLS - 1] = Math.max(0, params.cellOccupancy[params.TOTAL_CELLS - 1] - 1);
                                params.cellOccupancy[0]++;
                            }
                            params.playerPositions[playerIndex] = 0;
                        }
                        break;
                    case '2':
                        if (stats.strength >= 5) {
                            message = 'Successfully fought off the guards! 💪';
                            stats.strength++;
                        } else {
                            // Calculate new position
                            const newPosition = Math.max(0, params.playerPositions[playerIndex] - 5);
                            // Move token to new position
                            const targetRow = Math.floor(newPosition / 8);
                            const targetCol = newPosition % 8;
                            const newCell = document.querySelector(`#gameTable tr:nth-child(${targetRow + 1}) td:nth-child(${targetCol + 1})`);
                            const token = targetCell.querySelector(`.player${playerIndex + 1}`);
                            if (token && newCell) {
                                newCell.appendChild(token);
                                token.style.top = '50%';
                                token.style.left = '50%';
                            }
                            params.playerPositions[playerIndex] = newPosition;
                            message = 'Lost the fight! Moved back 5 spaces 🏃';
                        }
                        break;
                    default:
                        const startCell = document.querySelector('#gameTable tr:first-child td:first-child');
                        const token = targetCell.querySelector(`.player${playerIndex + 1}`);
                        if (token) {
                            startCell.appendChild(token);
                            token.style.top = '50%';
                            token.style.left = '50%';
                            params.cellOccupancy[params.TOTAL_CELLS - 1] = Math.max(0, params.cellOccupancy[params.TOTAL_CELLS - 1] - 1);
                            params.cellOccupancy[0]++;
                        }
                        params.playerPositions[playerIndex] = 0;
                        message = 'Surrendered to the guards! Back to start 🚓';
                        break;
                }
                break;

            case 40: // Arena Battle
                const battleRoll = params.rollDice();
                const totalStrength = battleRoll + (stats.strength || 0) + (stats.luck || 0);

                if (totalStrength >= 6) {
                    params.inventory.modifyGold(playerIndex, 1500);
                    stats.strength++;
                    message = `Arena victory! Roll: ${battleRoll}! Won 1,500 Gold and Strength +1 🏆`;
                    GF.showGoldAnimation(targetCell, 1500);
                } else {
                    stats.health--;
                    const healthMessage = localCheckHealth();
                    if (healthMessage) {
                        message = healthMessage;
                    } else {
                        message = `Arena defeat! Roll: ${battleRoll}! Lost 1 Health ⚔️`;
                    }
                }
                break;

            case 41: // Secret treasure room
                const treasureBonus = stats.hasClue ? 500 : 0;
                params.inventory.modifyGold(playerIndex, 1000 + treasureBonus);
                message = `Found a secret treasure room! +${1000 + treasureBonus} Gold 💎`;
                GF.showGoldAnimation(targetCell, 1000 + treasureBonus);
                break;

            case 42: // Clue to final goal
                stats.hasClue = true;
                message = 'Found a clue about the Golden Crown! Future choices will be clearer 📜';
                const clueAnimation = document.createElement('div');
                clueAnimation.className = 'map-animation';
                clueAnimation.innerHTML = '📜';
                targetCell.appendChild(clueAnimation);
                setTimeout(() => clueAnimation.remove(), 1000);
                break;

            case 43: // Crime Lord's deal
                const dealInfo = `Current Status:\nGold: ${params.inventory.getGold(playerIndex)}\nKarma: ${stats.karma || 0}\n\n`;
                if (confirm(dealInfo + 'Accept Crime Lord\'s deal?\n1,000 Gold but lose karma 🦹‍♂️')) {
                    params.inventory.modifyGold(playerIndex, 1000);
                    stats.karma = (stats.karma || 0) - 2;
                    message = 'Gained 1,000 Gold but your reputation suffers 💰😈';
                    GF.showGoldAnimation(targetCell, 1000);
                } else {
                    stats.karma = (stats.karma || 0) + 1;
                    message = 'Refused the Crime Lord. Gained good karma 😇';
                }
                break;

            case 44: // Wizard's teleport
                if (stats.magic > 0) {
                    const oldPos = params.playerPositions[playerIndex];
                    const newPos = Math.min(oldPos + 10, params.TOTAL_CELLS - 1);
                    // Update cell occupancy and move token
                    params.cellOccupancy[oldPos]--;
                    
                    const targetRow = Math.floor(newPos / 8);
                    const targetCol = newPos % 8;
                    const newCell = document.querySelector(`#gameTable tr:nth-child(${targetRow + 1}) td:nth-child(${targetCol + 1})`);
                    const token = targetCell.querySelector(`.player${playerIndex + 1}`);
                    
                    if (token && newCell) {
                        newCell.appendChild(token);
                        token.style.top = '50%';
                        token.style.left = '50%';
                        params.cellOccupancy[newPos]++;
                    }
                    
                    params.playerPositions[playerIndex] = newPos;
                    message = 'Wizard teleported you forward 10 steps! ✨';
                } else {
                    const magicFail = 5; // Always move 5 steps
                    const newPos = Math.min(params.playerPositions[playerIndex] + magicFail, params.TOTAL_CELLS - 1);
                    
                    // Update cell occupancy and move token
                    params.cellOccupancy[position]--;
                    
                    const targetRow = Math.floor(newPos / 8);
                    const targetCol = newPos % 8;
                    const newCell = document.querySelector(`#gameTable tr:nth-child(${targetRow + 1}) td:nth-child(${targetCol + 1})`);
                    const token = targetCell.querySelector(`.player${playerIndex + 1}`);
                    
                    if (token && newCell) {
                        newCell.appendChild(token);
                        token.style.top = '50%';
                        token.style.left = '50%';
                        params.cellOccupancy[newPos]++;
                    }
                    
                    params.playerPositions[playerIndex] = newPos;
                    message = 'Teleport partially worked! Moved 5 steps 🌟';
                }
                break;

            case 45: // Royal Feast
                stats.health++;
                if (stats.karma > 0) {
                    stats.potions++;
                    message = 'Attended a Royal Feast! Health +1, Potion +1 👑';
                } else {
                    message = 'Attended a Royal Feast! Health +1 👑';
                }
                break;

            case 46: // Queen's Secret Mission
                const missionStatus = `Current Stats:\nLuck: ${stats.luck || 0}\nHealth: ${stats.health}\nGold: ${params.inventory.getGold(playerIndex)}\n\n`;
                if (confirm(missionStatus + 'Accept Queen\'s secret mission?\nRisk health for 2,500 Gold 👑')) {
                    const missionRoll = params.rollDice() + (stats.luck || 0);
                    if (missionRoll >= 4) {
                        params.inventory.modifyGold(playerIndex, 2500);
                        message = 'Mission successful! Earned 2,500 Gold 🎯';
                        GF.showGoldAnimation(targetCell, 2500);
                    } else {
                        stats.health--;
                        message = localCheckHealth() || 'Mission failed! Lost 1 health ❌';
                    }
                } else {
                    message = 'Declined the Queen\'s mission 🏃';
                }
                break;

            case 47: // Secret Society
                const societyChoice = prompt(
                    'Join Secret Society?\n' +
                    '1: Light Society (+2 Magic)\n' +
                    '2: Dark Society (+2 Strength)\n' +
                    'Enter 1 or 2:'
                );

                switch(societyChoice) {
                    case '1':
                        stats.alignment = 'light';
                        stats.magic = (stats.magic || 0) + 2;
                        message = 'Joined the Light Society! Magic +2 ✨';
                        break;
                    case '2':
                        stats.alignment = 'dark';
                        stats.strength += 2;
                        stats.magic = Math.max(0, (stats.magic || 0) - 1); // Reduce magic when choosing strength
                        message = 'Joined the Dark Society! Strength +2, Magic -1 ⚔️';
                        break;
                    default:
                        message = 'Declined to join any society 🚶';
                }
                break;

            case 48: // City in Chaos
                const chaosInfo = `Current Status:\nGold: ${params.inventory.getGold(playerIndex)}\nKarma: ${stats.karma || 0}\n\n`;
                const chaosChoice = prompt(
                    chaosInfo +
                    'City is in chaos!\n' +
                    'HELP: Gain good karma\n' +
                    'LOOT: Get 500-1000 Gold but lose karma\n' +
                    'Type HELP or LOOT:'
                )?.toUpperCase();

                if (chaosChoice === 'HELP') {
                    stats.karma = (stats.karma || 0) + 2;
                    if (stats.hasAlly) {
                        params.inventory.modifyGold(playerIndex, 300);
                        message = 'Helped restore order! Karma +2 and found 300 Gold! 😇';
                        GF.showGoldAnimation(targetCell, 300);
                    } else {
                        message = 'Helped restore order! Gained good karma 😇';
                    }
                } else if (chaosChoice === 'LOOT') {
                    const lootAmount = Math.floor(Math.random() * 500) + 500;
                    params.inventory.modifyGold(playerIndex, lootAmount);
                    stats.karma = (stats.karma || 0) - 1;
                    message = `Looted ${lootAmount} Gold but lost karma 💰😈`;
                    GF.showGoldAnimation(targetCell, lootAmount);
                } else {
                    message = 'Fled the chaos 🏃';
                }
                break;

            case 49: // Dark Warrior
                const darkWarriorInfo = `Current Stats:\nStrength: ${stats.strength}\nHealth: ${stats.health}\n\n`;
                const warriorChoice = confirm(
                    darkWarriorInfo + 
                    'Dark Warrior challenges you!\nRequired Strength: 7\nAccept duel? ⚔️'
                );

                if (warriorChoice) {
                    const duelRoll = params.rollDice();
                    const totalPower = duelRoll + (stats.strength || 0);
                    if (totalPower >= 7) {
                        stats.honor = (stats.honor || 0) + 1;
                        stats.strength += 1;
                        message = 'Victory! Honor +1, Strength +1 ⚔️👑';
                    } else {
                        params.playerPositions[playerIndex] = Math.max(0, params.playerPositions[playerIndex] - 3);
                        message = 'Lost the duel! Retreated 3 spaces 🏃';
                    }
                } else {
                    message = 'Declined the duel with the Dark Warrior 🛡️';
                }
                break;

            case 50: // Haunted Castle
                const ghostRoll = params.rollDice() + (stats.magic || 0);
                const requiredPower = 5;
                const currentPower = ghostRoll;
                
                if (currentPower >= requiredPower) {
                    if (stats.hasClue) {
                        stats.hasSecrets = true;
                        message = 'The ghosts reveal ancient secrets about the Golden Crown! 👻📜';
                        const secretAnimation = document.createElement('div');
                        secretAnimation.className = 'map-animation';
                        secretAnimation.innerHTML = '📜';
                        targetCell.appendChild(secretAnimation);
                        setTimeout(() => secretAnimation.remove(), 1000);
                    } else {
                        message = `Survived the haunted castle! (Roll: ${ghostRoll}, Magic: ${stats.magic || 0}, Total: ${currentPower}/${requiredPower}) 👻`;
                    }
                } else {
                    stats.health--;
                    stats.cursed = true;
                    const lostItems = [];
                    if (stats.potions > 0) {
                        lostItems.push(`${stats.potions} potions`);
                        stats.potions = 0;
                    }
                    if (stats.magic > 0) {
                        lostItems.push('1 magic');
                        stats.magic = Math.max(0, stats.magic - 1);
                    }
                    const lostMessage = lostItems.length > 0 ? ` Lost ${lostItems.join(' and ')}!` : '';
                    message = localCheckHealth() || `The ghosts cursed you! Roll: ${ghostRoll}, Magic: ${stats.magic || 0}, Total: ${currentPower}/${requiredPower}. Lost 1 health and became cursed!${lostMessage} 👻💀`;
                }
                break;

            case 51: // Dungeon Trapdoor
                GF.createChoiceUI(
                    'You fell into a dungeon! 🕳️',
                    [
                        'EXPLORE - Risk health for treasure',
                        'HIDE - Stay safe (Luck helps)',
                        'CALL - Get help (Move back)'
                    ],
                    (choice) => {
                        switch(choice) {
                            case '1': // EXPLORE
                                const dungeonRoll = params.rollDice() + (stats.luck || 0);
                                if (dungeonRoll >= 4) {
                                    params.inventory.modifyGold(playerIndex, 800);
                                    message = 'Found hidden treasure! +800 Gold 💰';
                                    GF.showGoldAnimation(targetCell, 800);
                                } else {
                                    stats.health--;
                                    message = localCheckHealth() || 'Encountered enemies! Lost 1 health ⚔️';
                                }
                                break;
                            case '2': // HIDE
                                if (stats.luck && stats.luck > 2) {
                                    stats.hasAlly = true;
                                    message = 'Found a friendly prisoner who becomes your ally! 🤝';
                                } else {
                                    message = 'Successfully avoided danger 🛡️';
                                }
                                break;
                            default: // CALL or invalid input
                                params.playerPositions[playerIndex] = Math.max(0, params.playerPositions[playerIndex] - 2);
                                message = 'Guards heard you! Moved back 2 spaces 👮';
                                break;
                        }
                        GF.showEventMessage(message);
                        params.updatePlayerStats(playerIndex);
                        params.updateGoldDisplay(playerIndex);
                    }
                );
                break;

            case 52: // Mystic Staff
                const staffAnimation = document.createElement('div');
                staffAnimation.className = 'map-animation';
                staffAnimation.innerHTML = '🔮';
                targetCell.appendChild(staffAnimation);
                setTimeout(() => staffAnimation.remove(), 1000);

                stats.magic = (stats.magic || 0) + 3;
                stats.hasMysticStaff = true;
                message = 'Found the Mystic Staff! Magic +3 🔮';
                if (stats.alignment === 'light') {
                    stats.magic++;
                    message += ' Light alignment bonus: Magic +1 ✨';
                }
                break;

            case 53: // Demon's Deal
                const demonInfo = `Current Status:\nGold: ${params.inventory.getGold(playerIndex)}\nKarma: ${stats.karma || 0}\n\n`;
                if (confirm(demonInfo + 'Accept demon\'s deal?\n2,000 Gold for -2 karma 😈')) {
                    params.inventory.modifyGold(playerIndex, 2000);
                    stats.karma = (stats.karma || 0) - 2;
                    stats.soulBound = true;
                    message = 'Accepted demon\'s deal. +2,000 Gold but soul is bound 😈💰';
                    GF.showGoldAnimation(targetCell, 2000);
                } else if (stats.alignment === 'light') {
                    message = 'Rejected demon. Light alignment rewarded with +1 strength ✨💪';
                    stats.strength++;
                } else {
                    message = 'Rejected demon\'s offer 🛡️';
                }
                break;

            case 54: // Rival Chase
                const mapStatus = stats.hasMap ? 'Map was stolen!' : 'Rival has a map!';
                const chaseChoice = prompt(
                    `${mapStatus} 🗺️\n` +
                    'CHASE: Need Strength 4+\n' +
                    'BRIBE: Cost 300 Gold\n' +
                    'CONTINUE: Move on\n' +
                    'Type your choice:'
                )?.toUpperCase();

                switch(chaseChoice) {
                    case 'CHASE':
                        if (stats.strength >= 4) {
                            stats.hasMap = true;
                            stats.strength++;
                            message = 'Caught the thief! Recovered map and gained strength 💪';
                        } else {
                            params.playerPositions[playerIndex] = Math.max(0, params.playerPositions[playerIndex] - 4);
                            message = 'Failed to catch thief! Moved back 4 spaces 🏃';
                        }
                        break;
                    case 'BRIBE':
                        if (params.inventory.getGold(playerIndex) >= 300) {
                            params.inventory.modifyGold(playerIndex, -300);
                            stats.hasMap = true;
                            stats.hasAlly = true;
                            message = 'Paid thief 300 Gold. They become your ally! 🤝';
                        } else {
                            message = 'Not enough gold to bribe 💰❌';
                        }
                        break;
                    default:
                        stats.hasMap = false;
                        message = 'Continued without the map 🚶';
                        break;
                }
                break;

            case 55: // Mysterious Portal
                const portalInfo = `Current Status:\nClues: ${stats.hasClue ? 'Yes' : 'No'}\nSecrets: ${stats.hasSecrets ? 'Yes' : 'No'}\n\n`;
                const portalChoice = confirm(portalInfo + 'Enter the mysterious portal? 🌀');

                if (portalChoice) {
                    if (stats.hasClue || stats.hasSecrets) {
                        const advance = Math.floor(Math.random() * 6) + 3;
                        setTimeout(() => params.movePlayer(playerIndex, advance), 500);
                        message = `Your knowledge guided you! Moving forward ${advance} spaces ✨`;
                    } else {
                        params.playerPositions[playerIndex] = Math.max(0, params.playerPositions[playerIndex] - 5);
                        message = 'Portal sent you backward! Moved back 5 spaces 🌀';
                    }
                } else {
                    message = 'Wisely avoided the unstable portal 🛡️';
                }
                break;

            case 56: // Final Guardian
                const guardianInfo = `Your Power:\nStrength: ${stats.strength}\nMagic: ${stats.magic || 0}\nMystic Staff: ${stats.hasMysticStaff ? 'Yes' : 'No'}\n\n`;

                if (!stats.foughtGuardian) {
                    const guardianBattle = stats.strength + (stats.magic || 0) + params.rollDice();
                    if (guardianBattle >= 10 || stats.hasMysticStaff) {
                        stats.foughtGuardian = true;
                        stats.honor = (stats.honor || 0) + 2;
                        message = 'Defeated the Final Guardian! Honor +2 👑⚔️';
                    } else {
                        params.playerPositions[playerIndex] = Math.max(0, params.playerPositions[playerIndex] - 6);
                        message = 'Guardian overwhelmed you! Moved back 6 spaces 🛡️';
                    }
                } else {
                    message = 'The Guardian recognizes your previous victory ✨';
                }
                break;

            case 29: // Dragon encounter
                const dragonChoice = confirm(
                    `A fierce dragon blocks your path! 🐲\n` +
                    `Your Strength: ${stats.strength}\n` +
                    `Required Strength: 6\n` +
                    `Current Gold: ${params.inventory.getGold(playerIndex)}\n` +
                    (stats.hasAlly ? 'You have an ally! They can help you fight!\n' : '') +
                    `Bribe Cost: 500\n\n` +
                    `Fight the dragon? (OK to fight, Cancel to bribe)`
                );
                
                if (dragonChoice) {
                    if (stats.hasAlly && confirm('Use your ally to help fight the dragon? 🤝')) {
                        params.inventory.markItemAsUsed(playerIndex, 'ally');
                        message = 'You and your ally defeated the dragon! 🐲⚔️';
                        stats.strength += 2;
                    } else if (stats.strength >= 6) {
                        message = 'You defeated the dragon with your strength! 🐲⚔️';
                        stats.strength += 2;
                    } else {
                        params.playerPositions[playerIndex] = 0;
                        message = 'The dragon was too powerful! Back to start 🐲';
                    }
                } else if (params.inventory.getGold(playerIndex) >= 500) {
                    params.inventory.modifyGold(playerIndex, -500);
                    message = 'Bribed the dragon with 500 Gold to pass safely 🐲💰';
                } else {
                    params.playerPositions[playerIndex] = 0;
                    message = 'Not enough gold to bribe! Back to start 🐲';
                }
                break;
        }
        
        return message;
    };
})();