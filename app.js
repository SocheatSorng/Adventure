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

    table.addEventListener('mousemove', e => {
        const img = e.target.closest('img');
        if (!img || img.src.includes('data:image')) return;

        isMoving = true;
        if (rafId) return;

        rafId = requestAnimationFrame(() => {
            updateMagnifier(e, img);
            rafId = null;
        });
    });

    function updateMagnifier(e, img) {
        const rect = img.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        magnifier.style.display = 'block';
        magnifier.style.left = `${e.pageX - 75}px`;
        magnifier.style.top = `${e.pageY - 75}px`;
        
        const bgX = (x / rect.width) * 100;
        const bgY = (y / rect.height) * 100;
        
        magnifier.style.backgroundImage = `url(${img.dataset.src || img.src})`;
        magnifier.style.backgroundSize = '300%';
        magnifier.style.backgroundPosition = `${bgX}% ${bgY}%`;
    }

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

    // Update dice rolling functionality
    const diceIcon = document.getElementById('diceIcon');
    const diceResult = document.getElementById('diceResult');
    
    diceIcon.addEventListener('click', () => {
        diceIcon.classList.add('dice-roll');
        diceResult.classList.remove('show');
        
        // Simulate rolling effect
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
            }
        }, 100);
    });
});
