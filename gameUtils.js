window.createChoiceUI = function(message, choices, callback) {
    const eventDisplay = document.getElementById('eventDisplay');
    const originalMessage = eventDisplay.textContent;

    // Create choice buttons
    const buttonsHtml = choices.map((choice, index) => 
        `<button onclick="window.handleChoice(${index})" class="choice-button">${choice}</button>`
    ).join('');

    // Update display with message and choices
    eventDisplay.innerHTML = `
        <div>${message}</div>
        <div class="choice-buttons">${buttonsHtml}</div>
    `;

    // Set up global handler
    window.handleChoice = (choiceIndex) => {
        // Reset display
        eventDisplay.innerHTML = originalMessage;
        // Remove global handler
        delete window.handleChoice;
        // Call callback with choice
        callback((choiceIndex + 1).toString());
    };
};
