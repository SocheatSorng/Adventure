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

    // Update player indicator creation
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
            
            // Add error checking
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

            // Create image placeholder
            const img = document.createElement('img');
            img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; // Transparent placeholder
            img.dataset.src = `images/${imageNames[i]}`; // Store real image path
            img.alt = `Event ${i + 1}`;
            cell.appendChild(img);

            // Load actual image when in viewport
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        observer.unobserve(img);
                    }
                });
            });
            observer.observe(img);
        }

        currentBatch++;
        if (currentBatch * batchSize < TOTAL_CELLS) {
            setTimeout(loadImageBatch, 100); // Load next batch after 100ms
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

    // Add click handler for turns
    table.addEventListener('click', e => {
        if (e.target.closest('img')) {
            nextTurn();
        }
    });

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
            
            // Check if player landed on column 1 (index 0) in odd rows, or last column in even rows
            const isGoldColumn = (row % 2 === 0) ? (col === 0) : (col === BOARD_SIZE - 1);
            if (isGoldColumn && currentPos > 0) {
                const goldAmount = 50;
                playerGold[playerIndex] += goldAmount;
                showGoldAnimation(targetCell, goldAmount);
                updateGoldDisplay(playerIndex);
            }

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
                token.style.position = 'relative'; // Keep token visible in container
                token.style.transform = 'none'; // Reset transform
                tokensContainer.appendChild(token); // Keep token in waiting area
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
                        setTimeout(() => nextTurn(), 800); // Delay turn change until message is visible
                    } else {
                        if (currentPos === 0) {
                            // Only move to first cell if the player isn't on the board yet
                            const token = playerTokens[activePlayerIndex];
                            token.style.position = 'absolute'; // Restore absolute positioning
                            token.style.transform = 'translate(-50%, -50%)'; // Restore centering transform
                        }
                        const moveSuccessful = movePlayer(activePlayerIndex, finalResult);
                        if (moveSuccessful) {
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
