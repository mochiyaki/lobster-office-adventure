export class NPCSystem {
    constructor(checkpoints, lobster, ui) {
        this.checkpoints = checkpoints;
        this.lobster = lobster;
        this.ui = ui;
        this.currentNPC = null;
        this.dialogueActive = false;
    }

    update(nearestCheckpoint) {
        // Show/hide interaction prompt
        if (nearestCheckpoint && !this.dialogueActive) {
            this.ui.showInteractionPrompt(true);
            
            // Check for interact key
            if (this.lobster.isInteracting()) {
                this.lobster.resetInteract();
                this.startDialogue(nearestCheckpoint);
            }
        } else if (!this.dialogueActive) {
            this.ui.showInteractionPrompt(false);
        }
    }

    startDialogue(checkpoint) {
        this.currentNPC = checkpoint;
        this.dialogueActive = true;
        
        const greeting = checkpoint.visited 
            ? `Welcome back to ${checkpoint.name}! Ready for another upgrade?`
            : `Welcome to ${checkpoint.name}! I'm the ${checkpoint.npc}. ${checkpoint.description}. Would you like to enhance your abilities?`;

        this.ui.showDialogue(
            checkpoint.npc,
            greeting,
            this.createDialogueOptions(checkpoint)
        );
    }

    createDialogueOptions(checkpoint) {
        const options = [];

        checkpoint.upgrades.forEach((upgrade, index) => {
            options.push({
                text: `${upgrade.name} - ${upgrade.description}`,
                action: () => this.applyUpgrade(checkpoint, upgrade)
            });
        });

        options.push({
            text: 'Maybe later...',
            action: () => this.endDialogue()
        });

        return options;
    }

    applyUpgrade(checkpoint, upgrade) {
        // Apply the upgrade to the lobster
        this.lobster.upgradeSkill(upgrade.type, upgrade.value);
        
        // Mark checkpoint as visited
        this.checkpoints.visitCheckpoint(checkpoint.name);
        
        // Update UI
        this.ui.updateSkills(this.lobster.getSkills());
        this.ui.updateCheckpointProgress(
            this.checkpoints.getVisitedCount(),
            this.checkpoints.getTotalCount()
        );

        // Show success message
        this.ui.showDialogue(
            checkpoint.npc,
            `Excellent choice! Your ${upgrade.name} has been upgraded. You're becoming quite the capable lobster!`,
            [{
                text: 'Thank you!',
                action: () => this.endDialogue()
            }]
        );
    }

    endDialogue() {
        this.dialogueActive = false;
        this.currentNPC = null;
        this.ui.hideDialogue();
    }

    isDialogueActive() {
        return this.dialogueActive;
    }
}
