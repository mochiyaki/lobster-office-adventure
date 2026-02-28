import * as THREE from 'three';
import { Team, HealthComponent } from './combat';
import { ProjectileManager } from './projectiles';
import { AudioManager } from './audio';

export class Lobster {
    constructor(scene, projectileManager, audioManager) {
        this.scene = scene;
        this.projectileManager = projectileManager;
        this.audioManager = audioManager;
        this.position = new THREE.Vector3(0, 1, 0);
        this.rotation = 0;
        this.speed = 0.1;
        this.rotationSpeed = 0.05;
        
        // Skills system
        this.skills = {
            baseSpeed: 1.0,
            interactionRange: 3.0,
            specialAbilities: []
        };
        
        // Combat system
        this.health = new HealthComponent(this.position.clone(), 100, Team.PLAYER, 1.0);
        this.maxHealth = 100;
        
        // Attack cooldowns
        this.bubbleCooldown = 0.5; // seconds
        this.lastBubbleTime = 0;
        this.clawCooldown = 1.0; // seconds
        this.lastClawTime = 0;
        this.clawDamage = 30;
        this.clawRange = 2.5;
        
        // Animation state
        this.clawAttacking = false;
        this.clawAttackTime = 0;
        
        this.createLobster();
        this.setupControls();
    }

    createLobster() {
        // Create lobster group
        this.lobsterGroup = new THREE.Group();
        
        // Body (main shell)
        const bodyGeometry = new THREE.BoxGeometry(1.5, 0.8, 2);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0xff4500, // Orange-red
            roughness: 0.5,
            metalness: 0.2
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.4;
        body.castShadow = true;
        this.lobsterGroup.add(body);

        // Head
        const headGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const head = new THREE.Mesh(headGeometry, bodyMaterial);
        head.position.set(0, 0.6, 1.2);
        head.scale.set(1, 0.8, 1);
        head.castShadow = true;
        this.lobsterGroup.add(head);

        // Tail segments
        for (let i = 0; i < 3; i++) {
            const tailSegment = new THREE.Mesh(
                new THREE.BoxGeometry(1.2 - i * 0.2, 0.6 - i * 0.1, 0.5),
                bodyMaterial
            );
            tailSegment.position.set(0, 0.3, -1.5 - i * 0.6);
            tailSegment.castShadow = true;
            this.lobsterGroup.add(tailSegment);
        }

        // Claws
        const clawMaterial = new THREE.MeshStandardMaterial({
            color: 0xcc3300,
            roughness: 0.6
        });

        // Left claw
        const leftClawArm = new THREE.Mesh(
            new THREE.CylinderGeometry(0.15, 0.15, 1.2),
            clawMaterial
        );
        leftClawArm.position.set(-0.9, 0.5, 0.5);
        leftClawArm.rotation.z = -Math.PI / 4;
        this.lobsterGroup.add(leftClawArm);

        const leftClaw = new THREE.Mesh(
            new THREE.BoxGeometry(0.4, 0.3, 0.6),
            clawMaterial
        );
        leftClaw.position.set(-1.5, 0.5, 1);
        this.lobsterGroup.add(leftClaw);

        // Right claw
        const rightClawArm = new THREE.Mesh(
            new THREE.CylinderGeometry(0.15, 0.15, 1.2),
            clawMaterial
        );
        rightClawArm.position.set(0.9, 0.5, 0.5);
        rightClawArm.rotation.z = Math.PI / 4;
        this.lobsterGroup.add(rightClawArm);

        const rightClaw = new THREE.Mesh(
            new THREE.BoxGeometry(0.4, 0.3, 0.6),
            clawMaterial
        );
        rightClaw.position.set(1.5, 0.5, 1);
        this.lobsterGroup.add(rightClaw);

        // Legs (simple cylinders)
        for (let side = -1; side <= 1; side += 2) {
            for (let i = 0; i < 4; i++) {
                const leg = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.08, 0.08, 0.8),
                    clawMaterial
                );
                leg.position.set(
                    side * 0.8,
                    0.1,
                    0.5 - i * 0.6
                );
                leg.rotation.z = side * Math.PI / 6;
                this.lobsterGroup.add(leg);
            }
        }

        // Eyes
        const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const leftEye = new THREE.Mesh(
            new THREE.SphereGeometry(0.1),
            eyeMaterial
        );
        leftEye.position.set(-0.3, 0.8, 1.5);
        this.lobsterGroup.add(leftEye);

        const rightEye = new THREE.Mesh(
            new THREE.SphereGeometry(0.1),
            eyeMaterial
        );
        rightEye.position.set(0.3, 0.8, 1.5);
        this.lobsterGroup.add(rightEye);

        this.lobsterGroup.position.copy(this.position);
        this.scene.add(this.lobsterGroup);
    }

    setupControls() {
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            interact: false,
            shoot: false,
            claw: false
        };

        window.addEventListener('keydown', (e) => {
            switch(e.key.toLowerCase()) {
                case 'w':
                case 'arrowup':
                    this.keys.forward = true;
                    break;
                case 's':
                case 'arrowdown':
                    this.keys.backward = true;
                    break;
                case 'a':
                case 'arrowleft':
                    this.keys.left = true;
                    break;
                case 'd':
                case 'arrowright':
                    this.keys.right = true;
                    break;
                case 'e':
                    this.keys.interact = true;
                    break;
                case ' ':
                    this.keys.shoot = true;
                    e.preventDefault(); // Prevent page scroll
                    break;
                case 'q':
                    this.keys.claw = true;
                    break;
            }
        });

        window.addEventListener('keyup', (e) => {
            switch(e.key.toLowerCase()) {
                case 'w':
                case 'arrowup':
                    this.keys.forward = false;
                    break;
                case 's':
                case 'arrowdown':
                    this.keys.backward = false;
                    break;
                case 'a':
                case 'arrowleft':
                    this.keys.left = false;
                    break;
                case 'd':
                case 'arrowright':
                    this.keys.right = false;
                    break;
                case 'e':
                    this.keys.interact = false;
                    break;
                case ' ':
                    this.keys.shoot = false;
                    break;
                case 'q':
                    this.keys.claw = false;
                    break;
            }
        });

        // Mouse click for claw attack
        window.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left click
                this.keys.claw = true;
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.keys.claw = false;
            }
        });
    }

    update(combatSystem, onBubbleShot, onClawAttack) {
        const moveSpeed = this.speed * this.skills.baseSpeed;
        const currentTime = Date.now() / 1000;

        // Rotation
        if (this.keys.left) {
            this.rotation += this.rotationSpeed;
        }
        if (this.keys.right) {
            this.rotation -= this.rotationSpeed;
        }

        // Movement
        let moved = false;
        if (this.keys.forward) {
            this.position.x += Math.sin(this.rotation) * moveSpeed;
            this.position.z += Math.cos(this.rotation) * moveSpeed;
            moved = true;
        }
        if (this.keys.backward) {
            this.position.x -= Math.sin(this.rotation) * moveSpeed;
            this.position.z -= Math.cos(this.rotation) * moveSpeed;
            moved = true;
        }

        // Boundary checking (keep within lobby)
        this.position.x = Math.max(-44, Math.min(44, this.position.x));
        this.position.z = Math.max(-44, Math.min(44, this.position.z));

        // Update lobster position and rotation
        this.lobsterGroup.position.copy(this.position);
        this.lobsterGroup.rotation.y = this.rotation;

        // Update health component position
        this.health.position.copy(this.position);

        // Combat actions
        // Bubble shoot (Space)
        if (this.keys.shoot && currentTime - this.lastBubbleTime >= this.bubbleCooldown) {
            this.shootBubble();
            this.lastBubbleTime = currentTime;
            if (onBubbleShot) onBubbleShot();
        }

        // Claw attack (Q or Left Click)
        if (this.keys.claw && currentTime - this.lastClawTime >= this.clawCooldown && !this.clawAttacking) {
            this.performClawAttack(combatSystem);
            this.lastClawTime = currentTime;
            this.clawAttacking = true;
            this.clawAttackTime = currentTime;
            if (onClawAttack) onClawAttack();
        }

        // Reset claw attack animation
        if (this.clawAttacking && currentTime - this.clawAttackTime > 0.3) {
            this.clawAttacking = false;
        }

        // Animate claw attack
        if (this.clawAttacking) {
            const progress = (currentTime - this.clawAttackTime) / 0.3;
            const swingAngle = Math.sin(progress * Math.PI) * 0.8;
            
            // Left claw (index 6)
            if (this.lobsterGroup.children[6]) {
                this.lobsterGroup.children[6].rotation.y = swingAngle;
            }
            // Right claw (index 8)
            if (this.lobsterGroup.children[8]) {
                this.lobsterGroup.children[8].rotation.y = -swingAngle;
            }
        } else {
            // Reset claw positions
            if (this.lobsterGroup.children[6]) {
                this.lobsterGroup.children[6].rotation.y = 0;
            }
            if (this.lobsterGroup.children[8]) {
                this.lobsterGroup.children[8].rotation.y = 0;
            }
        }

        // Simple walking animation
        if (moved) {
            const bobAmount = Math.sin(Date.now() * 0.01) * 0.05;
            this.lobsterGroup.position.y = this.position.y + bobAmount;
        }
    }

    shootBubble() {
        const shootOffset = new THREE.Vector3(
            Math.sin(this.rotation) * 2,
            1.5,
            Math.cos(this.rotation) * 2
        );
        const shootPos = this.position.clone().add(shootOffset);
        
        const direction = new THREE.Vector3(
            Math.sin(this.rotation),
            0,
            Math.cos(this.rotation)
        );

        this.projectileManager.shootBubble(shootPos, direction);
        
        // Play bubble sound
        if (this.audioManager) {
            this.audioManager.playSound('bubble');
        }
    }

    performClawAttack(combatSystem) {
        // Check for enemies in range
        const attackPos = this.position.clone().add(
            new THREE.Vector3(
                Math.sin(this.rotation) * 1.5,
                0,
                Math.cos(this.rotation) * 1.5
            )
        );

        const enemies = combatSystem.getEntitiesInRadius(attackPos, this.clawRange, Team.ENEMY);
        enemies.forEach(enemy => {
            enemy.takeDamage(this.clawDamage);
        });
        
        // Play claw attack sound
        if (this.audioManager) {
            this.audioManager.playSound('claw');
        }
        
        // Play hit sound if we hit something
        if (enemies.length > 0 && this.audioManager) {
            setTimeout(() => {
                this.audioManager.playSound('hit');
            }, 100);
        }
    }

    getPosition() {
        return this.position.clone();
    }

    getRotation() {
        return this.rotation;
    }

    isInteracting() {
        return this.keys.interact;
    }

    resetInteract() {
        this.keys.interact = false;
    }

    upgradeSkill(skillType, value) {
        switch(skillType) {
            case 'speed':
                this.skills.baseSpeed += value;
                break;
            case 'range':
                this.skills.interactionRange += value;
                break;
            case 'ability':
                this.skills.specialAbilities.push(value);
                break;
        }
    }

    getSkills() {
        return this.skills;
    }

    getHealth() {
        return this.health;
    }

    takeDamage(damage) {
        this.health.takeDamage(damage);
    }

    canShoot() {
        const currentTime = Date.now() / 1000;
        return currentTime - this.lastBubbleTime >= this.bubbleCooldown;
    }

    canClawAttack() {
        const currentTime = Date.now() / 1000;
        return currentTime - this.lastClawTime >= this.clawCooldown;
    }

    getBubbleCooldownProgress() {
        const currentTime = Date.now() / 1000;
        const timeSince = currentTime - this.lastBubbleTime;
        return Math.min(timeSince / this.bubbleCooldown, 1.0);
    }

    getClawCooldownProgress() {
        const currentTime = Date.now() / 1000;
        const timeSince = currentTime - this.lastClawTime;
        return Math.min(timeSince / this.clawCooldown, 1.0);
    }
}
