import * as THREE from 'three';

export enum Team {
    PLAYER = 'player',
    ENEMY = 'enemy',
    NEUTRAL = 'neutral'
}

export interface CombatEntity {
    position: THREE.Vector3;
    health: number;
    maxHealth: number;
    team: Team;
    radius: number;
    isAlive: boolean;
    takeDamage: (damage: number) => void;
    onDeath?: () => void;
}

export class CombatSystem {
    private entities: Map<string, CombatEntity> = new Map();

    registerEntity(id: string, entity: CombatEntity): void {
        this.entities.set(id, entity);
    }

    unregisterEntity(id: string): void {
        this.entities.delete(id);
    }

    getEntity(id: string): CombatEntity | undefined {
        return this.entities.get(id);
    }

    getAllEntities(): CombatEntity[] {
        return Array.from(this.entities.values());
    }

    getEntitiesByTeam(team: Team): CombatEntity[] {
        return Array.from(this.entities.values()).filter(e => e.team === team && e.isAlive);
    }

    applyDamage(targetId: string, damage: number): boolean {
        const entity = this.entities.get(targetId);
        if (entity && entity.isAlive) {
            entity.takeDamage(damage);
            return true;
        }
        return false;
    }

    checkCollision(pos1: THREE.Vector3, radius1: number, pos2: THREE.Vector3, radius2: number): boolean {
        const distance = pos1.distanceTo(pos2);
        return distance < (radius1 + radius2);
    }

    checkSphereCollision(position: THREE.Vector3, radius: number, team: Team): CombatEntity | null {
        for (const entity of this.entities.values()) {
            if (entity.team !== team && entity.isAlive) {
                if (this.checkCollision(position, radius, entity.position, entity.radius)) {
                    return entity;
                }
            }
        }
        return null;
    }

    getEntitiesInRadius(position: THREE.Vector3, radius: number, team?: Team): CombatEntity[] {
        const result: CombatEntity[] = [];
        for (const entity of this.entities.values()) {
            if (entity.isAlive && (!team || entity.team === team)) {
                const distance = position.distanceTo(entity.position);
                if (distance <= radius) {
                    result.push(entity);
                }
            }
        }
        return result;
    }

    update(): void {
        // Clean up dead entities
        for (const [id, entity] of this.entities.entries()) {
            if (!entity.isAlive) {
                if (entity.onDeath) {
                    entity.onDeath();
                }
            }
        }
    }
}

export class HealthComponent implements CombatEntity {
    position: THREE.Vector3;
    health: number;
    maxHealth: number;
    team: Team;
    radius: number;
    isAlive: boolean;
    onDeath?: () => void;

    constructor(
        position: THREE.Vector3,
        maxHealth: number,
        team: Team,
        radius: number = 1.0,
        onDeath?: () => void
    ) {
        this.position = position;
        this.maxHealth = maxHealth;
        this.health = maxHealth;
        this.team = team;
        this.radius = radius;
        this.isAlive = true;
        this.onDeath = onDeath;
    }

    takeDamage(damage: number): void {
        if (!this.isAlive) return;
        
        this.health -= damage;
        if (this.health <= 0) {
            this.health = 0;
            this.isAlive = false;
            if (this.onDeath) {
                this.onDeath();
            }
        }
    }

    heal(amount: number): void {
        this.health = Math.min(this.health + amount, this.maxHealth);
    }

    getHealthPercentage(): number {
        return this.health / this.maxHealth;
    }
}
