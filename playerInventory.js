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
            wisdom: 0
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
        if (stats.hasAlly) statDisplay.push('🤝');  // Add ally icon
        
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
        if (stat in this.playerStats[playerIndex]) {
            if (typeof this.playerStats[playerIndex][stat] === 'number') {
                this.playerStats[playerIndex][stat] = Math.max(0, this.playerStats[playerIndex][stat] + amount);
            } else if (typeof this.playerStats[playerIndex][stat] === 'boolean') {
                this.playerStats[playerIndex][stat] = Boolean(amount);
            } else {
                this.playerStats[playerIndex][stat] = amount;
            }
        }
    }
}
