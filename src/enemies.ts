import * as THREE from 'three';
import { Team, HealthComponent, CombatSystem } from './combat';

enum EnemyState {
    PATROL = 'patrol',
    CHASE = 'chase',
    ATTACK = 'attack',
    RETREAT = 'retreat'
}

export abstract class Enemy {
    protected scene: THREE.Scene;
    protected group: THREE.Group;
    protected health: HealthComponent;
    protected state: EnemyState;
    protected speed: number;
    protected detectionRange: number;
    protected attackRange: number;
    protected attackDamage: number;
    protected attackCooldown: number;
    protected lastAttackTime: number;
    protected target: THREE.Vector3 | null;
    protected targetEntity: any | null; // Reference to the entity being attacked
    protected patrolPoint: THREE.Vector3;
    protected id: string;
    public isActive: boolean;
    protected combatSystem: CombatSystem;

    constructor(
        scene: THREE.Scene,
        position: THREE.Vector3,
        maxHealth: number,
        speed: number,
        detectionRange: number,
        attackRange: number,
        attackDamage: number,
        attackCooldown: number,
        combatSystem: CombatSystem
    ) {
        this.scene = scene;
        this.speed = speed;
        this.detectionRange = detectionRange;
        this.attackRange = attackRange;
        this.attackDamage = attackDamage;
        this.attackCooldown = attackCooldown;
        this.lastAttackTime = 0;
        this.state = EnemyState.PATROL;
        this.target = null;
        this.targetEntity = null;
        this.isActive = true;
        this.id = `enemy_${Date.now()}_${Math.random()}`;
        this.combatSystem = combatSystem;

        this.health = new HealthComponent(
            position.clone(),
            maxHealth,
            Team.ENEMY,
            1.5,
            () => this.onDeath()
        );

        this.patrolPoint = this.generatePatrolPoint();
        this.group = this.createModel();
        this.group.position.copy(position);
        this.scene.add(this.group);
    }

    protected abstract createModel(): THREE.Group;

    protected generatePatrolPoint(): THREE.Vector3 {
        return new THREE.Vector3(
            (Math.random() - 0.5) * 80,
            this.group ? this.group.position.y : 2,
            (Math.random() - 0.5) * 80
        );
    }

    protected updateAI(playerEntity: any, protectedCreatures: any[]): void {
        const playerPos = playerEntity.getPosition();
        const distanceToPlayer = this.group.position.distanceTo(playerPos);

        // Find nearest protected creature
        let nearestCreature: any | null = null;
        let minCreatureDistance = Infinity;

        protectedCreatures.forEach(creature => {
            const creaturePos = creature.position;
            const dist = this.group.position.distanceTo(creaturePos);
            if (dist < minCreatureDistance) {
                minCreatureDistance = dist;
                nearestCreature = creature;
            }
        });

        // State machine
        switch (this.state) {
            case EnemyState.PATROL:
                // Check for targets in range
                if (distanceToPlayer < this.detectionRange) {
                    this.state = EnemyState.CHASE;
                    this.target = playerPos.clone();
                    this.targetEntity = playerEntity;
                } else if (nearestCreature && minCreatureDistance < this.detectionRange) {
                    this.state = EnemyState.CHASE;
                    this.target = nearestCreature.position.clone();
                    this.targetEntity = nearestCreature;
                } else {
                    // Continue patrol
                    this.patrol();
                }
                break;

            case EnemyState.CHASE:
                // Decide target priority: creatures over player
                if (nearestCreature && minCreatureDistance < distanceToPlayer) {
                    this.target = nearestCreature.position.clone();
                    this.targetEntity = nearestCreature;
                } else if (distanceToPlayer < this.detectionRange * 1.5) {
                    this.target = playerPos.clone();
                    this.targetEntity = playerEntity;
                } else {
                    // Lost target
                    this.state = EnemyState.PATROL;
                    this.target = null;
                    this.targetEntity = null;
                    break;
                }

                const distanceToTarget = this.target ? this.group.position.distanceTo(this.target) : Infinity;

                if (distanceToTarget < this.attackRange) {
                    this.state = EnemyState.ATTACK;
                } else if (this.target) {
                    this.moveTowards(this.target);
                }
                break;

            case EnemyState.ATTACK:
                const currentTime = Date.now() / 1000;
                if (this.target && this.targetEntity && currentTime - this.lastAttackTime >= this.attackCooldown) {
                    this.performAttack();
                    // Deal damage to the target
                    if (this.targetEntity.takeDamage) {
                        this.targetEntity.takeDamage(this.attackDamage);
                    }
                    this.lastAttackTime = currentTime;
                }

                // Check if target moved away
                const attackDistCheck = this.target ? this.group.position.distanceTo(this.target) : Infinity;
                if (attackDistCheck > this.attackRange * 1.5) {
                    this.state = EnemyState.CHASE;
                }
                break;

            case EnemyState.RETREAT:
                // Low health behavior
                if (this.health.health < this.health.maxHealth * 0.3) {
                    const retreatDir = this.group.position.clone().sub(playerPos).normalize();
                    const retreatTarget = this.group.position.clone().add(retreatDir.multiplyScalar(5));
                    this.moveTowards(retreatTarget);
                } else {
                    this.state = EnemyState.PATROL;
                }
                break;
        }

        // Check for retreat condition
        if (this.health.health < this.health.maxHealth * 0.2 && this.state !== EnemyState.RETREAT) {
            this.state = EnemyState.RETREAT;
        }
    }

    protected patrol(): void {
        const distance = this.group.position.distanceTo(this.patrolPoint);
        
        if (distance < 2) {
            this.patrolPoint = this.generatePatrolPoint();
        } else {
            this.moveTowards(this.patrolPoint);
        }
    }

    protected moveTowards(target: THREE.Vector3): void {
        const direction = target.clone().sub(this.group.position).normalize();
        const movement = direction.multiplyScalar(this.speed);
        
        this.group.position.add(movement);
        
        // Keep within bounds
        this.group.position.x = Math.max(-45, Math.min(45, this.group.position.x));
        this.group.position.z = Math.max(-45, Math.min(45, this.group.position.z));

        // Face movement direction
        const angle = Math.atan2(direction.x, direction.z);
        this.group.rotation.y = angle;

        // Update health component position
        this.health.position.copy(this.group.position);
    }

    protected abstract performAttack(): void;

    update(playerEntity: any, protectedCreatures: any[]): void {
        if (!this.health.isAlive) return;

        this.updateAI(playerEntity, protectedCreatures);
        this.animateModel();
    }

    protected abstract animateModel(): void;

    protected onDeath(): void {
        this.isActive = false;
        // Death animation
        const fadeOut = () => {
            this.group.scale.multiplyScalar(0.95);
            this.group.position.y -= 0.05;
            
            if (this.group.scale.x > 0.1) {
                requestAnimationFrame(fadeOut);
            } else {
                this.scene.remove(this.group);
            }
        };
        fadeOut();
    }

    getHealth(): HealthComponent {
        return this.health;
    }

    getPosition(): THREE.Vector3 {
        return this.group.position.clone();
    }

    getId(): string {
        return this.id;
    }

    takeDamage(damage: number): void {
        this.health.takeDamage(damage);
    }
}

export class Shark extends Enemy {
    constructor(scene: THREE.Scene, position: THREE.Vector3, combatSystem: CombatSystem) {
        super(
            scene,
            position,
            80, // maxHealth
            0.15, // speed (fast)
            15, // detectionRange
            2.5, // attackRange
            15, // attackDamage
            1.5, // attackCooldown
            combatSystem
        );
    }

    protected createModel(): THREE.Group {
        const sharkGroup = new THREE.Group();
        const sharkMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a4a4a,
            roughness: 0.4
        });

        // Body
        const bodyGeometry = new THREE.CylinderGeometry(0.4, 0.6, 2.5, 16);
        const body = new THREE.Mesh(bodyGeometry, sharkMaterial);
        body.rotation.z = Math.PI / 2;
        body.position.y = 1;
        body.castShadow = true;
        sharkGroup.add(body);

        // Head (pointed)
        const headGeometry = new THREE.ConeGeometry(0.4, 0.8, 16);
        const head = new THREE.Mesh(headGeometry, sharkMaterial);
        head.rotation.z = -Math.PI / 2;
        head.position.set(1.6, 1, 0);
        head.castShadow = true;
        sharkGroup.add(head);

        // Tail
        const tailGeometry = new THREE.ConeGeometry(0.6, 1.2, 16);
        const tail = new THREE.Mesh(tailGeometry, sharkMaterial);
        tail.rotation.z = Math.PI / 2;
        tail.position.set(-1.8, 1, 0);
        sharkGroup.add(tail);

        // Dorsal fin
        const finMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const dorsalFin = new THREE.Mesh(
            new THREE.ConeGeometry(0.3, 0.8, 4),
            finMaterial
        );
        dorsalFin.rotation.z = Math.PI;
        dorsalFin.position.set(-0.2, 1.7, 0);
        sharkGroup.add(dorsalFin);

        // Side fins
        for (let side = -1; side <= 1; side += 2) {
            const sideFin = new THREE.Mesh(
                new THREE.ConeGeometry(0.2, 0.6, 4),
                finMaterial
            );
            sideFin.rotation.z = side * Math.PI / 2;
            sideFin.position.set(0.3, 1, side * 0.7);
            sharkGroup.add(sideFin);
        }

        // Eyes (menacing red)
        const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        for (let side = -1; side <= 1; side += 2) {
            const eye = new THREE.Mesh(
                new THREE.SphereGeometry(0.1),
                eyeMaterial
            );
            eye.position.set(1.3, 1.1, side * 0.25);
            sharkGroup.add(eye);
        }

        // Teeth indicators (white stripes)
        const teethMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const teeth = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.1, 0.6),
            teethMaterial
        );
        teeth.position.set(1.8, 0.9, 0);
        sharkGroup.add(teeth);

        return sharkGroup;
    }

    protected performAttack(): void {
        // Lunge animation
        const originalZ = this.group.position.z;
        const lungeDistance = 1.5;
        const direction = new THREE.Vector3(
            Math.sin(this.group.rotation.y),
            0,
            Math.cos(this.group.rotation.y)
        );
        
        this.group.position.add(direction.multiplyScalar(lungeDistance));
        
        // Reset after short delay
        setTimeout(() => {
            if (this.group && this.group.parent) {
                this.group.position.sub(direction.multiplyScalar(lungeDistance * 0.7));
            }
        }, 200);
    }

    protected animateModel(): void {
        const time = Date.now() * 0.005;
        // Swimming tail sway
        if (this.group.children[2]) {
            this.group.children[2].rotation.y = Math.sin(time * 3) * 0.3;
        }
        // Body bob
        this.group.position.y = 2 + Math.sin(time * 2) * 0.2;
    }
}

export class Turtle extends Enemy {
    private shellRotation: number = 0;

    constructor(scene: THREE.Scene, position: THREE.Vector3, combatSystem: CombatSystem) {
        super(
            scene,
            position,
            120, // maxHealth (tankier)
            0.08, // speed (slower)
            12, // detectionRange
            2.0, // attackRange
            10, // attackDamage
            2.0, // attackCooldown
            combatSystem
        );
    }

    protected createModel(): THREE.Group {
        const turtleGroup = new THREE.Group();
        
        // Shell
        const shellMaterial = new THREE.MeshStandardMaterial({
            color: 0x2d5016,
            roughness: 0.8
        });
        const shellTop = new THREE.Mesh(
            new THREE.SphereGeometry(0.9, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2),
            shellMaterial
        );
        shellTop.position.y = 0.9;
        shellTop.castShadow = true;
        turtleGroup.add(shellTop);

        // Shell pattern
        const patternMaterial = new THREE.MeshStandardMaterial({
            color: 0x6b8e23,
            roughness: 0.7
        });
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const pattern = new THREE.Mesh(
                new THREE.SphereGeometry(0.25, 8, 8),
                patternMaterial
            );
            pattern.position.set(
                Math.cos(angle) * 0.5,
                1.1,
                Math.sin(angle) * 0.5
            );
            turtleGroup.add(pattern);
        }

        // Body/belly
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x8fbc8f,
            roughness: 0.6
        });
        const belly = new THREE.Mesh(
            new THREE.SphereGeometry(0.7, 16, 16),
            bodyMaterial
        );
        belly.scale.y = 0.5;
        belly.position.y = 0.4;
        turtleGroup.add(belly);

        // Head
        const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.35, 12, 12),
            bodyMaterial
        );
        head.scale.set(1, 0.8, 1.3);
        head.position.set(0, 0.6, 1.1);
        head.castShadow = true;
        turtleGroup.add(head);

        // Eyes (yellow)
        const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        for (let side = -1; side <= 1; side += 2) {
            const eye = new THREE.Mesh(
                new THREE.SphereGeometry(0.08),
                eyeMaterial
            );
            eye.position.set(side * 0.2, 0.7, 1.3);
            turtleGroup.add(eye);

            const pupil = new THREE.Mesh(
                new THREE.SphereGeometry(0.04),
                pupilMaterial
            );
            pupil.position.set(side * 0.2, 0.7, 1.35);
            turtleGroup.add(pupil);
        }

        // Flippers
        const flipperMaterial = new THREE.MeshStandardMaterial({
            color: 0x556b2f,
            roughness: 0.5
        });
        const flipperPositions = [
            { x: -0.8, z: 0.3 },
            { x: 0.8, z: 0.3 },
            { x: -0.7, z: -0.5 },
            { x: 0.7, z: -0.5 }
        ];

        flipperPositions.forEach(pos => {
            const flipper = new THREE.Mesh(
                new THREE.BoxGeometry(0.3, 0.1, 0.5),
                flipperMaterial
            );
            flipper.position.set(pos.x, 0.3, pos.z);
            flipper.rotation.y = Math.sign(pos.x) * 0.3;
            turtleGroup.add(flipper);
        });

        return turtleGroup;
    }

    protected performAttack(): void {
        // Shell spin attack
        this.shellRotation += Math.PI / 2;
        const spinDuration = 300;
        const startRotation = this.group.rotation.y;
        const startTime = Date.now();

        const spin = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / spinDuration, 1);
            
            if (this.group && this.group.parent) {
                this.group.rotation.y = startRotation + progress * Math.PI * 2;
                
                if (progress < 1) {
                    requestAnimationFrame(spin);
                }
            }
        };
        spin();
    }

    protected animateModel(): void {
        const time = Date.now() * 0.003;
        // Bob up and down
        this.group.position.y = 1 + Math.sin(time) * 0.15;
        
        // Flipper movement
        const flippers = [8, 9, 10, 11]; // Flipper indices
        flippers.forEach((idx, i) => {
            if (this.group.children[idx]) {
                const offset = i * Math.PI / 2;
                this.group.children[idx].rotation.x = Math.sin(time * 2 + offset) * 0.3;
            }
        });
    }
}

export class EnemyManager {
    private scene: THREE.Scene;
    private combatSystem: CombatSystem;
    private enemies: Enemy[] = [];
    private spawnTimer: number = 0;
    private spawnInterval: number = 8; // seconds
    private maxEnemies: number = 6;
    private waveNumber: number = 1;

    constructor(scene: THREE.Scene, combatSystem: CombatSystem) {
        this.scene = scene;
        this.combatSystem = combatSystem;
    }

    spawnEnemy(type: 'shark' | 'turtle', position?: THREE.Vector3): void {
        if (this.enemies.filter(e => e.isActive).length >= this.maxEnemies) {
            return;
        }

        // Spawn at random edge if no position specified
        const spawnPos = position || this.getRandomSpawnPosition();
        
        let enemy: Enemy;
        if (type === 'shark') {
            enemy = new Shark(this.scene, spawnPos, this.combatSystem);
        } else {
            enemy = new Turtle(this.scene, spawnPos, this.combatSystem);
        }

        this.enemies.push(enemy);
        this.combatSystem.registerEntity(enemy.getId(), enemy.getHealth());
    }

    private getRandomSpawnPosition(): THREE.Vector3 {
        const edge = Math.floor(Math.random() * 4);
        const pos = new THREE.Vector3();
        
        switch (edge) {
            case 0: // North
                pos.set((Math.random() - 0.5) * 80, 2, -40);
                break;
            case 1: // South
                pos.set((Math.random() - 0.5) * 80, 2, 40);
                break;
            case 2: // West
                pos.set(-40, 2, (Math.random() - 0.5) * 80);
                break;
            case 3: // East
                pos.set(40, 2, (Math.random() - 0.5) * 80);
                break;
        }
        
        return pos;
    }

    update(deltaTime: number, playerEntity: any, protectedCreatures: any[]): void {
        // Update spawn timer
        this.spawnTimer += deltaTime;
        
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            const type = Math.random() < 0.6 ? 'shark' : 'turtle';
            this.spawnEnemy(type);
        }

        // Update all enemies
        this.enemies.forEach(enemy => {
            if (enemy.isActive) {
                enemy.update(playerEntity, protectedCreatures);
            }
        });

        // Clean up dead enemies
        this.enemies = this.enemies.filter(enemy => {
            if (!enemy.isActive) {
                this.combatSystem.unregisterEntity(enemy.getId());
                return false;
            }
            return true;
        });
    }

    getEnemies(): Enemy[] {
        return this.enemies.filter(e => e.isActive);
    }

    getEnemyCount(): number {
        return this.enemies.filter(e => e.isActive).length;
    }

    increaseWave(): void {
        this.waveNumber++;
        this.maxEnemies = Math.min(10, 6 + Math.floor(this.waveNumber / 2));
        this.spawnInterval = Math.max(3, 8 - this.waveNumber * 0.5);
    }

    getWaveNumber(): number {
        return this.waveNumber;
    }

    clear(): void {
        this.enemies.forEach(enemy => {
            this.combatSystem.unregisterEntity(enemy.getId());
        });
        this.enemies = [];
    }
}
