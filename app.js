document.addEventListener('DOMContentLoaded', () => {
    // Add table dimension constants at the top
    const BOARD_SIZE = 8;
    const TOTAL_CELLS = BOARD_SIZE * BOARD_SIZE;

    // Check if player count exists
    const playerCount = localStorage.getItem('playerCount');
    if (!playerCount) {
        window.location.href = 'index.html';
        return;
    }

    // Initialize player indicators
    const playerIndicators = document.getElementById('playerIndicators');
    let currentPlayer = 1;
    
    // Add gold tracking
    const playerGold = new Array(Number(playerCount)).fill(0);

    // Add player stats tracking
    const playerStats = Array(Number(playerCount)).fill().map(() => ({
        health: 3,
        strength: Math.floor(Math.random() * 5) + 1, // Random strength 1-5
        potions: 0,
        hasMap: false
    }));

    function rollDice() {
        return Math.floor(Math.random() * 6) + 1;
    }

    function updatePlayerStats(playerIndex) {
        const wrapper = document.querySelectorAll('#playerIndicators > div')[playerIndex];
        const stats = playerStats[playerIndex];
        const goldDisplay = wrapper.querySelector('.gold-display');
        goldDisplay.textContent = `${playerGold[playerIndex]} Gold | ❤️${stats.health} | 💪${stats.strength} | 🧪${stats.potions}`;
    }

    // Update player indicator creation first
    for (let i = 1; i <= playerCount; i++) {
        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.alignItems = 'center';
        
        const indicator = document.createElement('div');
        indicator.className = `player-indicator ${i === 1 ? 'active' : ''}`;
        indicator.textContent = `Player ${i}`;
        
        const goldDisplay = document.createElement('div');
        goldDisplay.className = 'gold-display';
        goldDisplay.textContent = '0 Gold';
        
        wrapper.appendChild(indicator);
        wrapper.appendChild(goldDisplay);
        playerIndicators.appendChild(wrapper);
    }

    // Then initialize player stats displays
    for (let i = 0; i < playerCount; i++) {
        updatePlayerStats(i);
    }

    const table = document.getElementById('gameTable');
    const magnifier = document.getElementById('magnifier');
    
    // Array of available image names
    const imageNames = Array.from({length: TOTAL_CELLS}, (_, i) => `${i + 1}.jpeg`);

    // Load images in batches
    const batchSize = 8; // Load 8 images at a time
    let currentBatch = 0;

    // Validate table structure
    function validateTableStructure() {
        if (!table || !table.rows) {
            console.error('Table not found');
            return false;
        }

        if (table.rows.length !== BOARD_SIZE) {
            console.error(`Invalid number of rows: ${table.rows.length}, expected ${BOARD_SIZE}`);
            return false;
        }

        for (let i = 0; i < table.rows.length; i++) {
            if (table.rows[i].cells.length !== BOARD_SIZE) {
                console.error(`Invalid number of cells in row ${i}: ${table.rows[i].cells.length}, expected ${BOARD_SIZE}`);
                return false;
            }
        }

        return true;
    }

    // Validate table structure before proceeding
    if (!validateTableStructure()) {
        alert('Game board initialization error. Please refresh the page.');
        return;
    }

    function loadImageBatch() {
        const start = currentBatch * batchSize;
        const end = Math.min(start + batchSize, TOTAL_CELLS);

        for (let i = start; i < end; i++) {
            const row = Math.floor(i / BOARD_SIZE);
            const col = i % BOARD_SIZE;
            
            const tableRow = table.rows[row];
            if (!tableRow) {
                console.error(`Row ${row} not found`);
                continue;
            }
            
            const cell = tableRow.cells[col];
            if (!cell) {
                console.error(`Cell ${col} in row ${row} not found`);
                continue;
            }

            // Create image element
            const img = document.createElement('img');
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            
            // Set correct image path
            const imagePath = `/home/socheat/Documents/Github/No-Cheat/Adventure/images/${imageNames[i]}`;
            img.dataset.src = imagePath;
            img.alt = `Event ${i + 1}`;
            
            // Add error handling for images
            img.onerror = () => {
                console.error(`Failed to load image: ${imagePath}`);
                img.style.backgroundColor = '#ccc'; // Fallback background color
            };

            cell.appendChild(img);

            // Load image immediately instead of using IntersectionObserver
            img.src = imagePath;
        }

        currentBatch++;
        if (currentBatch * batchSize < TOTAL_CELLS) {
            setTimeout(loadImageBatch, 100);
        }
    }

    // Start loading first batch
    loadImageBatch();

    // Optimize magnifier effect
    let isMoving = false;
    let rafId = null;

    function updateMagnifier(e, img) {
        const rect = img.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Calculate relative position within the image
        const xPercent = Math.max(0, Math.min(100, (x / rect.width) * 100));
        const yPercent = Math.max(0, Math.min(100, (y / rect.height) * 100));
        
        // Position the magnifier at bottom right of cursor
        const magWidth = magnifier.offsetWidth;
        const magHeight = magnifier.offsetHeight;
        const offsetX = 10; // Gap between cursor and magnifier
        const offsetY = 10;
        
        // Calculate position ensuring magnifier stays within viewport
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let left = e.pageX + offsetX;
        let top = e.pageY + offsetY;
        
        // Adjust position if magnifier would go outside viewport
        if (left + magWidth > viewportWidth) {
            left = e.pageX - magWidth - offsetX;
        }
        if (top + magHeight > viewportHeight) {
            top = e.pageY - magHeight - offsetY;
        }
        
        magnifier.style.display = 'block';
        magnifier.style.left = `${left}px`;
        magnifier.style.top = `${top}px`;
        
        // Use the actual image source for higher quality zoom
        const imgSrc = img.dataset.src || img.src;
        if (imgSrc.includes('data:image')) {
            magnifier.style.display = 'none';
            return;
        }
        
        magnifier.style.backgroundImage = `url(${imgSrc})`;
        magnifier.style.backgroundSize = '300%'; // Reduced from 400%
        magnifier.style.backgroundPosition = `${xPercent}% ${yPercent}%`;
    }

    // Optimize mousemove performance with debounce
    let timeout;

    // Remove the old mousemove event listeners and consolidate into one
    let isMagnifierEnabled = false;  // Changed from true to false
    const magnifyToggle = document.getElementById('magnifyToggle');

    // Add initial class to show disabled state
    magnifyToggle.classList.add('active');  // Add this line

    magnifyToggle.addEventListener('click', () => {
        isMagnifierEnabled = !isMagnifierEnabled;
        magnifyToggle.classList.toggle('active');
        magnifier.style.display = 'none';
    });

    // Single mousemove event listener
    table.addEventListener('mousemove', e => {
        if (!isMagnifierEnabled) {
            magnifier.style.display = 'none';
            return;
        }

        const img = e.target.closest('img');
        if (!img || img.src.includes('data:image')) {
            magnifier.style.display = 'none';
            return;
        }

        clearTimeout(timeout);
        timeout = setTimeout(() => {
            updateMagnifier(e, img);
        }, 10);
    });

    // Update mouseleave event
    table.addEventListener('mouseleave', () => {
        magnifier.style.display = 'none';
        isMoving = false;
    });

    // Add turn handling
    function nextTurn() {
        const indicators = document.querySelectorAll('.player-indicator');
        indicators[currentPlayer - 1].classList.remove('active');
        currentPlayer = currentPlayer % playerCount + 1;
        indicators[currentPlayer - 1].classList.add('active');
    }

    // Add player position tracking - start at position 0 instead of 1
    const playerPositions = new Array(Number(playerCount)).fill(0);

    // Get player icons from localStorage
    const playerIcons = JSON.parse(localStorage.getItem('playerIcons') || '[]');

    // Create player tokens with selected icons but don't place them yet
    const playerTokens = [];
    const tokensContainer = document.createElement('div');
    tokensContainer.style.display = 'flex'; // Change to flex instead of none
    tokensContainer.style.position = 'absolute';
    tokensContainer.style.left = '-100px'; // Position container to the left of the board
    tokensContainer.style.top = '50%';
    tokensContainer.style.transform = 'translateY(-50%)';
    tokensContainer.style.flexDirection = 'column';
    tokensContainer.style.gap = '10px';
    document.querySelector('.table-container').appendChild(tokensContainer); // Append to table container instead of body

    for (let i = 0; i < playerCount; i++) {
        const token = document.createElement('div');
        token.className = `player-token player${i + 1}`;
        token.innerHTML = `<i class="${playerIcons[i] || 'fas fa-user'}"></i>`;
        playerTokens.push(token);
        tokensContainer.appendChild(token);
    }

    // Add cell occupancy tracking
    const cellOccupancy = new Array(TOTAL_CELLS).fill(0);

    function updateGoldDisplay(playerIndex) {
        const wrapper = document.querySelectorAll('#playerIndicators > div')[playerIndex];
        const goldDisplay = wrapper.querySelector('.gold-display');
        goldDisplay.textContent = `${playerGold[playerIndex]} Gold`;
        goldDisplay.classList.add('gold-flash');
        setTimeout(() => goldDisplay.classList.remove('gold-flash'), 500);
    }

    function showGoldAnimation(cell, amount) {
        const rect = cell.getBoundingClientRect();
        const animation = document.createElement('div');
        animation.className = 'gold-animation';
        animation.textContent = `+${amount} Gold!`;
        animation.style.left = `${rect.left + rect.width/2}px`;
        animation.style.top = `${rect.top + rect.height/2}px`;
        document.body.appendChild(animation);
        
        animation.addEventListener('animationend', () => animation.remove());
    }

    function showEventMessage(message) {
        const messageBox = document.getElementById('eventMessageBox');
        if (!messageBox) {
            console.error('Message box element not found!');
            return;
        }
        
        // Make sure the message box is visible
        messageBox.style.display = 'flex';
        messageBox.textContent = message;
        
        // Add highlight effect
        messageBox.classList.add('highlight');
        setTimeout(() => {
            messageBox.classList.remove('highlight');
        }, 500);
    }

    function handleColumnEvent(playerIndex, col, targetCell) {
        const stats = playerStats[playerIndex];
        let message = '';
        
        // Add event logging header
        console.log(`\n🎲 Event triggered for Player ${playerIndex + 1} at position ${col + 1}:`);
        console.log('Current Stats:', {
            health: stats.health,
            strength: stats.strength,
            gold: playerGold[playerIndex],
            potions: stats.potions,
            magic: stats.magic || 0,
            karma: stats.karma || 0
        });

        switch(col + 1) { // Convert to 1-based column numbers
            case 1: // Gold column
                playerGold[playerIndex] += 50;
                message = 'Found 50 gold!';
                showGoldAnimation(targetCell, 50);
                break;

            case 2: // Secret map
                if (!stats.hasMap) {
                    stats.hasMap = true;
                    message = 'Found a secret map!';
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
                } else {
                    stats.health--;
                    message = 'Lost 1 health!';
                    if (stats.health <= 0) {
                        playerPositions[playerIndex] = 0; // Back to start
                        message = 'Lost all health! Back to start.';
                    }
                }
                break;

            case 5: // Receive potion
                stats.potions++;
                message = 'Received a health potion!';
                break;

            case 6: // Gambling
                const playerRoll = rollDice();
                const houseRoll = rollDice();
                message = `You rolled ${playerRoll}, house rolled ${houseRoll}. `;
                if (playerRoll > houseRoll) {
                    playerGold[playerIndex] += 200;
                    message += 'Won 200 gold!';
                    showGoldAnimation(targetCell, 200);
                } else {
                    playerGold[playerIndex] = Math.max(0, playerGold[playerIndex] - 100);
                    message += 'Lost 100 gold!';
                }
                break;

            case 7: // Trap
                playerGold[playerIndex] = Math.max(0, playerGold[playerIndex] - 50);
                message = 'Fell into a trap! Lost 50 gold.';
                break;

            case 8: // Bridge collapse
                playerPositions[playerIndex] = 0;
                message = 'Bridge collapsed! Back to start.';
                break;

            case 9: // Secret spell
                stats.magic += 1;
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

            case 17: // Lost in forest
                stats.turns = Math.max(0, (stats.turns || 0) - 1);
                message = 'Lost in the forest! Skip 1 turn';
                break;

            case 18: // Snake encounter
                if (confirm('A snake appears! Do you want to fight it? (OK to fight, Cancel to run)')) {
                    if (stats.strength > 4) {
                        message = 'You defeated the snake with your strength!';
                    } else {
                        stats.health--;
                        message = 'The snake bit you! Lost 1 health';
                        if (stats.health <= 0) {
                            playerPositions[playerIndex] = 0;
                            message = 'You lost all health! Back to start.';
                        }
                    }
                } else {
                    stats.health--;
                    message = 'You ran but got bit! Lost 1 health';
                }
                break;

            case 20: // Treasure chest
                const lootType = Math.floor(Math.random() * 3);
                switch(lootType) {
                    case 0:
                        const goldAmount = Math.floor(Math.random() * 300) + 100;
                        playerGold[playerIndex] += goldAmount;
                        message = `Found ${goldAmount} gold in the chest!`;
                        showGoldAnimation(targetCell, goldAmount);
                        break;
                    case 1:
                        stats.potions += 2;
                        message = 'Found 2 health potions in the chest!';
                        break;
                    case 2:
                        stats.strength += 1;
                        message = 'Found a weapon! Strength +1';
                        break;
                }
                break;

            case 21: // Pit Trap
                stats.turns = Math.max(0, (stats.turns || 0) - 1);
                message = 'You fell into a pit trap! Lose 1 turn';
                break;

            case 22: // Sorcerer's Deal
                if (playerGold[playerIndex] >= 500 && confirm('The Sorcerer offers +3 Magic for 500 Gold. Accept?')) {
                    playerGold[playerIndex] -= 500;
                    stats.magic = (stats.magic || 0) + 3;
                    message = 'You gained +3 Magic from the Sorcerer!';
                } else {
                    message = 'You declined the Sorcerer\'s offer';
                }
                break;

            case 23: // Help village
                stats.hasAlly = true;
                message = 'You gained a loyal ally from the village!';
                break;

            case 24: // Magic Ring
                stats.hasRing = true;
                message = 'You found a magic ring! Use it to skip a turn later';
                break;

            case 25: // Cross the river
                if (stats.strength >= 5) {
                    message = 'You crossed the river safely!';
                } else {
                    stats.turns = Math.max(0, (stats.turns || 0) - 1);
                    message = 'Too weak to cross! Lost 1 turn struggling';
                }
                break;

            case 26: // Rescue traveler
                playerGold[playerIndex] += 400;
                message = 'Rescued a trapped traveler! Gained 400 Gold';
                showGoldAnimation(targetCell, 400);
                break;

            case 27: // Mysterious Fog
                stats.turns = Math.max(0, (stats.turns || 0) - 1);
                message = 'Lost in mysterious fog! Skip 1 turn';
                break;

            case 28: // Abandoned ship
                const shipLoot = Math.floor(Math.random() * 400);
                if (shipLoot > 0) {
                    playerGold[playerIndex] += shipLoot;
                    message = `Found ${shipLoot} Gold on the abandoned ship!`;
                    showGoldAnimation(targetCell, shipLoot);
                } else {
                    message = 'The abandoned ship was empty...';
                }
                break;

            case 29: // Dragon encounter
                const dragonChoice = prompt('Dragon blocks your path!\nType: FIGHT, BRIBE, or RUN');
                switch(dragonChoice?.toUpperCase()) {
                    case 'FIGHT':
                        if (stats.strength >= 6 || stats.hasAlly) {
                            message = stats.hasAlly ? 
                                'You and your ally defeated the dragon!' :
                                'You defeated the dragon with your strength!';
                        } else {
                            playerPositions[playerIndex] = 0;
                            message = 'The dragon was too powerful! Back to start';
                        }
                        break;
                    case 'BRIBE':
                        if (playerGold[playerIndex] >= 500) {
                            playerGold[playerIndex] -= 500;
                            message = 'Paid 500 Gold to appease the dragon';
                        } else {
                            playerPositions[playerIndex] = 0;
                            message = 'Not enough gold to bribe! Back to start';
                        }
                        break;
                    default: // RUN or invalid input
                        playerPositions[playerIndex] = Math.max(0, playerPositions[playerIndex] - 3);
                        message = 'Ran away! Moved back 3 spaces';
                        break;
                }
                break;

            case 30: // Cursed Temple
                if (confirm('Risk losing 1 Health for 1,000 Gold?')) {
                    playerGold[playerIndex] += 1000;
                    stats.health--;
                    message = 'Gained 1,000 Gold but lost 1 Health!';
                    showGoldAnimation(targetCell, 1000);
                    if (stats.health <= 0) {
                        playerPositions[playerIndex] = 0;
                        message += ' Lost all health! Back to start';
                    }
                } else {
                    message = 'Wisely avoided the cursed temple';
                }
                break;

            case 31: // Fairy Blessing
                stats.health++;
                message = 'A fairy blessed you! Gained 1 extra life ❤️';
                break;

            case 32: // Strange noises
                if (Math.random() < 0.5) {
                    message = 'Strange noises in the night... but nothing happened';
                } else {
                    stats.health--;
                    message = 'Surprise attack in the night! Lost 1 health';
                    if (stats.health <= 0) {
                        playerPositions[playerIndex] = 0;
                        message += ' Back to start!';
                    }
                }
                break;

            case 33: // City of Gold
                const goldBonus = Math.floor(Math.random() * 300) + 200;
                playerGold[playerIndex] += goldBonus;
                message = `Welcome to the City of Gold! Found ${goldBonus} gold!`;
                showGoldAnimation(targetCell, goldBonus);
                break;

            case 34: // Luck Potion
                if (playerGold[playerIndex] >= 500 && confirm('Buy luck potion for 500 Gold?')) {
                    playerGold[playerIndex] -= 500;
                    stats.luck = (stats.luck || 0) + 2;
                    message = 'Bought a luck potion! Luck +2';
                } else {
                    message = 'Declined to buy the luck potion';
                }
                break;

            case 35: // Pickpocket
                const dexRoll = rollDice();
                if (dexRoll >= 5) {
                    message = `Rolled ${dexRoll}! Caught the pickpocket!`;
                } else {
                    const stolenAmount = Math.min(300, playerGold[playerIndex]);
                    playerGold[playerIndex] -= stolenAmount;
                    message = `Rolled ${dexRoll}! Pickpocket stole ${stolenAmount} gold!`;
                }
                break;

            case 36: // Noble's job
                playerGold[playerIndex] += 800;
                message = 'Completed a job for a noble! Earned 800 Gold';
                showGoldAnimation(targetCell, 800);
                break;

            case 37: // Buy house
                if (playerGold[playerIndex] >= 1000 && confirm('Invest 1000 Gold in a house?')) {
                    playerGold[playerIndex] -= 1000;
                    stats.hasHouse = true;
                    message = 'Invested in a house! It might pay off later';
                } else {
                    message = 'Declined to invest in property';
                }
                break;

            case 38: // Dangerous mission
                if (confirm('Accept dangerous mission for 2,000 Gold?')) {
                    if (stats.strength >= 5 || stats.hasAlly) {
                        playerGold[playerIndex] += 2000;
                        message = 'Mission successful! Earned 2,000 Gold';
                        showGoldAnimation(targetCell, 2000);
                    } else {
                        stats.health--;
                        message = 'Mission failed! Lost 1 health';
                        if (stats.health <= 0) {
                            playerPositions[playerIndex] = 0;
                            message += ' Back to start!';
                        }
                    }
                } else {
                    message = 'Declined the dangerous mission';
                }
                break;

            case 39: // Guards arrest
                const guardChoice = prompt('Guards are arresting you!\nType PAY to pay 500 Gold or FIGHT to resist');
                if (guardChoice?.toUpperCase() === 'PAY' && playerGold[playerIndex] >= 500) {
                    playerGold[playerIndex] -= 500;
                    message = 'Paid the guards 500 Gold to avoid arrest';
                } else if (guardChoice?.toUpperCase() === 'FIGHT') {
                    if (stats.strength >= 5) {
                        message = 'Successfully fought off the guards!';
                    } else {
                        playerPositions[playerIndex] = Math.max(0, playerPositions[playerIndex] - 5);
                        message = 'Lost the fight! Moved back 5 spaces';
                    }
                } else {
                    playerPositions[playerIndex] = 0;
                    message = 'Arrested! Back to start';
                }
                break;

            case 40: // Arena Battle
                const battleRoll = rollDice();
                if (battleRoll + (stats.strength || 0) >= 6) {
                    playerGold[playerIndex] += 1500;
                    message = `Rolled ${battleRoll}! Won the arena battle! +1,500 Gold`;
                    showGoldAnimation(targetCell, 1500);
                } else {
                    stats.health--;
                    message = `Rolled ${battleRoll}! Lost the arena battle! -1 Health`;
                    if (stats.health <= 0) {
                        playerPositions[playerIndex] = 0;
                        message += ' Back to start!';
                    }
                }
                break;

            case 41: // Secret treasure room
                playerGold[playerIndex] += 1000;
                message = 'Found a secret treasure room! +1,000 Gold';
                showGoldAnimation(targetCell, 1000);
                break;

            case 42: // Clue to final goal
                stats.hasClue = true;
                message = 'Found a clue about the Golden Crown! Future choices will be clearer';
                break;

            case 43: // Crime Lord's deal
                if (confirm('Accept Crime Lord\'s deal? (1,000 Gold but gain bad karma)')) {
                    playerGold[playerIndex] += 1000;
                    stats.karma = (stats.karma || 0) - 2;
                    message = 'Gained 1,000 Gold but your reputation suffers';
                    showGoldAnimation(targetCell, 1000);
                } else {
                    stats.karma = (stats.karma || 0) + 1;
                    message = 'Refused the Crime Lord. Gained good karma';
                }
                break;

            case 44: // Wizard's teleport
                const oldPos = playerPositions[playerIndex];
                const newPos = Math.min(oldPos + 10, TOTAL_CELLS - 1);
                playerPositions[playerIndex] = newPos;
                message = 'Wizard teleported you forward 10 steps!';
                // Move token to new position
                setTimeout(() => movePlayer(playerIndex, newPos - oldPos), 500);
                break;

            case 45: // Royal Feast
                stats.health++;
                message = 'Attended a Royal Feast! Gained 1 Health';
                break;

            case 46: // Queen's Secret Mission
                if (confirm('Accept Queen\'s secret mission? (Risk health for 2,500 Gold)')) {
                    const missionRoll = rollDice();
                    if (missionRoll + (stats.luck || 0) >= 4) {
                        playerGold[playerIndex] += 2500;
                        message = 'Mission successful! Earned 2,500 Gold';
                        showGoldAnimation(targetCell, 2500);
                    } else {
                        stats.health--;
                        message = 'Mission failed! Lost 1 health';
                        if (stats.health <= 0) {
                            playerPositions[playerIndex] = 0;
                            message += ' Back to start!';
                        }
                    }
                } else {
                    message = 'Declined the Queen\'s mission';
                }
                break;

            case 47: // Secret Society
                const societyChoice = prompt('Join Secret Society?\nType: LIGHT or DARK').toUpperCase();
                if (societyChoice === 'LIGHT') {
                    stats.alignment = 'light';
                    stats.magic = (stats.magic || 0) + 2;
                    message = 'Joined the Light Society! Magic +2';
                } else if (societyChoice === 'DARK') {
                    stats.alignment = 'dark';
                    stats.strength += 2;
                    message = 'Joined the Dark Society! Strength +2';
                } else {
                    message = 'Declined to join any society';
                }
                break;

            case 48: // City in Chaos
                const chaosChoice = prompt('City is in chaos!\nType: HELP or LOOT').toUpperCase();
                if (chaosChoice === 'HELP') {
                    stats.karma = (stats.karma || 0) + 2;
                    message = 'Helped restore order! Gained good karma';
                } else if (chaosChoice === 'LOOT') {
                    const lootAmount = Math.floor(Math.random() * 500) + 500;
                    playerGold[playerIndex] += lootAmount;
                    stats.karma = (stats.karma || 0) - 1;
                    message = `Looted ${lootAmount} Gold but lost karma`;
                    showGoldAnimation(targetCell, lootAmount);
                } else {
                    message = 'Fled the chaos';
                }
                break;

            case 49: // Dark Warrior
                const warriorChoice = confirm('Dark Warrior challenges you!\nAccept duel?');
                if (warriorChoice) {
                    const duelRoll = rollDice();
                    if (duelRoll + (stats.strength || 0) >= 7) {
                        stats.honor = (stats.honor || 0) + 1;
                        stats.strength += 1;
                        message = 'Victory! Gained honor and strength';
                    } else {
                        playerPositions[playerIndex] = Math.max(0, playerPositions[playerIndex] - 3);
                        message = 'Lost the duel! Retreated 3 spaces';
                    }
                } else {
                    message = 'Declined the duel';
                }
                break;

            case 50: // Haunted Castle
                const ghostRoll = rollDice();
                if (ghostRoll + (stats.luck || 0) >= 5) {
                    if (stats.hasClue) {
                        message = 'The ghosts reveal ancient secrets about the Golden Crown!';
                        stats.hasSecrets = true;
                    } else {
                        message = 'Survived the haunted castle unscathed';
                    }
                } else {
                    stats.health--;
                    stats.cursed = true;
                    message = 'The ghosts cursed you! Lost 1 health';
                    if (stats.health <= 0) {
                        playerPositions[playerIndex] = 0;
                        message += ' Back to start!';
                    }
                }
                break;

            case 51: // Dungeon Trapdoor
                const dungeonChoice = prompt('You fell into a dungeon!\nType: EXPLORE, HIDE, or CALL for help');
                switch(dungeonChoice?.toUpperCase()) {
                    case 'EXPLORE':
                        const dungeonRoll = rollDice();
                        if (dungeonRoll >= 4) {
                            playerGold[playerIndex] += 800;
                            message = 'Found hidden treasure! +800 Gold';
                            showGoldAnimation(targetCell, 800);
                        } else {
                            stats.health--;
                            message = 'Encountered enemies! Lost 1 health';
                        }
                        break;
                    case 'HIDE':
                        if (stats.luck && stats.luck > 2) {
                            stats.hasAlly = true;
                            message = 'Found a friendly prisoner who becomes your ally!';
                        } else {
                            message = 'Successfully avoided danger';
                        }
                        break;
                    default: // CALL or invalid
                        playerPositions[playerIndex] = Math.max(0, playerPositions[playerIndex] - 2);
                        message = 'Guards heard you! Moved back 2 spaces';
                        break;
                }
                break;

            case 52: // Mystic Staff
                stats.magic = (stats.magic || 0) + 3;
                stats.hasMysticStaff = true;
                message = 'Found the Mystic Staff! Magic +3';
                if (stats.alignment === 'light') {
                    stats.magic++;
                    message += ' Light alignment bonus: Magic +1';
                }
                break;

            case 53: // Demon's Deal
                if (confirm('Accept demon\'s deal? (2,000 Gold for -2 karma)')) {
                    playerGold[playerIndex] += 2000;
                    stats.karma = (stats.karma || 0) - 2;
                    stats.soulBound = true;
                    message = 'Accepted demon\'s deal. +2,000 Gold but soul is bound';
                    showGoldAnimation(targetCell, 2000);
                } else if (stats.alignment === 'light') {
                    message = 'Rejected demon. Light alignment rewarded with +1 strength';
                    stats.strength++;
                } else {
                    message = 'Rejected demon\'s offer';
                }
                break;

            case 54: // Rival Chase
                const chaseChoice = prompt('Your map was stolen!\nType: CHASE, BRIBE, or CONTINUE');
                switch(chaseChoice?.toUpperCase()) {
                    case 'CHASE':
                        if (stats.strength >= 4) {
                            stats.hasMap = true;
                            stats.strength++;
                            message = 'Caught the thief! Recovered map and gained strength';
                        } else {
                            playerPositions[playerIndex] = Math.max(0, playerPositions[playerIndex] - 4);
                            message = 'Failed to catch thief! Moved back 4 spaces';
                        }
                        break;
                    case 'BRIBE':
                        if (playerGold[playerIndex] >= 300) {
                            playerGold[playerIndex] -= 300;
                            stats.hasMap = true;
                            stats.hasAlly = true;
                            message = 'Paid thief 300 Gold. They become your ally!';
                        } else {
                            message = 'Not enough gold to bribe';
                        }
                        break;
                    default:
                        stats.hasMap = false;
                        message = 'Continued without the map';
                        break;
                }
                break;

            case 55: // Mysterious Portal
                const portalChoice = confirm('Enter the mysterious portal?');
                if (portalChoice) {
                    if (stats.hasClue || stats.hasSecrets) {
                        const advance = Math.floor(Math.random() * 6) + 3;
                        setTimeout(() => movePlayer(playerIndex, advance), 500);
                        message = 'Your knowledge guided you! Moving forward';
                    } else {
                        playerPositions[playerIndex] = Math.max(0, playerPositions[playerIndex] - 5);
                        message = 'Portal sent you backward! Moved back 5 spaces';
                    }
                } else {
                    message = 'Wisely avoided the unstable portal';
                }
                break;

            case 56: // Final Guardian
                if (!stats.foughtGuardian) {
                    const guardianBattle = stats.strength + (stats.magic || 0) + rollDice();
                    if (guardianBattle >= 10 || stats.hasMysticStaff) {
                        stats.foughtGuardian = true;
                        stats.honor = (stats.honor || 0) + 2;
                        message = 'Defeated the Final Guardian! Honor increased';
                    } else {
                        playerPositions[playerIndex] = Math.max(0, playerPositions[playerIndex] - 6);
                        message = 'Guardian overwhelmed you! Moved back 6 spaces';
                    }
                } else {
                    message = 'The Guardian recognizes your previous victory';
                }
                break;

            case 57: // Sacred Chamber
                const riddle = prompt('Answer the riddle:\nI have cities, but no houses.\nI have mountains, but no trees.\nI have water, but no fish.\nI have roads, but no cars.\nWhat am I?');
                if (riddle?.toLowerCase() === 'map') {
                    playerGold[playerIndex] += 1000;
                    stats.wisdom = (stats.wisdom || 0) + 1;
                    message = 'Riddle solved! +1,000 Gold and wisdom gained';
                    showGoldAnimation(targetCell, 1000);
                } else {
                    stats.health--;
                    message = 'Wrong answer! Lost 1 health';
                }
                break;

            case 58: // Titan Battle
                const titanChoice = prompt('A titan appears!\nType: FIGHT, SNEAK, or BARGAIN');
                switch(titanChoice?.toUpperCase()) {
                    case 'FIGHT':
                        if (stats.strength >= 8 || stats.hasMysticStaff) {
                            stats.strength += 2;
                            message = 'Defeated the titan! Strength +2';
                        } else {
                            playerPositions[playerIndex] = 0;
                            message = 'The titan was too powerful! Back to start';
                        }
                        break;
                    case 'SNEAK':
                        if (stats.hasMap || stats.luck >= 3) {
                            setTimeout(() => movePlayer(playerIndex, 2), 500);
                            message = 'Successfully snuck past! Moving forward';
                        } else {
                            stats.health--;
                            message = 'Failed to sneak! Lost 1 health';
                        }
                        break;
                    case 'BARGAIN':
                        if (playerGold[playerIndex] >= 1000) {
                            playerGold[playerIndex] -= 1000;
                            stats.titanAlly = true;
                            message = 'The titan becomes your ally! Paid 1,000 Gold';
                        } else {
                            message = 'Not enough gold to bargain';
                        }
                        break;
                }
                break;

            case 59: // Cursed Crown
                if (stats.alignment === 'light' && stats.karma > 0) {
                    message = 'Your pure heart lifts the curse! Crown is yours!';
                    stats.hasCrown = true;
                } else if (playerGold[playerIndex] >= 5000) {
                    const choice = confirm('Pay 5,000 Gold to lift the curse?');
                    if (choice) {
                        playerGold[playerIndex] -= 5000;
                        stats.hasCrown = true;
                        message = 'Paid to lift the curse! Crown is yours!';
                    } else {
                        stats.cursed = true;
                        message = 'Took the cursed crown... consequences await';
                    }
                } else {
                    stats.cursed = true;
                    message = 'Cannot lift curse! Beware the consequences...';
                }
                break;

            case 60: // Final Trial
                const finalPower = stats.strength + (stats.magic || 0) + 
                                 (stats.honor || 0) + (stats.wisdom || 0) +
                                 (stats.hasAlly ? 2 : 0) + 
                                 (stats.titanAlly ? 3 : 0) +
                                 (stats.hasMysticStaff ? 2 : 0) -
                                 (stats.cursed ? 4 : 0);
                
                if (finalPower >= 15) {
                    playerGold[playerIndex] += 5000;
                    message = 'VICTORY! You are worthy! +5,000 Gold';
                    showGoldAnimation(targetCell, 5000);
                    setTimeout(() => {
                        alert(`Congratulations Player ${playerIndex + 1}!\nTotal Gold: ${playerGold[playerIndex]}\nFinal Power: ${finalPower}`);
                    }, 1000);
                } else {
                    playerPositions[playerIndex] = Math.max(0, playerPositions[playerIndex] - 10);
                    message = 'Not yet worthy! Final trial failed';
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

                const bossFight = confirm('Face the Ultimate Boss?\nThis battle will test everything you\'ve gained!');
                if (bossFight) {
                    const battleRoll = rollDice() + rollDice(); // Two dice for epic battle
                    const finalPower = totalPower + battleRoll;
                    
                    if (finalPower >= 20) {
                        stats.legendaryVictor = true;
                        stats.strength += 3;
                        stats.magic = (stats.magic || 0) + 3;
                        message = `Epic victory! (Power: ${finalPower}) You've become legendary!`;
                    } else {
                        playerPositions[playerIndex] = Math.max(0, playerPositions[playerIndex] - 10);
                        stats.health = Math.max(1, stats.health - 2);
                        message = `Defeated! (Power: ${finalPower}) Not yet strong enough...`;
                    }
                } else {
                    playerPositions[playerIndex] = Math.max(0, playerPositions[playerIndex] - 5);
                    message = 'Retreated from the ultimate battle';
                }
                break;

            case 62: // Breaking the Curse
                if (stats.legendaryVictor) {
                    stats.cursed = false;
                    stats.isCrowned = true;
                    playerGold[playerIndex] += 10000;
                    message = '🎉 The curse is broken! You are crowned as the new ruler!';
                    showGoldAnimation(targetCell, 10000);
                    setTimeout(() => {
                        alert('The kingdom celebrates your coronation! 👑');
                    }, 1000);
                } else {
                    message = 'You must prove yourself in the ultimate battle first!';
                    playerPositions[playerIndex] = Math.max(0, playerPositions[playerIndex] - 1);
                }
                break;

            case 63: // Ruler's Choice
                if (stats.isCrowned) {
                    const choice = prompt('How will you rule the kingdom?\nType: WISDOM, POWER, or BALANCE').toUpperCase();
                    switch(choice) {
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
                            message = 'You rule with perfect balance of wisdom and strength! ☯️👑';
                            break;
                        default:
                            message = 'Your uncertain rule leads to challenges...';
                    }
                } else {
                    message = 'You must be crowned to make this choice!';
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

                message = '🎉 Congratulations! You\'ve completed the adventure!';
                setTimeout(() => {
                    const endingMessages = {
                        wise: 'Your wisdom brings a golden age of peace and prosperity!',
                        powerful: 'Your strength ensures security and expansion!',
                        balanced: 'Your balanced rule creates a perfect harmony!',
                        unknown: 'Your legacy remains to be written...'
                    };

                    alert(`🏆 Adventure Complete!\n\n` +
                          `Final Gold: ${finalStats.gold}\n` +
                          `Strength: ${finalStats.strength}\n` +
                          `Magic: ${finalStats.magic}\n` +
                          `Karma: ${finalStats.karma}\n\n` +
                          `${endingMessages[finalStats.ending]}`);
                }, 1000);
                break;
        }

        if (message) {
            // Log the event outcome
            console.log('📢 Event Result:', message);
            console.log('Updated Stats:', {
                health: stats.health,
                strength: stats.strength,
                gold: playerGold[playerIndex],
                potions: stats.potions,
                magic: stats.magic || 0,
                karma: stats.karma || 0
            });
            console.log('------------------------');

            updatePlayerStats(playerIndex);
            updateGoldDisplay(playerIndex);
            setTimeout(() => showEventMessage(message), 100);
        }
    }

    function movePlayer(playerIndex, diceResult) {
        // Validate inputs
        if (playerIndex < 0 || playerIndex >= playerCount) {
            console.error('Invalid player index:', playerIndex);
            return false;
        }

        if (diceResult < 1 || diceResult > 6) {
            console.error('Invalid dice result:', diceResult);
            return false;
        }

        const currentPos = playerPositions[playerIndex];
        const remainingSteps = (TOTAL_CELLS - 1) - currentPos;
        
        // Check if dice roll exceeds remaining steps
        if (diceResult > remainingSteps) {
            console.log(`Roll of ${diceResult} exceeds remaining ${remainingSteps} steps. Skipping turn.`);
            return true; // Return true to allow turn change but no movement
        }

        // Calculate new position using dice result
        const newPos = Math.min(currentPos + diceResult, TOTAL_CELLS - 1);
        console.log(`Moving player ${playerIndex + 1} from position ${currentPos} to ${newPos} (${diceResult} steps)`);

        try {
            // Update occupancy counts
            if (currentPos >= 0) {
                cellOccupancy[currentPos]--;
            }
            cellOccupancy[newPos]++;
            
            // Simple left-to-right, top-to-bottom pattern
            const row = Math.floor(newPos / BOARD_SIZE);
            const col = newPos % BOARD_SIZE;

            console.log(`Moving to cell: row ${row}, col ${col} (position ${newPos})`);

            const token = playerTokens[playerIndex];
            if (!token) {
                throw new Error(`Player token ${playerIndex} not found`);
            }

            const targetRow = table.rows[row];
            if (!targetRow) {
                throw new Error(`Row ${row} not found`);
            }

            const targetCell = targetRow.cells[col];
            if (!targetCell) {
                throw new Error(`Cell ${col} in row ${row} not found`);
            }

            // Position token based on occupancy
            const position = cellOccupancy[newPos] - 1;
            const angle = (position * (360 / 4)) * (Math.PI / 180);
            const radius = 20;
            
            const xOffset = Math.cos(angle) * radius;
            const yOffset = Math.sin(angle) * radius;
            
            token.style.top = `${50 + yOffset}%`;
            token.style.left = `${50 + xOffset}%`;
            
            // Replace the old gold column check with new column events
            handleColumnEvent(playerIndex, col, targetCell);

            targetCell.appendChild(token);
            playerPositions[playerIndex] = newPos;
            
            if (newPos === TOTAL_CELLS - 1) {
                setTimeout(() => alert(`Player ${playerIndex + 1} wins!`), 100);
            }
            return true;
        } catch (error) {
            console.error('Error moving player:', error);
            return false;
        }
    }

    // Update dice rolling functionality
    const diceIcon = document.getElementById('diceIcon');
    const diceResult = document.getElementById('diceResult');
    let isRolling = false;

    function showTurnSkipMessage(remainingSteps) {
        const message = document.createElement('div');
        message.className = 'turn-skip-message';
        message.textContent = `Need exactly ${remainingSteps} steps to win!`;
        document.body.appendChild(message);
        
        // Remove the message element after animation completes
        setTimeout(() => {
            message.remove();
        }, 3000);
    }
    
    diceIcon.addEventListener('click', () => {
        if (isRolling) return;
        
        const activePlayerIndex = currentPlayer - 1;
        const currentPos = playerPositions[activePlayerIndex];

        // Update token placement logic
        if (currentPos === 0) {
            const token = playerTokens[activePlayerIndex];
            if (!token.parentElement.classList.contains('td')) {
                token.style.position = 'relative';
                token.style.transform = 'none';
                tokensContainer.appendChild(token);
            }
        }

        const remainingSteps = TOTAL_CELLS - currentPos;
        
        isRolling = true;
        diceIcon.classList.add('dice-roll');
        diceResult.classList.remove('show');
        
        let rolls = 0;
        const maxRolls = 10;
        const rollInterval = setInterval(() => {
            const tempResult = Math.floor(Math.random() * 6) + 1;
            diceResult.textContent = tempResult;
            diceResult.classList.add('show');
            rolls++;
            
            if (rolls >= maxRolls) {
                clearInterval(rollInterval);
                const finalResult = Math.floor(Math.random() * 6) + 1;
                diceResult.textContent = finalResult;
                diceIcon.classList.remove('dice-roll');
                
                setTimeout(() => {
                    if (finalResult > remainingSteps) {
                        showTurnSkipMessage(remainingSteps);
                        setTimeout(() => nextTurn(), 800);
                    } else {
                        if (currentPos === 0) {
                            const token = playerTokens[activePlayerIndex];
                            token.style.position = 'absolute';
                            token.style.transform = 'translate(-50%, -50%)';
                        }
                        const moveSuccessful = movePlayer(activePlayerIndex, finalResult);
                        if (moveSuccessful) {
                            // Only change turns after a successful move
                            nextTurn();
                        }
                    }
                    isRolling = false;
                }, 100);
            }
        }, 100);
    });

    // Add styles for player tokens to the document
    const style = document.createElement('style');
    style.textContent = `
        .player-token {
            width: 25px;
            height: 25px;
            border-radius: 50%;
            position: absolute;
            transform: translate(-50%, -50%);
            z-index: 10;
            font-size: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
        }
        .player1 { background-color: #FF4136; }
        .player2 { background-color: #2ECC40; }
        .player3 { background-color: #0074D9; }
        .player4 { background-color: #FF851B; }
        td { position: relative; }
        .turn-skip-message {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            font-size: 16px;
            z-index: 1000;
            animation: fadeInOut 1.5s ease-in-out;
        }
        @keyframes fadeInOut {
            0%, 100% { opacity: 0; }
            50% { opacity: 1; }
        }
        .gold-animation {
            position: fixed;
            transform: translate(-50%, -50%);
            background-color: gold;
            color: black;
            padding: 5px 10px;
            border-radius: 5px;
            font-size: 14px;
            z-index: 1000;
            animation: goldFade 1s ease-in-out;
        }
        @keyframes goldFade {
            0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            100% { opacity: 0; transform: translate(-50%, -100%) scale(1.5); }
        }
        .gold-flash {
            animation: goldFlash 0.5s ease-in-out;
        }
        @keyframes goldFlash {
            0%, 100% { color: white; }
            50% { color: gold; }
        }
    `;
    document.head.appendChild(style);
});
