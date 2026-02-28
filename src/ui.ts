export class UI {
    constructor() {
        this.interactionPrompt = document.getElementById('interaction-prompt');
        this.dialogueBox = document.getElementById('dialogue-box');
        this.npcName = document.getElementById('npc-name');
        this.dialogueText = document.getElementById('dialogue-text');
        this.dialogueOptions = document.getElementById('dialogue-options');
        this.skillsList = document.getElementById('skills-list');
        this.checkpointCount = document.getElementById('checkpoint-count');
        
        // Combat UI elements
        this.healthBar = document.getElementById('health-bar-fill');
        this.healthText = document.getElementById('health-text');
        this.bubbleCooldown = document.getElementById('bubble-cooldown');
        this.clawCooldown = document.getElementById('claw-cooldown');
        
        // Mission UI elements
        this.missionPanel = document.getElementById('mission-panel');
        this.missionStatus = document.getElementById('mission-status');
        this.missionTime = document.getElementById('mission-time');
        this.objectivesList = document.getElementById('objectives-list');
        this.enemyCount = document.getElementById('enemy-count');
        this.creaturesAlive = document.getElementById('creatures-alive');
        this.threatLevel = document.getElementById('threat-level');
        
        // Game Over UI elements
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.gameOverMessage = document.getElementById('game-over-message');
        this.playAgainBtn = document.getElementById('play-again-btn');
        
        // Mission Complete UI elements
        this.missionCompleteScreen = document.getElementById('mission-complete-screen');
        this.playAgainCompleteBtn = document.getElementById('play-again-complete-btn');
        
        this.initializeSkills();
    }

    initializeSkills() {
        this.updateSkills({
            baseSpeed: 1.0,
            interactionRange: 3.0,
            specialAbilities: []
        });
        this.updateCheckpointProgress(0, 4);
    }

    showInteractionPrompt(show) {
        if (show) {
            this.interactionPrompt.classList.remove('hidden');
        } else {
            this.interactionPrompt.classList.add('hidden');
        }
    }

    showDialogue(name, text, options) {
        this.npcName.textContent = name;
        this.dialogueText.textContent = text;
        this.dialogueOptions.innerHTML = '';

        options.forEach(option => {
            const button = document.createElement('button');
            button.className = 'dialogue-option';
            button.textContent = option.text;
            button.addEventListener('click', option.action);
            this.dialogueOptions.appendChild(button);
        });

        this.dialogueBox.classList.remove('hidden');
    }

    hideDialogue() {
        this.dialogueBox.classList.add('hidden');
    }

    updateSkills(skills) {
        this.skillsList.innerHTML = '';

        // Base speed
        const speedItem = document.createElement('div');
        speedItem.className = 'skill-item';
        speedItem.textContent = `Speed Multiplier: ${skills.baseSpeed.toFixed(1)}x`;
        this.skillsList.appendChild(speedItem);

        // Interaction range
        const rangeItem = document.createElement('div');
        rangeItem.className = 'skill-item';
        rangeItem.textContent = `Interaction Range: ${skills.interactionRange.toFixed(1)}m`;
        this.skillsList.appendChild(rangeItem);

        // Special abilities
        if (skills.specialAbilities.length > 0) {
            const abilitiesTitle = document.createElement('div');
            abilitiesTitle.style.marginTop = '10px';
            abilitiesTitle.style.fontWeight = 'bold';
            abilitiesTitle.style.color = '#29abe2';
            abilitiesTitle.textContent = 'Special Abilities:';
            this.skillsList.appendChild(abilitiesTitle);

            skills.specialAbilities.forEach(ability => {
                const abilityItem = document.createElement('div');
                abilityItem.className = 'skill-item';
                abilityItem.textContent = this.formatAbilityName(ability);
                this.skillsList.appendChild(abilityItem);
            });
        }
    }

    formatAbilityName(ability) {
        // Convert snake_case to Title Case
        return ability
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    updateCheckpointProgress(visited, total) {
        this.checkpointCount.textContent = `${visited}/${total}`;
    }

    updateMission(missionSystem) {
        if (!missionSystem) return;

        // Update mission status
        const status = missionSystem.getMissionStatus();
        this.missionStatus.textContent = status.toUpperCase();
        this.missionStatus.className = `mission-status-${status}`;

        // Update time
        this.missionTime.textContent = missionSystem.getFormattedTime();

        // Update objectives
        const objectives = missionSystem.getObjectives();
        this.objectivesList.innerHTML = '';
        objectives.forEach(obj => {
            const objItem = document.createElement('div');
            objItem.className = `objective-item ${obj.completed ? 'completed' : ''}`;
            objItem.innerHTML = `
                <span class="objective-check">${obj.completed ? '✓' : '○'}</span>
                <span>${obj.description}: ${obj.current}/${obj.target}</span>
            `;
            this.objectivesList.appendChild(objItem);
        });

        // Update stats
        const stats = missionSystem.getStats();
        this.enemyCount.textContent = stats.enemiesDefeated;
        this.creaturesAlive.textContent = stats.creaturesProtected;
        
        // Update threat level
        this.threatLevel.textContent = missionSystem.getThreatLevelText();
        this.threatLevel.style.color = missionSystem.getThreatColor();
    }

    updateCombat(lobster, enemies) {
        if (!lobster) return;

        // Update health bar
        const health = lobster.getHealth();
        const healthPercent = (health.health / health.maxHealth) * 100;
        this.healthBar.style.width = `${healthPercent}%`;
        this.healthText.textContent = `${Math.ceil(health.health)}/${health.maxHealth}`;

        // Color health bar based on health
        if (healthPercent > 60) {
            this.healthBar.style.background = '#00ff00';
        } else if (healthPercent > 30) {
            this.healthBar.style.background = '#ffa500';
        } else {
            this.healthBar.style.background = '#ff0000';
        }

        // Update cooldowns
        const bubbleProgress = lobster.getBubbleCooldownProgress();
        this.bubbleCooldown.style.width = `${bubbleProgress * 100}%`;

        const clawProgress = lobster.getClawCooldownProgress();
        this.clawCooldown.style.width = `${clawProgress * 100}%`;
    }

    showGameOver(missionSystem) {
        this.gameOverScreen.classList.remove('hidden');
        
        const stats = missionSystem.getStats();
        
        // Set message based on reason
        if (stats.creaturesProtected < 3) {
            this.gameOverMessage.textContent = 'Too many creatures were lost. The mission has failed.';
        } else {
            this.gameOverMessage.textContent = 'Mission failed. Try again to protect the sea creatures!';
        }
        
        // Update stats
        document.getElementById('final-enemies').textContent = stats.enemiesDefeated;
        document.getElementById('final-creatures-lost').textContent = stats.creaturesLost;
        document.getElementById('final-time').textContent = missionSystem.getFormattedTime();
        document.getElementById('final-damage').textContent = Math.round(stats.damageDealt);
    }

    showMissionComplete(missionSystem) {
        this.missionCompleteScreen.classList.remove('hidden');
        
        const stats = missionSystem.getStats();
        
        // Update stats
        document.getElementById('complete-enemies').textContent = stats.enemiesDefeated;
        document.getElementById('complete-creatures-saved').textContent = stats.creaturesProtected;
        document.getElementById('complete-time').textContent = missionSystem.getFormattedTime();
        document.getElementById('complete-damage').textContent = Math.round(stats.damageDealt);
    }

    hideGameOver() {
        this.gameOverScreen.classList.add('hidden');
        this.missionCompleteScreen.classList.add('hidden');
    }

    bindPlayAgain(callback) {
        this.playAgainBtn.addEventListener('click', callback);
        this.playAgainCompleteBtn.addEventListener('click', callback);
    }
}
