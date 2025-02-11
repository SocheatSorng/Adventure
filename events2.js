(function () {
    window.handleLateEvents = function (playerIndex, position, targetCell, params) {
        const stats = params.inventory.getStats(playerIndex);
        let message = '';
        const GF = window.GameFunctions;

        // Calculate grid number
        const gridNumber = position + 1;

        // Helper that uses GameFunctions.checkHealth
        function localCheckHealth() {
            return GF.checkHealth(stats, params.playerPositions, playerIndex, targetCell, params.cellOccupancy, params.TOTAL_CELLS);
        }

        switch (gridNumber) {
            case 33: // City of Gold
                const cityGold = Math.floor(Math.random() * 300) + 200;
                params.inventory.modifyGold(playerIndex, cityGold);
                message = `Welcome to the City of Gold! Found ${cityGold} 💰! `;
                GF.showGoldAnimation(targetCell, cityGold);
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
                                params.inventory.modifyStat(playerIndex, 'luck', 1);
                                message = 'Drank the luck potion! Gained luck 🍀';
                                break;
                            case '2': // SELL
                                params.inventory.modifyGold(playerIndex, 500);
                                message = 'Sold the luck potion for 500 Gold 💰';
                                GF.showGoldAnimation(targetCell, 500);
                                break;
                        }
                        GF.showEventMessage(message);
                        params.updatePlayerStats(playerIndex);
                        params.updateGoldDisplay(playerIndex);
                    }
                )
                break;

            case 35: // Pickpocket
                GF.createChoiceUI(
                    `A pickpocket is trying to steal your 💰!${stats.hasClover ? '\nYou have a Lucky Clover! 🍀' : ''}`,
                    [
                        'CATCH - Roll dice to catch',
                        'USE 🍀 - Prevent theft'
                    ].filter(Boolean),
                    (choice) => {
                        switch (choice) {
                            case '1': // CATCH
                                const dexRoll = params.rollDice();
                                if (dexRoll >= 5) {
                                    message = `Rolled ${dexRoll}! Caught the pickpocket! 🦹‍♂️❌`;
                                } else {
                                    const stolenAmount = Math.min(300, params.inventory.getGold(playerIndex));
                                    params.inventory.modifyGold(playerIndex, -stolenAmount);
                                    message = `Rolled ${dexRoll}! Pickpocket stole ${stolenAmount} gold! 🦹‍♂️💰`;
                                    params.inventory.modifyGold(playerIndex, -stolenAmount);
                                }
                                break;
                            case '2': // USE CLOVER
                                if (stats.hasClover) {
                                    stats.hasClover = false;
                                    params.inventory.markItemAsUsed(playerIndex, 'clover');
                                    message = 'Your Lucky Clover wards off the pickpocket! 🍀';
                                }
                                break;
                        }
                        GF.showEventMessage(message);
                        params.updatePlayerStats(playerIndex);
                        params.updateGoldDisplay(playerIndex);
                    }
                );
                break;

            case 36: // Noble's job
                if (stats.hasAlly) {
                    params.inventory.modifyGold(playerIndex, 1200);
                    message = 'Your ally helped complete the job! Earned 1200 💰 from the noble!';
                    GF.showGoldAnimation(targetCell, 1200);
                } else {
                    params.inventory.modifyGold(playerIndex, 800);
                    message = 'Completed a job for a noble! Earned 800 💰 👑';
                    GF.showGoldAnimation(targetCell, 800);
                }
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
                                if (params.inventory.getGold(playerIndex) >= 1000) {
                                    params.inventory.modifyGold(playerIndex, -1000);
                                    stats.hasHouse = true;
                                    if (!stats.hasHouse) {
                                        stats.hasHouse = true;
                                        message = 'Bought a house! 🏠';
                                        const houseAnimation = document.createElement('div');
                                        houseAnimation.className = 'house-animation';
                                        houseAnimation.innerHTML = '🏠';
                                        targetCell.appendChild(houseAnimation);
                                        setTimeout(() => houseAnimation.remove(), 3000);
                                    }
                                } else {
                                    message = 'Not enough gold to buy a house 🏠❌';
                                }
                                break;
                            default: // DECLINE
                                message = 'Declined to buy the house 🏠';
                                break;
                        }
                        GF.showEventMessage(message);
                        params.updatePlayerStats(playerIndex);
                        params.updateGoldDisplay(playerIndex);
                    }
                );
                break;

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
                                params.inventory.modifyGold(playerIndex, 2000);
                                message = 'Your ally helped complete the mission but had to part ways! +2000 💰 -1 🤝';
                                GF.showGoldAnimation(targetCell, 2000);
                            } else if (stats.strength >= 5) {
                                // Move forward to Arena Battle
                                params.playerPositions[playerIndex] = 39; // Index 39 = Grid 40
                                const arenaCell = document.querySelector(`#gameTable tr:nth-child(${Math.floor(39/8) + 1}) td:nth-child(${39%8 + 1})`);
                                const token = targetCell.querySelector(`.player${playerIndex + 1}`);
                                if (token && arenaCell) {
                                    arenaCell.appendChild(token);
                                    token.style.top = '50%';
                                    token.style.left = '50%';
                                }
                                message = 'Your strength impressed them! Moving to the Arena Battle! ⚔️';
                            } else {
                                // Move back to Pickpocket
                                params.playerPositions[playerIndex] = 34; // Index 34 = Grid 35
                                const pickpocketCell = document.querySelector(`#gameTable tr:nth-child(${Math.floor(34/8) + 1}) td:nth-child(${34%8 + 1})`);
                                const token = targetCell.querySelector(`.player${playerIndex + 1}`);
                                if (token && pickpocketCell) {
                                    pickpocketCell.appendChild(token);
                                    token.style.top = '50%';
                                    token.style.left = '50%';
                                }
                                message = 'Mission too dangerous! Moved back to grid 35 🏃';
                            }
                        } else {
                            message = 'Declined the dangerous mission 🛡️';
                        }
                        GF.showEventMessage(message);
                        params.updatePlayerStats(playerIndex);
                        params.updateGoldDisplay(playerIndex);
                    }
                );
                return; // Exit early due to async nature

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
                                if (params.inventory.getGold(playerIndex) >= 500) {
                                    params.inventory.modifyGold(playerIndex, -500);
                                    message = 'Paid the guards 500 Gold to avoid arrest 💰';
                                } else {
                                    message = 'Not enough gold to bribe! Guards take you to jail 🚓';
                                    GF.sendPlayerToStart(playerIndex, params.playerPositions, targetCell, params.cellOccupancy, params.TOTAL_CELLS);
                                }
                                break;
                            case '2': // FIGHT
                                if (stats.strength >= 5) {
                                    message = 'Successfully fought off the guards! 💪';
                                    stats.strength++;
                                } else {
                                    const newPosition = Math.max(0, params.playerPositions[playerIndex] - 5);
                                    GF.sendPlayerToStart(playerIndex, params.playerPositions, targetCell, params.cellOccupancy, params.TOTAL_CELLS);
                                    message = 'Lost the fight! Moved back 5 spaces 🏃';
                                }
                                break;
                            default: // SURRENDER
                                GF.sendPlayerToStart(playerIndex, params.playerPositions, targetCell, params.cellOccupancy, params.TOTAL_CELLS);
                                message = 'Surrendered to the guards! Back to start 🚓';
                                break;
                        }
                        GF.showEventMessage(message);
                        params.updatePlayerStats(playerIndex);
                        params.updateGoldDisplay(playerIndex);
                    }
                )
                break;

            case 40: // Arena Battle
                GF.createChoiceUI(
                    `Arena Battle Challenge! ⚔️\n`,
                    [
                        'FIGHT - Roll dice for glory',
                        'DECLINE - Return to start',
                        stats.potions ? 'USE POTION - Auto win' : null
                    ].filter(Boolean),
                    (choice) => {
                        switch (choice) {
                            case '1': // FIGHT
                                const battleRoll = params.rollDice();
                                if (battleRoll >= 6) {
                                    params.inventory.modifyGold(playerIndex, 2000);
                                    stats.strength++;
                                    message = `Arena victory! Rolled ${battleRoll}! Won 2,000 Gold and +1 Strength 🏆`;
                                    GF.showGoldAnimation(targetCell, 2000);
                                } else {
                                    // Send player back to start
                                    GF.sendPlayerToStart(playerIndex, params.playerPositions, targetCell, params.cellOccupancy, params.TOTAL_CELLS);
                                    message = `Arena defeat! Rolled ${battleRoll}! Back to start ⚔️`;
                                }
                                break;
                            case '2': // DECLINE
                                GF.sendPlayerToStart(playerIndex, params.playerPositions, targetCell, params.cellOccupancy, params.TOTAL_CELLS);
                                message = 'Declined the arena battle. Back to start ⚔️';
                                break;
                            case '3': // USE POTION
                                if (stats.potions) {
                                    stats.potions--;
                                    params.inventory.modifyGold(playerIndex, 2000);
                                    stats.strength++;
                                    message = 'Used potion to win! +2,000 💰 and +1 💪 🧪🏆';
                                    GF.showGoldAnimation(targetCell, 2000);
                                }
                                break;
                        }
                        GF.showEventMessage(message);
                        params.updatePlayerStats(playerIndex);
                        params.updateGoldDisplay(playerIndex);
                    }
                );
                break;

            case 41: // Secret treasure room
                const treasureBonus = stats.hasClue ? 500 : 0;
                params.inventory.modifyGold(playerIndex, 1000 + treasureBonus);
                message = `Found a secret treasure room! +${1000 + treasureBonus} 💰`;
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
                GF.createChoiceUI(
                    'You met the Crime Lord! 💰',
                    [
                        'ACCEPT - 1,000 Gold but gained bad karma',
                        'REFUSE - Keep your honor'
                    ],
                    (choice) => {
                        switch (choice) {
                            case '1': // ACCEPT
                                params.inventory.modifyGold(playerIndex, 1000);
                                message = 'Accepted dark deal! +1,000 💰, +😈';
                                stats.devil = true;
                                GF.showGoldAnimation(targetCell, 1000);
                                break;
                            default: // REFUSE
                                stats.karma = (stats.karma || 0) + 1;
                                message = 'Refused the Crime Lord. +😇';
                                stats.angel = true;
                                break;
                        }
                        GF.showEventMessage(message);
                        params.updatePlayerStats(playerIndex);
                        params.updateGoldDisplay(playerIndex);
                    }
                )
                break;

            case 44: // Wizard's teleport
                if (stats.magic >= 3) {
                    const oldPos = params.playerPositions[playerIndex];
                    let stepsForward = 1;  // Default 1 step for having >= 3 magic
                    
                    if (stats.hasWand) {
                        // With wand: moves based on magic amount (max 10)
                        stepsForward = Math.min(stats.magic, 10);
                        message = `🪄 amplifies your magic! Moving ${stepsForward} steps forward! 🪄✨`;
                        stats.hasWand = false;
                    } else {
                        message = `Used magic to move 1 step forward! ✨`;
                    }
            
                    const newPos = Math.min(oldPos + stepsForward, params.TOTAL_CELLS - 1);
                    
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
                } else {
                    message = 'Not enough 🔮 to cast teleport! Need at least 3 🔮❌';
                }
                GF.showEventMessage(message);
                break;

            case 45: // Royal Feast
                stats.health++;
                if (stats.angel > 0) {
                    message = 'Attended a Royal Feast! Health +3';
                    stats.health += 3;
                } else if (stats.devil > 0) {
                    message = 'Attended a Royal Feast! Health -3';
                    stats.health -= 3;
                }
                break;

            case 46: // Queen's Secret Mission
                GF.createChoiceUI(
                    'The Queen offers you a secret mission! 👑',
                    [
                        'ACCEPT - Risk health for 2,500 Gold',
                        'DECLINE - Keep your health'
                    ],
                    (choice) => {
                        switch (choice) {
                            case '1': // ACCEPT
                                const missionRoll = params.rollDice() + (stats.luck || 0);
                                if (missionRoll >= 4) {
                                    params.inventory.modifyGold(playerIndex, 2500);
                                    message = 'Mission successful! Earned 2,500 Gold 🎯';
                                    GF.showGoldAnimation(targetCell, 2500);
                                } else {
                                    stats.health--;
                                    message = localCheckHealth() || 'Mission failed! Lost 1 health ❌';
                                }
                                break;
                            default: // DECLINE
                                message = 'Declined the Queen\'s mission 🏃';
                                break;
                        }
                        GF.showEventMessage(message);
                        params.updatePlayerStats(playerIndex);
                        params.updateGoldDisplay(playerIndex);
                    }
                )
                break;

            case 47: // Secret Society
                GF.createChoiceUI(
                    'You found a secret society! 🌌',
                    [
                        'JOIN - Light Society (+2 Magic)',
                        'JOIN - Dark Society (+2 Strength)',
                        'DECLINE - Stay neutral'
                    ],
                    (choice) => {
                        switch (choice) {
                            case '1': // JOIN LIGHT
                                stats.alignment = 'light';
                                stats.magic = (stats.magic || 0) + 2;
                                message = 'Joined the Light Society! Magic +2 ✨';
                                break;
                            case '2': // JOIN DARK
                                stats.alignment = 'dark';
                                stats.strength += 2;
                                stats.magic = Math.max(0, (stats.magic || 0) - 1); // Reduce magic when choosing strength
                                message = 'Joined the Dark Society! Strength +2, Magic -1 ⚔️';
                                break;
                            default: // DECLINE
                                message = 'Declined to join any society 🚶';
                                break;
                        }
                        GF.showEventMessage(message);
                        params.updatePlayerStats(playerIndex);
                    }
                )
                break;

            case 48: // City in Chaos
                if (stats.hasAlly) {
                    message = 'Your ally helped you escape the chaos safely! 🤝';
                    stats.hasAlly = false; // Ally leaves after helping
                    params.inventory.markItemAsUsed(playerIndex, 'ally');
                } else {
                    // Send player back to start
                    GF.sendPlayerToStart(playerIndex, params.playerPositions, targetCell, params.cellOccupancy, params.TOTAL_CELLS);
                    message = 'Got caught in the chaos! Back to start! 🌪️';
                }
                GF.showEventMessage(message);
                params.updatePlayerStats(playerIndex);
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
                        switch (choice) {
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

                switch (chaseChoice) {
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