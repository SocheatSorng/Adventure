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
    
    // Helper function to send player back to start
    function sendPlayerToStart() {
        playerPositions[playerIndex] = 0;
        const startCell = document.querySelector('#gameTable tr:first-child td:first-child');
        const token = targetCell.querySelector(`.player${playerIndex + 1}`);
        if (token) {
            startCell.appendChild(token);
            token.style.top = '50%';
            token.style.left = '50%';
            cellOccupancy[TOTAL_CELLS - 1] = Math.max(0, cellOccupancy[TOTAL_CELLS - 1] - 1);
            cellOccupancy[0]++;
        }
    }

    // Helper function to check health and return to start if needed
    function checkHealth() {
        // Initialize health if undefined
        if (typeof stats.health === 'undefined') {
            stats.health = 0;
        }
        
        // Only send to start if health is explicitly 0
        if (stats.health <= 0) {
            stats.health = 0; // Ensure health doesn't go negative
            sendPlayerToStart();
            return 'You lost all health! Back to start.';
        }
        return null;
    }

    // Calculate grid number directly from position (1-based)
    const gridNumber = position + 1;
    console.log('Current grid:', gridNumber); // Debug log

    // Initialize health if undefined before any event
    if (typeof stats.health === 'undefined') {
        stats.health = 0;
    }

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
                message = checkHealth() || 'Lost 1 health!';
            } else {
                message = 'Already at 0 health!';
                sendPlayerToStart();
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
            const requiredStrength = 3;
            const playerChoice = confirm(
                `A huge snake blocks your path! 🐍\n` +
                `Your Strength: ${stats.strength}\n` +
                `Required Strength to win: ${requiredStrength}\n\n` +
                `Fight the snake? (OK to fight, Cancel to flee)\n` +
                `Warning: You'll lose 2 health if you lose the fight!`
            );
            
            if (playerChoice) {
                if (stats.strength >= requiredStrength) {
                    stats.strength++;
                    message = 'You defeated the snake! Strength +1 🐍';
                } else {
                    // First reduce health
                    stats.health = Math.max(0, stats.health - 2);
                    // Then check if player should return to start
                    if (stats.health <= 0) {
                        sendPlayerToStart();
                        message = 'The snake defeated you! Back to start 🐍';
                    } else {
                        message = 'The snake was too strong! Lost 2 health 🐍';
                    }
                }
            } else {
                // First reduce health
                stats.health = Math.max(0, stats.health - 1);
                // Then check if player should return to start
                if (stats.health <= 0) {
                    sendPlayerToStart();
                    message = 'The snake\'s bite was fatal! Back to start 🐍';
                } else {
                    message = 'You fled but got bit! Lost 1 health 🐍';
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
                message = checkHealth() || 'Fell into a pit trap! Lose 1 turn and 1 health 🕳️';
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

        case 25: // Cross the river
            if (stats.strength >= 5) {
                stats.strength++;
                message = 'You crossed the river safely! Strength +1';
            } else {
                stats.health = Math.max(0, stats.health - 1);
                message = checkHealth() || 'Too weak to cross! Lost 1 health';
            }
            break;

        case 26: // Rescue traveler
            if (stats.strength >= 2) {
                playerGold[playerIndex] += 400;
                message = 'Rescued a trapped traveler! Gained 400 Gold 🦸';
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
                playerGold[playerIndex] += shipLoot;
                message = `Found ${shipLoot} Gold on the abandoned ship! 🚢`;
                showGoldAnimation(targetCell, shipLoot);
            } else {
                const smallLoot = Math.floor(Math.random() * 100) + 50; // 50-150 gold
                playerGold[playerIndex] += smallLoot;
                message = `Found ${smallLoot} Gold on the ship. Map would help find more! ⛵`;
                showGoldAnimation(targetCell, smallLoot);
            }
            break;

        case 29: // Dragon encounter
            const dragonChoice = confirm(
                `A fierce dragon blocks your path! 🐲\n` +
                `Your Strength: ${stats.strength}\n` +
                `Required Strength: 6\n` +
                `Current Gold: ${playerGold[playerIndex]}\n` +
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
                if (playerGold[playerIndex] >= 500) {
                    playerGold[playerIndex] -= 500;
                    message = 'Paid 500 Gold to appease the dragon 🐲💰';
                } else {
                    playerPositions[playerIndex] = 0;
                    message = 'Not enough gold to bribe! Back to start 🐲';
                }
            }
            break;

        case 30: // Cursed Temple
            if (stats.magic >= 2) {
                playerGold[playerIndex] += 1000;
                message = 'Your magic protected you! Found 1,000 Gold! 🏛️✨';
                showGoldAnimation(targetCell, 1000);
            } else if (confirm('Risk losing 1 Health for 1,000 Gold? 🏛️')) {
                playerGold[playerIndex] += 1000;
                stats.health--;
                message = 'Gained 1,000 Gold but lost 1 Health! 🏛️';
                showGoldAnimation(targetCell, 1000);
                const healthCheck = checkHealth();
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
                    message = checkHealth() || 'Surprise attack in the night! Lost 1 health 🌙';
                } else {
                    message = 'Strange noises in the night... but nothing happened 🌙';
                }
            }
            break;

        case 33: // City of Gold
            const cityGold = Math.floor(Math.random() * 300) + 200;
            playerGold[playerIndex] += cityGold;
            message = `Welcome to the City of Gold! Found ${cityGold} gold! 🏰💰`;
            showGoldAnimation(targetCell, cityGold);
            break;

        case 34: // Luck Potion
            if (playerGold[playerIndex] >= 500 && confirm('Buy luck potion for 500 Gold? (Increases success rates) 🧪')) {
                playerGold[playerIndex] -= 500;
                stats.luck = (stats.luck || 0) + 2;
                message = 'Bought a luck potion! Luck +2 🍀';
            } else {
                message = 'Declined to buy the luck potion 🧪';
            }
            break;

        case 35: // Pickpocket
            const dexRoll = rollDice();
            if (stats.luck > 0 || dexRoll >= 5) {
                message = `Rolled ${dexRoll}! Caught the pickpocket! 🦹‍♂️❌`;
                if (stats.luck > 0) {
                    message = 'Your luck helped you catch the pickpocket! 🍀';
                }
            } else {
                const stolenAmount = Math.min(300, playerGold[playerIndex]);
                playerGold[playerIndex] -= stolenAmount;
                message = `Rolled ${dexRoll}! Pickpocket stole ${stolenAmount} gold! 🦹‍♂️💰`;
            }
            break;

        case 36: // Noble's job
            if (stats.hasMap || stats.luck > 0) {
                playerGold[playerIndex] += 1000;
                message = 'Your reputation helped! Earned 1000 Gold from the noble! 👑';
                showGoldAnimation(targetCell, 1000);
            } else {
                playerGold[playerIndex] += 800;
                message = 'Completed a job for a noble! Earned 800 Gold 👑';
                showGoldAnimation(targetCell, 800);
            }
            break;

        case 37: // Buy house
            if (playerGold[playerIndex] >= 1000 && confirm('Invest 1000 Gold in a house? (Provides passive benefits) 🏠')) {
                playerGold[playerIndex] -= 1000;
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
                    playerGold[playerIndex] += 2000;
                    message = 'Mission successful! Earned 2,000 Gold 🎯';
                    showGoldAnimation(targetCell, 2000);
                } else {
                    stats.health--;
                    message = checkHealth() || 'Mission failed! Lost 1 health ❌';
                }
            } else {
                message = 'Declined the dangerous mission 🏃';
            }
            break;

        case 39: // Guards arrest
            const guardInfo = `Your Status:\nGold: ${playerGold[playerIndex]}\nStrength: ${stats.strength}\n\n`;
            const guardChoice = prompt(
                guardInfo +
                'Guards are arresting you! 👮\n' +
                'Type:\nPAY (costs 500 Gold)\n' +
                'FIGHT (needs Strength 5)\n' +
                'RUN (move back 5 spaces)'
            );
            
            if (guardChoice?.toUpperCase() === 'PAY' && playerGold[playerIndex] >= 500) {
                playerGold[playerIndex] -= 500;
                message = 'Paid the guards 500 Gold to avoid arrest 💰';
            } else if (guardChoice?.toUpperCase() === 'FIGHT') {
                if (stats.strength >= 5) {
                    message = 'Successfully fought off the guards! 💪';
                    stats.strength++;
                } else {
                    playerPositions[playerIndex] = Math.max(0, playerPositions[playerIndex] - 5);
                    message = 'Lost the fight! Moved back 5 spaces 🏃';
                }
            } else {
                playerPositions[playerIndex] = 0;
                message = 'Arrested! Back to start 🚓';
            }
            break;

        case 40: // Arena Battle
            const battleRoll = rollDice();
            const totalStrength = battleRoll + (stats.strength || 0) + (stats.luck || 0);
            
            if (totalStrength >= 6) {
                playerGold[playerIndex] += 1500;
                stats.strength++;
                message = `Arena victory! Roll: ${battleRoll}! Won 1,500 Gold and Strength +1 🏆`;
                showGoldAnimation(targetCell, 1500);
            } else {
                stats.health--;
                const healthMessage = checkHealth();
                if (healthMessage) {
                    message = healthMessage;
                } else {
                    message = `Arena defeat! Roll: ${battleRoll}! Lost 1 Health ⚔️`;
                }
            }
            break;

        case 41: // Secret treasure room
            const treasureBonus = stats.hasClue ? 500 : 0;
            playerGold[playerIndex] += 1000 + treasureBonus;
            message = `Found a secret treasure room! +${1000 + treasureBonus} Gold 💎`;
            showGoldAnimation(targetCell, 1000 + treasureBonus);
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
            const dealInfo = `Current Status:\nGold: ${playerGold[playerIndex]}\nKarma: ${stats.karma || 0}\n\n`;
            if (confirm(dealInfo + 'Accept Crime Lord\'s deal?\n1,000 Gold but lose karma 🦹‍♂️')) {
                playerGold[playerIndex] += 1000;
                stats.karma = (stats.karma || 0) - 2;
                message = 'Gained 1,000 Gold but your reputation suffers 💰😈';
                showGoldAnimation(targetCell, 1000);
            } else {
                stats.karma = (stats.karma || 0) + 1;
                message = 'Refused the Crime Lord. Gained good karma 😇';
            }
            break;

        case 44: // Wizard's teleport
            if (stats.magic > 0) {
                const oldPos = playerPositions[playerIndex];
                const newPos = Math.min(oldPos + 10, TOTAL_CELLS - 1);
                playerPositions[playerIndex] = newPos;
                message = 'Wizard teleported you forward 10 steps! ✨';
                setTimeout(() => movePlayer(playerIndex, newPos - oldPos), 500);
            } else {
                const magicFail = Math.floor(Math.random() * 5) + 1;
                playerPositions[playerIndex] = Math.min(playerPositions[playerIndex] + magicFail, TOTAL_CELLS - 1);
                message = `Teleport partially worked! Moved ${magicFail} steps 🌟`;
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
            const missionStatus = `Current Stats:\nLuck: ${stats.luck || 0}\nHealth: ${stats.health}\nGold: ${playerGold[playerIndex]}\n\n`;
            if (confirm(missionStatus + 'Accept Queen\'s secret mission?\nRisk health for 2,500 Gold 👑')) {
                const missionRoll = rollDice() + (stats.luck || 0);
                if (missionRoll >= 4) {
                    playerGold[playerIndex] += 2500;
                    message = 'Mission successful! Earned 2,500 Gold 🎯';
                    showGoldAnimation(targetCell, 2500);
                } else {
                    stats.health--;
                    message = checkHealth() || 'Mission failed! Lost 1 health ❌';
                }
            } else {
                message = 'Declined the Queen\'s mission 🏃';
            }
            break;

        case 47: // Secret Society
            const societyChoice = prompt(
                'Join Secret Society?\n' +
                'LIGHT: +2 Magic\n' +
                'DARK: +2 Strength\n' +
                'Type LIGHT or DARK:'
            )?.toUpperCase();

            if (societyChoice === 'LIGHT') {
                stats.alignment = 'light';
                stats.magic = (stats.magic || 0) + 2;
                message = 'Joined the Light Society! Magic +2 ✨';
            } else if (societyChoice === 'DARK') {
                stats.alignment = 'dark';
                stats.strength += 2;
                message = 'Joined the Dark Society! Strength +2 ⚔️';
            } else {
                message = 'Declined to join any society 🚶';
            }
            break;

        case 48: // City in Chaos
            const chaosInfo = `Current Status:\nGold: ${playerGold[playerIndex]}\nKarma: ${stats.karma || 0}\n\n`;
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
                    playerGold[playerIndex] += 300;
                    message = 'Helped restore order! Karma +2 and found 300 Gold! 😇';
                    showGoldAnimation(targetCell, 300);
                } else {
                    message = 'Helped restore order! Gained good karma 😇';
                }
            } else if (chaosChoice === 'LOOT') {
                const lootAmount = Math.floor(Math.random() * 500) + 500;
                playerGold[playerIndex] += lootAmount;
                stats.karma = (stats.karma || 0) - 1;
                message = `Looted ${lootAmount} Gold but lost karma 💰😈`;
                showGoldAnimation(targetCell, lootAmount);
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
                const duelRoll = rollDice();
                const totalPower = duelRoll + (stats.strength || 0);
                if (totalPower >= 7) {
                    stats.honor = (stats.honor || 0) + 1;
                    stats.strength += 1;
                    message = 'Victory! Honor +1, Strength +1 ⚔️👑';
                } else {
                    playerPositions[playerIndex] = Math.max(0, playerPositions[playerIndex] - 3);
                    message = 'Lost the duel! Retreated 3 spaces 🏃';
                }
            } else {
                message = 'Declined the duel with the Dark Warrior 🛡️';
            }
            break;

        case 50: // Haunted Castle
            const ghostRoll = rollDice() + (stats.magic || 0);
            if (ghostRoll >= 5) {
                if (stats.hasClue) {
                    stats.hasSecrets = true;
                    message = 'The ghosts reveal ancient secrets about the Golden Crown! 👻📜';
                    const secretAnimation = document.createElement('div');
                    secretAnimation.className = 'map-animation';
                    secretAnimation.innerHTML = '📜';
                    targetCell.appendChild(secretAnimation);
                    setTimeout(() => secretAnimation.remove(), 1000);
                } else {
                    message = 'Survived the haunted castle unscathed 👻';
                }
            } else {
                stats.health--;
                stats.cursed = true;
                message = checkHealth() || 'The ghosts cursed you! Lost 1 health 👻💀';
            }
            break;

        case 51: // Dungeon Trapdoor
            const dungeonChoice = prompt(
                'You fell into a dungeon! 🕳️\n' +
                'EXPLORE: Risk health for treasure\n' +
                'HIDE: Stay safe (Luck helps)\n' +
                'CALL: Get help (Move back)\n' +
                'Type your choice:'
            )?.toUpperCase();

            switch(dungeonChoice) {
                case 'EXPLORE':
                    const dungeonRoll = rollDice() + (stats.luck || 0);
                    if (dungeonRoll >= 4) {
                        playerGold[playerIndex] += 800;
                        message = 'Found hidden treasure! +800 Gold 💰';
                        showGoldAnimation(targetCell, 800);
                    } else {
                        stats.health--;
                        message = checkHealth() || 'Encountered enemies! Lost 1 health ⚔️';
                    }
                    break;
                case 'HIDE':
                    if (stats.luck && stats.luck > 2) {
                        stats.hasAlly = true;
                        message = 'Found a friendly prisoner who becomes your ally! 🤝';
                    } else {
                        message = 'Successfully avoided danger 🛡️';
                    }
                    break;
                default:
                    playerPositions[playerIndex] = Math.max(0, playerPositions[playerIndex] - 2);
                    message = 'Guards heard you! Moved back 2 spaces 👮';
                    break;
            }
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
            const demonInfo = `Current Status:\nGold: ${playerGold[playerIndex]}\nKarma: ${stats.karma || 0}\n\n`;
            if (confirm(demonInfo + 'Accept demon\'s deal?\n2,000 Gold for -2 karma 😈')) {
                playerGold[playerIndex] += 2000;
                stats.karma = (stats.karma || 0) - 2;
                stats.soulBound = true;
                message = 'Accepted demon\'s deal. +2,000 Gold but soul is bound 😈💰';
                showGoldAnimation(targetCell, 2000);
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
                        playerPositions[playerIndex] = Math.max(0, playerPositions[playerIndex] - 4);
                        message = 'Failed to catch thief! Moved back 4 spaces 🏃';
                    }
                    break;
                case 'BRIBE':
                    if (playerGold[playerIndex] >= 300) {
                        playerGold[playerIndex] -= 300;
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
                    setTimeout(() => movePlayer(playerIndex, advance), 500);
                    message = `Your knowledge guided you! Moving forward ${advance} spaces ✨`;
                } else {
                    playerPositions[playerIndex] = Math.max(0, playerPositions[playerIndex] - 5);
                    message = 'Portal sent you backward! Moved back 5 spaces 🌀';
                }
            } else {
                message = 'Wisely avoided the unstable portal 🛡️';
            }
            break;

        case 56: // Final Guardian
            const guardianInfo = `Your Power:\nStrength: ${stats.strength}\nMagic: ${stats.magic || 0}\nMystic Staff: ${stats.hasMysticStaff ? 'Yes' : 'No'}\n\n`;
            
            if (!stats.foughtGuardian) {
                const guardianBattle = stats.strength + (stats.magic || 0) + rollDice();
                if (guardianBattle >= 10 || stats.hasMysticStaff) {
                    stats.foughtGuardian = true;
                    stats.honor = (stats.honor || 0) + 2;
                    message = 'Defeated the Final Guardian! Honor +2 👑⚔️';
                } else {
                    playerPositions[playerIndex] = Math.max(0, playerPositions[playerIndex] - 6);
                    message = 'Guardian overwhelmed you! Moved back 6 spaces 🛡️';
                }
            } else {
                message = 'The Guardian recognizes your previous victory ✨';
            }
            break;

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
                playerGold[playerIndex] += 1000;
                stats.wisdom = (stats.wisdom || 0) + 1;
                message = 'Riddle solved! +1,000 Gold and gained wisdom 📚✨';
                showGoldAnimation(targetCell, 1000);
            } else {
                stats.health--;
                message = checkHealth() || 'Wrong answer! Lost 1 health ❌';
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
                        message = checkHealth() || 'Failed to sneak! Lost 1 health 👀';
                    }
                    break;
                case 'BARGAIN':
                    if (playerGold[playerIndex] >= 1000) {
                        playerGold[playerIndex] -= 1000;
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
            const crownInfo = `Status:\nAlignment: ${stats.alignment || 'neutral'}\nKarma: ${stats.karma || 0}\nGold: ${playerGold[playerIndex]}\n\n`;
            
            if (stats.alignment === 'light' && stats.karma > 0) {
                message = 'Your pure heart lifts the curse! Crown is yours! 👑✨';
                stats.hasCrown = true;
                const crownAnimation = document.createElement('div');
                crownAnimation.className = 'map-animation';
                crownAnimation.innerHTML = '👑';
                targetCell.appendChild(crownAnimation);
                setTimeout(() => crownAnimation.remove(), 1000);
            } else if (playerGold[playerIndex] >= 5000 && 
                      confirm(crownInfo + 'Pay 5,000 Gold to lift the curse? 👑')) {
                playerGold[playerIndex] -= 5000;
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
                playerGold[playerIndex] += 5000;
                message = '🎉 VICTORY! You are worthy! +5,000 Gold';
                showGoldAnimation(targetCell, 5000);
                setTimeout(() => {
                    alert(`Congratulations Player ${playerIndex + 1}!\n` +
                          `Total Gold: ${playerGold[playerIndex]}\n` +
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
                playerGold[playerIndex] += 10000;
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
                gold: playerGold[playerIndex],
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
    }

    // Only check health at the end if we modified health in this event
    const healthModifyingGrids = [4, 19, 21]; // Add all grids that modify health
    if (healthModifyingGrids.includes(gridNumber)) {
        const healthCheck = checkHealth();
        if (healthCheck) {
            message = healthCheck;
        }
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
