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
    
    // Replace player stats initialization with PlayerInventory
    const inventory = new PlayerInventory(playerCount);

    function rollDice() {
        return Math.floor(Math.random() * 6) + 1;
    }

    function updatePlayerStats(playerIndex) {
        const wrapper = document.querySelectorAll('#playerIndicators > div')[playerIndex];
        inventory.updateStats(playerIndex, wrapper);
    }

    // Modify player indicator creation
    function createPlayerIndicator(playerNum) {
        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.alignItems = 'center';
        wrapper.style.position = 'relative';
        
        const indicator = document.createElement('div');
        indicator.className = `player-indicator player${playerNum}-theme ${playerNum === 1 ? 'active' : ''}`;
        indicator.textContent = `Player ${playerNum}`;
        
        const goldDisplay = document.createElement('div');
        goldDisplay.className = 'gold-display';
        goldDisplay.textContent = '0 🪙';
        
        wrapper.appendChild(indicator);
        wrapper.appendChild(goldDisplay);
        return wrapper;
    }

    // Update player indicator creation first
    for (let i = 1; i <= playerCount; i++) {
        const wrapper = createPlayerIndicator(i);
        playerIndicators.appendChild(wrapper);
    }

    for (let i = 0; i < playerCount; i++) {
        updatePlayerStats(i);
    }

    const table = document.getElementById('gameTable');
    const magnifier = document.getElementById('magnifier');

    // Sprite sheet containing all board cell images, arranged in an 8x8 grid
    // in the same left-to-right, top-to-bottom order as the board itself.
    const SPRITE_PATH = 'sprite_sheet.png';
    const SPRITE_COLS = BOARD_SIZE;
    const SPRITE_ROWS = BOARD_SIZE;

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

    function loadBoardImages() {
        for (let i = 0; i < TOTAL_CELLS; i++) {
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

            // Crop this cell's portion out of the shared sprite sheet
            const cellImage = document.createElement('div');
            cellImage.className = 'cell-image';
            cellImage.dataset.row = row;
            cellImage.dataset.col = col;
            cellImage.setAttribute('role', 'img');
            cellImage.setAttribute('aria-label', `Event ${i + 1}`);
            cellImage.style.backgroundImage = `url(${SPRITE_PATH})`;
            cellImage.style.backgroundSize = `${SPRITE_COLS * 100}% ${SPRITE_ROWS * 100}%`;
            cellImage.style.backgroundPosition = `${(col / (SPRITE_COLS - 1)) * 100}% ${(row / (SPRITE_ROWS - 1)) * 100}%`;

            cell.appendChild(cellImage);
        }
    }

    loadBoardImages();

    // Optimize magnifier effect
    let isMoving = false;
    let rafId = null;

    function updateMagnifier(e, cellImage) {
        const rect = cellImage.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Calculate relative position within the image
        const xPercent = Math.max(0, Math.min(100, (x / rect.width) * 100));
        const yPercent = Math.max(0, Math.min(100, (y / rect.height) * 100));

        // Make sure the magnifier is rendered before measuring its size,
        // otherwise offsetWidth/offsetHeight read 0 while display is 'none'.
        magnifier.style.display = 'block';

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

        magnifier.style.left = `${left}px`;
        magnifier.style.top = `${top}px`;

        // Zoom into just this cell's region of the shared sprite sheet
        const row = Number(cellImage.dataset.row);
        const col = Number(cellImage.dataset.col);
        const zoom = 3; // 300% zoom, matching the previous single-image behavior
        const scaledCellWidth = magWidth * zoom;
        const scaledCellHeight = magHeight * zoom;

        magnifier.style.backgroundImage = `url(${SPRITE_PATH})`;
        magnifier.style.backgroundSize = `${scaledCellWidth * SPRITE_COLS}px ${scaledCellHeight * SPRITE_ROWS}px`;
        const posX = -(col * scaledCellWidth) - (xPercent / 100) * (scaledCellWidth - magWidth);
        const posY = -(row * scaledCellHeight) - (yPercent / 100) * (scaledCellHeight - magHeight);
        magnifier.style.backgroundPosition = `${posX}px ${posY}px`;
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

        const cellImage = e.target.closest('.cell-image');
        if (!cellImage) {
            magnifier.style.display = 'none';
            return;
        }

        clearTimeout(timeout);
        timeout = setTimeout(() => {
            updateMagnifier(e, cellImage);
        }, 10);
    });

    // Update mouseleave event
    table.addEventListener('mouseleave', () => {
        magnifier.style.display = 'none';
        isMoving = false;
    });

    // Shop: spend gold on items at any time during your turn, without using it up
    const shopToggle = document.getElementById('shopToggle');
    const shopModal = document.getElementById('shopModal');
    const shopPanel = shopModal.querySelector('.shop-panel');
    const shopPlayerLabel = document.getElementById('shopPlayerLabel');
    const shopGoldAmount = document.getElementById('shopGoldAmount');
    const shopCloseButton = document.getElementById('shopCloseButton');
    const shopBuyButtons = Array.from(document.querySelectorAll('.shop-buy-button'));
    const shopBooleanItems = { potion: 'hasPotion', map: 'hasMap' };

    function refreshShopDisplay() {
        const activePlayerIndex = currentPlayer - 1;
        const gold = inventory.getGold(activePlayerIndex);
        const stats = inventory.getStats(activePlayerIndex);

        shopPlayerLabel.textContent = `Player ${currentPlayer}`;
        shopGoldAmount.textContent = gold;

        shopBuyButtons.forEach(button => {
            const item = button.dataset.item;
            const cost = Number(button.dataset.cost);
            const ownedStat = shopBooleanItems[item];

            if (ownedStat && stats[ownedStat]) {
                button.disabled = true;
                button.textContent = 'Owned';
            } else {
                button.disabled = gold < cost;
                button.textContent = 'Buy';
            }
        });
    }

    function openShop() {
        if (isRolling || isTurnLocked || window.GameFunctions.isWaitingForChoice) {
            shopToggle.classList.add('shake');
            setTimeout(() => shopToggle.classList.remove('shake'), 500);
            return;
        }
        window.GameFunctions.isWaitingForChoice = true; // block rolling while the shop is open
        refreshShopDisplay();
        shopModal.hidden = false;
    }

    function closeShop() {
        shopModal.hidden = true;
        window.GameFunctions.isWaitingForChoice = false;
    }

    shopToggle.addEventListener('click', () => {
        if (shopModal.hidden) {
            openShop();
        } else {
            closeShop();
        }
    });

    shopCloseButton.addEventListener('click', closeShop);

    shopModal.addEventListener('click', (e) => {
        if (e.target === shopModal) closeShop();
    });

    shopBuyButtons.forEach(button => {
        button.addEventListener('click', () => {
            const activePlayerIndex = currentPlayer - 1;
            const item = button.dataset.item;
            const cost = Number(button.dataset.cost);
            const stats = inventory.getStats(activePlayerIndex);

            if (inventory.getGold(activePlayerIndex) < cost) return;
            if (shopBooleanItems[item] && stats[shopBooleanItems[item]]) return;

            inventory.modifyGold(activePlayerIndex, -cost);
            switch (item) {
                case 'potion': stats.hasPotion = true; break;
                case 'map': stats.hasMap = true; break;
                case 'strength': stats.strength += 1; break;
                case 'magic': stats.magic += 1; break;
            }

            updatePlayerStats(activePlayerIndex);
            updateGoldDisplay(activePlayerIndex);
            refreshShopDisplay();

            const itemLabel = button.parentElement.querySelector('.shop-item-label').textContent;
            showEventMessage(`Player ${currentPlayer} bought ${itemLabel}!`);
        });
    });

    // Add turn handling
    // Add turn locking
    let isTurnLocked = false;

    // Modify nextTurn function
    function nextTurn() {
        if (isTurnLocked || window.GameFunctions.isWaitingForChoice) {
            return; // Don't change turns if locked or waiting for choice
        }

        const indicators = document.querySelectorAll('.player-indicator');
        const currentIndicator = indicators[currentPlayer - 1];
        currentIndicator.classList.remove('active', 'skipped');
        
        currentPlayer = currentPlayer % playerCount + 1;
        const nextIndicator = indicators[currentPlayer - 1];
        const nextPlayerStats = inventory.getStats(currentPlayer - 1);
        
        if (nextPlayerStats.skipNextTurn) {
            nextIndicator.classList.add('skipped');
        }
        
        nextIndicator.classList.add('active');
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
        inventory.updateStats(playerIndex, wrapper);
    }

    function showEventMessage(message) {
        const eventDisplay = document.getElementById('eventDisplay');
        eventDisplay.textContent = message || 'Roll the dice to move!';  // Default message when empty
    }

    // Modify movePlayer function to handle turn locking
    async function movePlayer(playerIndex, diceResult) {
        isTurnLocked = true;
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
        let newPos;
        // Reset position if player was sent back to start
        if (currentPos === 0) {
            newPos = diceResult - 1;  // First cell is index 0
            // Reset occupancy for this player
            cellOccupancy.fill(0);
            // Clear any existing token placements
            const allCells = document.querySelectorAll('td');
            allCells.forEach(cell => {
                const playerToken = cell.querySelector(`.player${playerIndex + 1}`);
                if (playerToken) {
                    cell.removeChild(playerToken);
                }
            });
        } else {
            newPos = Math.min(currentPos + diceResult, TOTAL_CELLS - 1);
        }
        try {
            const token = playerTokens[playerIndex];
            token.classList.add('token-moving');
            // Clear old position's occupancy
            if (currentPos > 0) {
                cellOccupancy[currentPos]--;
            }
            // Reset position for animation
            let startPos = currentPos === 0 ? 0 : currentPos;  // Changed from currentPos + 1
            // Update position before animation
            playerPositions[playerIndex] = newPos;  // Move this line here
            // Animate through each step
            for (let pos = startPos; pos <= newPos; pos++) {
                const row = Math.floor(pos / BOARD_SIZE);
                const col = pos % BOARD_SIZE;
                const targetCell = table.rows[row].cells[col];
                // Update occupancy for intermediate positions
                if (pos > currentPos + 1) {
                    cellOccupancy[pos - 1]--;
                }
                cellOccupancy[pos]++;
                // Position token
                const position = cellOccupancy[pos] - 1;
                const radius = 15; // Reduced from 20 to bring tokens closer together
                let xOffset, yOffset;
                
                switch(position) {
                    case 0: // Center
                        xOffset = 0;
                        yOffset = 0;
                        break;
                    case 1: // Top
                        xOffset = 0;
                        yOffset = -radius;
                        break;
                    case 2: // Right
                        xOffset = radius;
                        yOffset = 0;
                        break;
                    case 3: // Bottom
                        xOffset = 0;
                        yOffset = radius;
                        break;
                    default: // More than 4 tokens, stack them slightly offset
                        const angle = ((position % 4) * 90) * (Math.PI / 180);
                        xOffset = Math.cos(angle) * (radius - 5);
                        yOffset = Math.sin(angle) * (radius - 5);
                }
                
                token.style.top = `calc(50% + ${yOffset}px)`;
                token.style.left = `calc(50% + ${xOffset}px)`;
                targetCell.appendChild(token);
                // Wait for animation
                await new Promise(resolve => setTimeout(resolve, 500));
                // Show event message only for final position
                if (pos === newPos) {
                    const GF = window.GameFunctions;
                    const stats = inventory.getStats(playerIndex);
                    
                    // Update skip turn visual indicator if needed
                    const indicator = document.querySelectorAll('.player-indicator')[playerIndex];
                    if (stats.skipNextTurn) {
                        indicator.classList.add('skipped');
                    } else {
                        indicator.classList.remove('skipped');
                    }

                    // Landing on another player's square triggers an encounter instead of the cell's own event
                    const rivalIndex = pos === 0 ? -1 :
                        playerPositions.findIndex((p, idx) => idx !== playerIndex && p === pos);

                    if (rivalIndex !== -1) {
                        GF.handlePlayerEncounter(playerIndex, rivalIndex, targetCell, {
                            inventory,
                            showEventMessage,
                            updatePlayerStats,
                            updateGoldDisplay: (idx) => updateGoldDisplay(idx),
                            nextTurn
                        });
                    } else {
                        // Handle event and wait for any choices to complete
                        await handleColumnEvent(playerIndex, pos, targetCell, {
                            inventory,
                            playerPositions,
                            showEventMessage,
                            updatePlayerStats,
                            updateGoldDisplay: (idx) => updateGoldDisplay(idx),
                            showGoldAnimation: GF.showGoldAnimation,
                            showLostGoldAnimation: GF.showLostGoldAnimation,
                            rollDice,
                            cellOccupancy,
                            TOTAL_CELLS,
                            movePlayer,
                            currentPlayer,
                            nextTurn  // Add this line
                        });

                        // Only call nextTurn if there's no active choice
                        if (!GF.isWaitingForChoice) {
                            nextTurn();
                        }
                    }
                }
            }
            token.classList.remove('token-moving');
            if (newPos === TOTAL_CELLS - 1) {
                setTimeout(() => alert(`Player ${playerIndex + 1} wins!`), 100);
            }
            return true;
        } catch (error) {
            console.error('Error moving player:', error);
            return false;
        } finally {
            isTurnLocked = false;
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
        if (isRolling || isTurnLocked || window.GameFunctions.isWaitingForChoice) return;
        
        // Check for waiting choice without changing message
        if (window.GameFunctions.isWaitingForChoice) {
            diceIcon.classList.add('shake');
            setTimeout(() => diceIcon.classList.remove('shake'), 500);
            return;
        }

        const activePlayerIndex = currentPlayer - 1;
        const stats = inventory.getStats(activePlayerIndex);
        const currentPos = playerPositions[activePlayerIndex];
        const indicator = document.querySelectorAll('.player-indicator')[activePlayerIndex];

        // Check if player should skip their turn
        if (stats.skipNextTurn) {
            stats.skipNextTurn = false; // Reset the flag
            indicator.classList.add('skipped'); // Add crossed-out effect immediately
            
            // Show skip message
            showEventMessage(`Player ${currentPlayer}'s turn is skipped!`);
            
            // Animate the crossed-out effect before moving to next turn
            setTimeout(() => {
                indicator.classList.remove('skipped'); // Remove the crossed-out effect
                nextTurn();
                showEventMessage('Roll the dice to move!');
            }, 1000); // Reduced from 1500ms to make it snappier
            return;
        }

        showEventMessage('Rolling...');
        
        // Update token placement logic
        if (currentPos === 0) {
            const token = playerTokens[activePlayerIndex];
            if (!token.parentElement.classList.contains('td')) {
                token.style.position = 'relative';
                token.style.transform = 'none';
                tokensContainer.appendChild(token);
            }
        }

        const remainingSteps = (TOTAL_CELLS - 1) - currentPos;
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
                setTimeout(async () => {
                    if (finalResult > remainingSteps) {
                        showTurnSkipMessage(remainingSteps);
                        setTimeout(() => nextTurn(), 800);
                    } else {
                        if (currentPos === 0) {
                            const token = playerTokens[activePlayerIndex];
                            token.style.position = 'absolute';
                            token.style.transform = 'translate(-50%, -50%)';
                        }
                        const moveSuccessful = await movePlayer(activePlayerIndex, finalResult);
                        if (moveSuccessful && !window.GameFunctions.isWaitingForChoice) {
                            const justWon = playerPositions[activePlayerIndex] === TOTAL_CELLS - 1;
                            if (finalResult === 6 && !justWon) {
                                // Rolling a 6 earns this player another roll
                                showEventMessage(`Player ${currentPlayer} rolled a 6 - go again!`);
                            } else {
                                nextTurn();
                            }
                        }
                    }
                    isRolling = false;
                }, 100);
            }
        }, 100);
    });

    // Add function to handle manual step input
    function handleManualStep(steps) {
        if (isRolling) return;

        const activePlayerIndex = currentPlayer - 1;
        const stats = inventory.getStats(activePlayerIndex);
        const currentPos = playerPositions[activePlayerIndex];

        // Check if player should skip their turn
        if (stats.skipNextTurn) {
            stats.skipNextTurn = false; // Reset the flag
            showEventMessage(`Player ${currentPlayer}'s turn is skipped!`);
            setTimeout(() => {
                nextTurn();
                showEventMessage('Roll the dice to move!');
            }, 1500);
            return;
        }

        showEventMessage('Moving...');
        
        // Validate input
        steps = parseInt(steps);
        if (isNaN(steps) || steps < 1 || steps > 6) {
            console.log('Invalid input. Please enter a number between 1 and 6.');
            return;
        }

        // Update token placement logic
        if (currentPos === 0) {
            const token = playerTokens[activePlayerIndex];
            if (!token.parentElement.classList.contains('td')) {
                token.style.position = 'relative';
                token.style.transform = 'none';
                tokensContainer.appendChild(token);
            }
        }

        const remainingSteps = (TOTAL_CELLS - 1) - currentPos;
        if (steps > remainingSteps) {
            showTurnSkipMessage(remainingSteps);
            setTimeout(() => nextTurn(), 800);
            return;
        }
        if (currentPos === 0) {
            const token = playerTokens[activePlayerIndex];
            token.style.position = 'absolute';
            token.style.transform = 'translate(-50%, -50%)';
        }
        // Update dice display
        diceResult.textContent = steps;
        diceResult.classList.add('show');
        movePlayer(activePlayerIndex, steps).then(moveSuccessful => {
            if (moveSuccessful) {
                nextTurn();
            }
        });
    }

    // Add console input listener
    console.log('To move manually, type: move(steps)');
    window.move = handleManualStep;

    // Add initial message when game loads
    showEventMessage('Roll the dice to start!');

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
        .event-message {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px 25px;
            border-radius: 5px;
            font-size: 18px;
            z-index: 1000;
            animation: fadeInOut 2s ease-in-out;
        }
        .shake {
            animation: shake 0.5s ease-in-out;
        }
        
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }
    `;
    document.head.appendChild(style);

    // Add keyboard controls
    document.addEventListener('keydown', (e) => {
        if (isRolling || window.GameFunctions.isWaitingForChoice) return;
        
        switch(e.key) {
            case ' ':  // Spacebar for current player's turn
                diceIcon.click();
                break;
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
                if (currentPlayer === 1) {  // Player 1 uses number keys
                    handleManualStep(parseInt(e.key));
                }
                break;
            case 'n':
            case 'N':
                nextTurn();  // Allow manual turn passing
                break;
        }
    });
});
