document.addEventListener('DOMContentLoaded', () => {
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
    const imageNames = Array.from({length: 64}, (_, i) => `${i + 1}.jpeg`);

    // Load images in batches
    const batchSize = 8; // Load 8 images at a time
    let currentBatch = 0;

    function loadImageBatch() {
        const start = currentBatch * batchSize;
        const end = Math.min(start + batchSize, 64);

        for (let i = start; i < end; i++) {
            const row = Math.floor(i / 8);
            const col = i % 8;
            
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
        if (currentBatch * batchSize < 64) {
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

    function movePlayer(playerIndex, diceResult) {
        const currentPos = playerPositions[playerIndex];
        const newPos = Math.min(currentPos + diceResult, 63); // Limit to last cell (64th position)
        
        // Calculate new row and column
        const currentRow = Math.floor(currentPos / 8);
        const currentCol = currentPos % 8;
        const newRow = Math.floor(newPos / 8);
        const newCol = newPos % 8;
        
        // Move token to new position
        const token = playerTokens[playerIndex];
        const targetCell = table.rows[newRow].cells[newCol];
        targetCell.appendChild(token);
        
        // Update position in array
        playerPositions[playerIndex] = newPos;
        
        // Check if player reached the end
        if (newPos === 63) {
            alert(`Player ${playerIndex + 1} wins!`);
        }
    }

    // Update dice rolling functionality
    const diceIcon = document.getElementById('diceIcon');
    const diceResult = document.getElementById('diceResult');
    
    diceIcon.addEventListener('click', () => {
        // Only allow current player to roll
        const activePlayerIndex = currentPlayer - 1;
        
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
                
                // Move player after roll completes
                movePlayer(activePlayerIndex, finalResult);
                nextTurn();
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
    `;
    document.head.appendChild(style);
});
