import * as THREE from 'three';
import { Team, CombatSystem } from './combat';

export class Projectile {
    private scene: THREE.Scene;
    private group: THREE.Group;
    private velocity: THREE.Vector3;
    private lifetime: number;
    private maxLifetime: number;
    private damage: number;
    private team: Team;
    private radius: number;
    public isActive: boolean;

    constructor(
        scene: THREE.Scene,
        position: THREE.Vector3,
        direction: THREE.Vector3,
        speed: number,
        damage: number,
        team: Team,
        maxLifetime: number = 3.0
    ) {
        this.scene = scene;
        this.damage = damage;
        this.team = team;
        this.lifetime = 0;
        this.maxLifetime = maxLifetime;
        this.isActive = true;
        this.radius = 0.3;

        this.velocity = direction.normalize().multiplyScalar(speed);
        
        this.group = this.createBubble();
        this.group.position.copy(position);
        this.scene.add(this.group);
    }

    private createBubble(): THREE.Group {
        const bubbleGroup = new THREE.Group();

        // Main bubble sphere
        const bubbleGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const bubbleMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0.6,
            roughness: 0.1,
            metalness: 0.1,
            transmission: 0.8,
            thickness: 0.5,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1
        });
        const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
        bubbleGroup.add(bubble);

        // Inner glow
        const glowGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ddff,
            transparent: true,
            opacity: 0.3
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        bubbleGroup.add(glow);

        // Point light for effect
        const light = new THREE.PointLight(0x00ddff, 0.5, 3);
        bubbleGroup.add(light);

        return bubbleGroup;
    }

    update(deltaTime: number, combatSystem: CombatSystem): boolean {
        if (!this.isActive) return false;

        this.lifetime += deltaTime;
        
        // Check if lifetime expired
        if (this.lifetime >= this.maxLifetime) {
            this.destroy();
            return false;
        }

        // Move projectile
        this.group.position.add(this.velocity.clone().multiplyScalar(deltaTime));

        // Boundary check
        if (Math.abs(this.group.position.x) > 50 || 
            Math.abs(this.group.position.z) > 50 ||
            this.group.position.y < 0 || this.group.position.y > 10) {
            this.destroy();
            return false;
        }

        // Check collision with enemies
        const hit = combatSystem.checkSphereCollision(
            this.group.position,
            this.radius,
            this.team
        );

        if (hit) {
            hit.takeDamage(this.damage);
            this.createPopEffect();
            this.destroy();
            return false;
        }

        // Animate bubble
        const time = Date.now() * 0.003;
        this.group.rotation.x = time;
        this.group.rotation.y = time * 0.7;
        this.group.scale.setScalar(1 + Math.sin(time * 5) * 0.1);

        return true;
    }

    private createPopEffect(): void {
        // Create particle burst effect
        const particleCount = 10;
        const particles: THREE.Mesh[] = [];

        for (let i = 0; i < particleCount; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.05, 8, 8);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: 0x88ccff,
                transparent: true,
                opacity: 0.8
            });
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            const angle = (i / particleCount) * Math.PI * 2;
            const velocity = new THREE.Vector3(
                Math.cos(angle) * 0.1,
                Math.random() * 0.1,
                Math.sin(angle) * 0.1
            );
            
            particle.position.copy(this.group.position);
            this.scene.add(particle);
            particles.push(particle);

            // Animate particles
            const startTime = Date.now();
            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                if (elapsed > 0.5) {
                    this.scene.remove(particle);
                    return;
                }
                
                particle.position.add(velocity);
                particle.material.opacity = 0.8 * (1 - elapsed * 2);
                particle.scale.multiplyScalar(0.95);
                
                requestAnimationFrame(animate);
            };
            animate();
        }
    }

    getPosition(): THREE.Vector3 {
        return this.group.position.clone();
    }

    destroy(): void {
        this.isActive = false;
        this.scene.remove(this.group);
    }
}

export class ProjectileManager {
    private scene: THREE.Scene;
    private projectiles: Projectile[] = [];
    private combatSystem: CombatSystem;

    constructor(scene: THREE.Scene, combatSystem: CombatSystem) {
        this.scene = scene;
        this.combatSystem = combatSystem;
    }

    shootBubble(
        position: THREE.Vector3,
        direction: THREE.Vector3,
        speed: number = 15,
        damage: number = 20
    ): void {
        const projectile = new Projectile(
            this.scene,
            position.clone(),
            direction,
            speed,
            damage,
            Team.PLAYER,
            3.0
        );
        this.projectiles.push(projectile);
    }

    update(deltaTime: number = 0.016): void {
        // Update all projectiles and remove inactive ones
        this.projectiles = this.projectiles.filter(projectile => 
            projectile.update(deltaTime, this.combatSystem)
        );
    }

    getActiveProjectileCount(): number {
        return this.projectiles.length;
    }

    clear(): void {
        this.projectiles.forEach(p => p.destroy());
        this.projectiles = [];
    }
}
