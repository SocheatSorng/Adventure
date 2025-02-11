window.GameFunctions = {
    sendPlayerToStart: function(playerIndex, playerPositions, targetCell, cellOccupancy, TOTAL_CELLS) {
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
    },

    checkHealth: function(stats, playerPositions, playerIndex, targetCell, cellOccupancy, TOTAL_CELLS) {
        if (typeof stats.health === 'undefined') {
            stats.health = 0;
        }
        
        if (stats.health <= 0) {
            stats.health = 0;
            this.sendPlayerToStart(playerIndex, playerPositions, targetCell, cellOccupancy, TOTAL_CELLS);
            return 'You lost all health! Back to start.';
        }
        return null;
    },

    createChoiceUI: function(message, choices, callback) {
        const eventDisplay = document.getElementById('eventDisplay');
        const originalMessage = eventDisplay.textContent;

        const buttonsHtml = choices.map((choice, index) => 
            `<button onclick="window.handleChoice(${index})" class="choice-button">${choice}</button>`
        ).join('');

        eventDisplay.innerHTML = `
            <div>${message}</div>
            <div class="choice-buttons">${buttonsHtml}</div>
        `;

        window.handleChoice = (choiceIndex) => {
            eventDisplay.innerHTML = originalMessage;
            delete window.handleChoice;
            callback((choiceIndex + 1).toString());
        };
    },

    showGoldAnimation: function(cell, amount) {
        const rect = cell.getBoundingClientRect();
        const animation = document.createElement('div');
        animation.className = 'gold-animation';
        animation.textContent = `+${amount} 🪙`;
        animation.style.left = `${rect.left + rect.width/2}px`;
        animation.style.top = `${rect.top + rect.height/2}px`;
        document.body.appendChild(animation);
        animation.addEventListener('animationend', () => animation.remove());
    },

    showEventMessage: function(message) {
        const eventDisplay = document.getElementById('eventDisplay');
        eventDisplay.textContent = message || 'Roll the dice to move!';
    },

    showTurnSkipMessage: function(remainingSteps) {
        const message = document.createElement('div');
        message.className = 'turn-skip-message';
        message.textContent = `Need exactly ${remainingSteps} steps to win!`;
        document.body.appendChild(message);
        setTimeout(() => message.remove(), 3000);
    },

    handleManualStep: function(steps, params) {
        const {
            isRolling,
            activePlayerIndex,
            currentPos,
            playerPositions,
            TOTAL_CELLS,
            movePlayer,
            nextTurn
        } = params;

        if (isRolling) return;
        this.showEventMessage('Moving...');
        
        steps = parseInt(steps);
        if (isNaN(steps) || steps < 1 || steps > 6) {
            console.log('Invalid input. Please enter a number between 1 and 6.');
            return;
        }

        const remainingSteps = TOTAL_CELLS - currentPos;
        if (steps > remainingSteps) {
            this.showTurnSkipMessage(remainingSteps);
            setTimeout(() => nextTurn(), 800);
            return;
        }

        movePlayer(activePlayerIndex, steps).then(moveSuccessful => {
            if (moveSuccessful) {
                nextTurn();
            }
        });
    },

    askToUseItem: function(stats, itemName, benefit) {
        if (!stats[itemName]) return false;
        return confirm(`You have ${itemName}. Do you want to use it? ${benefit}`);
    }
};
