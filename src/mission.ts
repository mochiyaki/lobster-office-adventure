import { Enemy } from './enemies';

export interface MissionObjective {
    description: string;
    current: number;
    target: number;
    completed: boolean;
}

export interface MissionStats {
    enemiesDefeated: number;
    creaturesLost: number;
    creaturesProtected: number;
    damageDealt: number;
    damageTaken: number;
    bubblesShot: number;
    clawAttacks: number;
    survivalTime: number;
}

export class MissionSystem {
    private objectives: Map<string, MissionObjective> = new Map();
    private stats: MissionStats;
    private startTime: number;
    private missionActive: boolean;
    private missionComplete: boolean;
    private missionFailed: boolean;
    private totalProtectedCreatures: number;

    constructor(protectedCreatureCount: number) {
        this.totalProtectedCreatures = protectedCreatureCount;
        this.startTime = Date.now();
        this.missionActive = true;
        this.missionComplete = false;
        this.missionFailed = false;

        this.stats = {
            enemiesDefeated: 0,
            creaturesLost: 0,
            creaturesProtected: protectedCreatureCount,
            damageDealt: 0,
            damageTaken: 0,
            bubblesShot: 0,
            clawAttacks: 0,
            survivalTime: 0
        };

        this.initializeObjectives();
    }

    private initializeObjectives(): void {
        // Primary objective: Protect the creatures
        this.objectives.set('protect', {
            description: 'Keep creatures alive',
            current: this.totalProtectedCreatures,
            target: this.totalProtectedCreatures,
            completed: false
        });

        // Secondary objective: Defeat enemies
        this.objectives.set('defeat', {
            description: 'Defeat enemies',
            current: 0,
            target: 10,
            completed: false
        });

        // Survival objective
        this.objectives.set('survive', {
            description: 'Survive for 1 minute',
            current: 0,
            target: 60, // seconds
            completed: false
        });
    }

    onEnemyDefeated(enemy: Enemy): void {
        this.stats.enemiesDefeated++;
        
        const objective = this.objectives.get('defeat');
        if (objective && !objective.completed) {
            objective.current++;
            if (objective.current >= objective.target) {
                objective.completed = true;
                this.checkMissionComplete();
            }
        }
    }

    onCreatureLost(): void {
        this.stats.creaturesLost++;
        this.stats.creaturesProtected--;

        const objective = this.objectives.get('protect');
        if (objective) {
            objective.current--;
            
            // Mission fails if too many creatures are lost
            if (objective.current <= Math.floor(this.totalProtectedCreatures * 0.3)) {
                this.missionFailed = true;
                this.missionActive = false;
            }
        }
    }

    onDamageDealt(damage: number): void {
        this.stats.damageDealt += damage;
    }

    onDamageTaken(damage: number): void {
        this.stats.damageTaken += damage;
    }

    onBubbleShot(): void {
        this.stats.bubblesShot++;
    }

    onClawAttack(): void {
        this.stats.clawAttacks++;
    }

    update(deltaTime: number): void {
        if (!this.missionActive) return;

        this.stats.survivalTime += deltaTime;

        // Update survival objective
        const surviveObjective = this.objectives.get('survive');
        if (surviveObjective && !surviveObjective.completed) {
            surviveObjective.current = Math.floor(this.stats.survivalTime);
            if (surviveObjective.current >= surviveObjective.target) {
                surviveObjective.completed = true;
                this.checkMissionComplete();
            }
        }
    }

    private checkMissionComplete(): void {
        // Check if primary objectives are complete
        const protectObjective = this.objectives.get('protect');
        const surviveObjective = this.objectives.get('survive');

        if (protectObjective && surviveObjective) {
            // Mission succeeds if creatures are still alive and survival time is reached
            if (surviveObjective.completed && protectObjective.current > 0) {
                this.missionComplete = true;
                this.missionActive = false;
            }
        }
    }

    getObjectives(): MissionObjective[] {
        return Array.from(this.objectives.values());
    }

    getStats(): MissionStats {
        return { ...this.stats };
    }

    isMissionActive(): boolean {
        return this.missionActive;
    }

    isMissionComplete(): boolean {
        return this.missionComplete;
    }

    isMissionFailed(): boolean {
        return this.missionFailed;
    }

    getMissionStatus(): 'active' | 'complete' | 'failed' {
        if (this.missionComplete) return 'complete';
        if (this.missionFailed) return 'failed';
        return 'active';
    }

    getTimeElapsed(): number {
        return this.stats.survivalTime;
    }

    getFormattedTime(): string {
        const minutes = Math.floor(this.stats.survivalTime / 60);
        const seconds = Math.floor(this.stats.survivalTime % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    getThreatLevel(): number {
        // Calculate threat based on enemies defeated vs creatures lost
        const ratio = this.stats.creaturesLost > 0 
            ? this.stats.enemiesDefeated / this.stats.creaturesLost 
            : this.stats.enemiesDefeated;
        
        if (ratio < 1) return 3; // High threat
        if (ratio < 3) return 2; // Medium threat
        return 1; // Low threat
    }

    getThreatLevelText(): string {
        const level = this.getThreatLevel();
        switch (level) {
            case 3: return 'HIGH';
            case 2: return 'MEDIUM';
            case 1: return 'LOW';
            default: return 'UNKNOWN';
        }
    }

    getThreatColor(): string {
        const level = this.getThreatLevel();
        switch (level) {
            case 3: return '#ff0000';
            case 2: return '#ffa500';
            case 1: return '#00ff00';
            default: return '#ffffff';
        }
    }
}
