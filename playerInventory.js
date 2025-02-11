class PlayerInventory {
    constructor(playerCount) {
        this.playerCount = Number(playerCount);
        this.playerGold = new Array(this.playerCount).fill(0);
        this.playerStats = Array(this.playerCount).fill().map(() => ({
            health: 0,
            strength: 0,
            potions: 0,
            hasMap: false,
            magic: 0,
            status: '',
            karma: 0,
            luck: 0,
            hasAlly: false,
            alignment: '',
            honor: 0,
            wisdom: 0,
            itemsUsed: new Set() // Add tracking of used items
        }));
    }

    updateStats(playerIndex, wrapper) {
        const goldDisplay = wrapper.querySelector('.gold-display');
        const stats = this.playerStats[playerIndex];
        
        // Basic stats with emojis
        const statDisplay = [
            `${this.playerGold[playerIndex]} 💰`,
            `${stats.health} ❤️`,
            `${stats.strength} 💪`,
            `${stats.potions} 🧪`,
            `${stats.magic} ✨`
        ];
        
        // Add status icons
        if (stats.hasMap) statDisplay.push('🗺️');
        if (stats.status === 'good karma') statDisplay.push('😇');
        if (stats.hasAlly) statDisplay.push('🤝');
        if (stats.luck > 0) statDisplay.push('🍀');  // Add luck icon if player has luck points
        if (stats.hasClue) statDisplay.push('📜');  // Add clue emoji when player has a clue
        
        // Join all stats with separators
        goldDisplay.textContent = statDisplay.join(' | ');
        goldDisplay.classList.add('gold-flash');
        setTimeout(() => goldDisplay.classList.remove('gold-flash'), 500);
    }

    getStats(playerIndex) {
        return this.playerStats[playerIndex];
    }

    getGold(playerIndex) {
        return this.playerGold[playerIndex];
    }

    modifyGold(playerIndex, amount) {
        this.playerGold[playerIndex] = Math.max(0, this.playerGold[playerIndex] + amount);
    }

    modifyStat(playerIndex, stat, amount) {
        const stats = this.playerStats[playerIndex];
        
        // Check if item is already used
        if (stat === 'luck' && stats.itemsUsed.has('luckPotion')) {
            return false;
        }
        if (stat === 'hasAlly' && stats.itemsUsed.has('ally')) {
            return false;
        }
        if (stat === 'hasMap' && stats.itemsUsed.has('map')) {
            return false;
        }
        
        // Mark item as used based on stat
        if (stat === 'luck') stats.itemsUsed.add('luckPotion');
        if (stat === 'hasAlly') stats.itemsUsed.add('ally');
        if (stat === 'hasMap') stats.itemsUsed.add('map');
        
        // ...existing modification logic...
        if (stat in stats) {
            if (typeof stats[stat] === 'number') {
                stats[stat] = Math.max(0, stats[stat] + amount);
            } else if (typeof stats[stat] === 'boolean') {
                stats[stat] = Boolean(amount);
            } else {
                stats[stat] = amount;
            }
        }
        return true;
    }

    // Add method to check if item is already used
    hasUsedItem(playerIndex, itemName) {
        return this.playerStats[playerIndex].itemsUsed.has(itemName);
    }

    // Add method to mark item as used
    markItemAsUsed(playerIndex, itemName) {
        this.playerStats[playerIndex].itemsUsed.add(itemName);
        // When marking map as used, remove it from status
        if (itemName === 'map') {
            this.playerStats[playerIndex].hasMap = false;
        }
    }
}
