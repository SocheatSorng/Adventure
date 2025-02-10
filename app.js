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
    
    for (let i = 1; i <= playerCount; i++) {
        const indicator = document.createElement('div');
        indicator.className = `player-indicator ${i === 1 ? 'active' : ''}`;
        indicator.textContent = `Player ${i}`;
        playerIndicators.appendChild(indicator);
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
        
        // Position the magnifier
        const magWidth = magnifier.offsetWidth;
        const magHeight = magnifier.offsetHeight;
        
        magnifier.style.display = 'block';
        magnifier.style.left = `${e.pageX - magWidth/2}px`;
        magnifier.style.top = `${e.pageY - magHeight/2}px`;
        
        // Use the actual image source for higher quality zoom
        const imgSrc = img.dataset.src || img.src;
        if (imgSrc.includes('data:image')) {
            magnifier.style.display = 'none';
            return;
        }
        
        magnifier.style.backgroundImage = `url(${imgSrc})`;
        magnifier.style.backgroundSize = '400%';
        magnifier.style.backgroundPosition = `${xPercent}% ${yPercent}%`;
    }

    // Optimize mousemove performance with debounce
    let timeout;
    table.addEventListener('mousemove', e => {
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

    // Add player position tracking
    const playerPositions = new Array(Number(playerCount)).fill(0);
    const playerTokens = [];

    // Get player icons from localStorage
    const playerIcons = JSON.parse(localStorage.getItem('playerIcons') || '[]');

    // Create player tokens with selected icons
    for (let i = 0; i < playerCount; i++) {
        const token = document.createElement('div');
        token.className = `player-token player${i + 1}`;
        token.innerHTML = `<i class="${playerIcons[i] || 'fas fa-user'}"></i>`;
        playerTokens.push(token);
        const startCell = table.rows[0].cells[0];
        startCell.appendChild(token);
    }

    // Add cell occupancy tracking
    const cellOccupancy = new Array(TOTAL_CELLS).fill(0);

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

        const newPos = currentPos + diceResult;
        console.log(`Moving player ${playerIndex + 1} from ${currentPos} to ${newPos}`);

        try {
            // Update occupancy counts
            if (currentPos >= 0) {
                cellOccupancy[currentPos]--;
            }
            cellOccupancy[newPos]++;
            
            const newRow = Math.floor(newPos / BOARD_SIZE);
            const newCol = newPos % BOARD_SIZE;
            
            // Validate new position is within bounds
            if (newRow >= BOARD_SIZE || newCol >= BOARD_SIZE) {
                throw new Error(`Invalid position: row ${newRow}, col ${newCol}`);
            }

            const token = playerTokens[playerIndex];
            if (!token) {
                throw new Error(`Player token ${playerIndex} not found`);
            }

            const targetRow = table.rows[newRow];
            if (!targetRow) {
                throw new Error(`Row ${newRow} not found`);
            }

            const targetCell = targetRow.cells[newCol];
            if (!targetCell) {
                throw new Error(`Cell ${newCol} in row ${newRow} not found`);
            }
            
            // Position token based on occupancy
            const position = cellOccupancy[newPos] - 1;
            const angle = (position * (360 / 4)) * (Math.PI / 180);
            const radius = 20;
            
            const xOffset = Math.cos(angle) * radius;
            const yOffset = Math.sin(angle) * radius;
            
            token.style.top = `${50 + yOffset}%`;
            token.style.left = `${50 + xOffset}%`;
            
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
                
                setTimeout(() => {
                    if (finalResult > remainingSteps) {
                        showTurnSkipMessage(remainingSteps);
                        setTimeout(() => nextTurn(), 800); // Delay turn change until message is visible
                    } else {
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
    `;
    document.head.appendChild(style);
});
