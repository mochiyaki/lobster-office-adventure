import * as THREE from 'three';

interface ProtectedCreature {
    type: string;
    group: THREE.Group;
    animationOffset: number;
    baseY?: number;
    swimDirection?: THREE.Vector3;
    position: THREE.Vector3;
    health: number;
    maxHealth: number;
    isDead: boolean;
}

export class SeaCreatures {
    constructor(scene) {
        this.scene = scene;
        this.creatures = [];
        this.protectedCreatures = [];
        this.createCreatures();
    }

    createCrab(position, color = 0xff6347) {
        const crabGroup = new THREE.Group();

        // Body
        const bodyGeometry = new THREE.SphereGeometry(0.6, 16, 16);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.6
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.scale.set(1, 0.6, 1);
        body.position.y = 0.4;
        body.castShadow = true;
        crabGroup.add(body);

        // Claws
        const clawMaterial = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.5
        });

        for (let side = -1; side <= 1; side += 2) {
            // Claw arm
            const arm = new THREE.Mesh(
                new THREE.CylinderGeometry(0.1, 0.1, 0.8),
                clawMaterial
            );
            arm.position.set(side * 0.5, 0.4, 0.3);
            arm.rotation.z = side * Math.PI / 3;
            crabGroup.add(arm);

            // Claw pincer
            const claw = new THREE.Mesh(
                new THREE.BoxGeometry(0.25, 0.15, 0.3),
                clawMaterial
            );
            claw.position.set(side * 0.9, 0.4, 0.6);
            crabGroup.add(claw);
        }

        // Legs (4 per side)
        for (let side = -1; side <= 1; side += 2) {
            for (let i = 0; i < 4; i++) {
                const leg = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.05, 0.05, 0.6),
                    clawMaterial
                );
                leg.position.set(
                    side * 0.6,
                    0.2,
                    -0.3 + i * 0.2
                );
                leg.rotation.z = side * Math.PI / 4;
                crabGroup.add(leg);
            }
        }

        // Eyes on stalks
        const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
        for (let side = -1; side <= 1; side += 2) {
            const eyeStalk = new THREE.Mesh(
                new THREE.CylinderGeometry(0.05, 0.05, 0.3),
                clawMaterial
            );
            eyeStalk.position.set(side * 0.3, 0.7, 0.3);
            crabGroup.add(eyeStalk);

            const eye = new THREE.Mesh(
                new THREE.SphereGeometry(0.08),
                eyeMaterial
            );
            eye.position.set(side * 0.3, 0.85, 0.3);
            crabGroup.add(eye);
        }

        crabGroup.position.copy(position);
        this.scene.add(crabGroup);

        return {
            type: 'crab',
            group: crabGroup,
            animationOffset: Math.random() * Math.PI * 2
        };
    }

    createJellyfish(position, color = 0xff69b4) {
        const jellyfishGroup = new THREE.Group();

        // Bell/dome
        const bellGeometry = new THREE.SphereGeometry(0.8, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const bellMaterial = new THREE.MeshStandardMaterial({
            color: color,
            transparent: true,
            opacity: 0.7,
            roughness: 0.2,
            metalness: 0.1
        });
        const bell = new THREE.Mesh(bellGeometry, bellMaterial);
        bell.position.y = 0;
        jellyfishGroup.add(bell);

        // Tentacles
        const tentacleMaterial = new THREE.MeshStandardMaterial({
            color: color,
            transparent: true,
            opacity: 0.6
        });

        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const radius = 0.6;
            
            const tentacle = new THREE.Mesh(
                new THREE.CylinderGeometry(0.03, 0.01, 1.5),
                tentacleMaterial
            );
            tentacle.position.set(
                Math.cos(angle) * radius,
                -0.75,
                Math.sin(angle) * radius
            );
            jellyfishGroup.add(tentacle);
        }

        // Glow
        const glowLight = new THREE.PointLight(color, 0.5, 5);
        glowLight.position.y = 0;
        jellyfishGroup.add(glowLight);

        jellyfishGroup.position.copy(position);
        this.scene.add(jellyfishGroup);

        return {
            type: 'jellyfish',
            group: jellyfishGroup,
            animationOffset: Math.random() * Math.PI * 2,
            baseY: position.y
        };
    }

    createOctopus(position, color = 0x9370db) {
        const octopusGroup = new THREE.Group();

        // Head/mantle
        const headGeometry = new THREE.SphereGeometry(0.8, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.5
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1;
        head.scale.set(1, 1.2, 1);
        head.castShadow = true;
        octopusGroup.add(head);

        // Eyes
        const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const pupilMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });

        for (let side = -1; side <= 1; side += 2) {
            const eye = new THREE.Mesh(
                new THREE.SphereGeometry(0.2),
                eyeMaterial
            );
            eye.position.set(side * 0.4, 1.2, 0.6);
            octopusGroup.add(eye);

            const pupil = new THREE.Mesh(
                new THREE.SphereGeometry(0.1),
                pupilMaterial
            );
            pupil.position.set(side * 0.4, 1.2, 0.7);
            octopusGroup.add(pupil);
        }

        // Eight tentacles
        const tentacleMaterial = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.6
        });

        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const radius = 0.6;
            
            // Create curved tentacle with multiple segments
            const tentacleGroup = new THREE.Group();
            const segments = 5;
            
            for (let j = 0; j < segments; j++) {
                const segment = new THREE.Mesh(
                    new THREE.CylinderGeometry(
                        0.15 - j * 0.02,
                        0.15 - (j + 1) * 0.02,
                        0.3
                    ),
                    tentacleMaterial
                );
                segment.position.set(
                    Math.cos(angle) * (radius + j * 0.1),
                    0.5 - j * 0.3,
                    Math.sin(angle) * (radius + j * 0.1)
                );
                segment.rotation.x = Math.PI / 8;
                tentacleGroup.add(segment);
            }
            
            octopusGroup.add(tentacleGroup);
        }

        octopusGroup.position.copy(position);
        this.scene.add(octopusGroup);

        return {
            type: 'octopus',
            group: octopusGroup,
            animationOffset: Math.random() * Math.PI * 2
        };
    }

    createShrimp(position, color = 0xffa07a) {
        const shrimpGroup = new THREE.Group();

        // Body segments
        const segmentMaterial = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.4
        });

        for (let i = 0; i < 6; i++) {
            const segment = new THREE.Mesh(
                new THREE.SphereGeometry(0.2 - i * 0.02, 12, 12),
                segmentMaterial
            );
            segment.position.set(0, 0.3, -i * 0.3);
            segment.scale.set(1, 0.8, 1);
            segment.castShadow = true;
            shrimpGroup.add(segment);
        }

        // Head/rostrum
        const head = new THREE.Mesh(
            new THREE.ConeGeometry(0.15, 0.4, 12),
            segmentMaterial
        );
        head.position.set(0, 0.3, 0.3);
        head.rotation.x = -Math.PI / 2;
        shrimpGroup.add(head);

        // Antennae
        const antennaMaterial = new THREE.MeshStandardMaterial({
            color: 0xff8c69
        });

        for (let side = -1; side <= 1; side += 2) {
            const antenna = new THREE.Mesh(
                new THREE.CylinderGeometry(0.02, 0.01, 0.8),
                antennaMaterial
            );
            antenna.position.set(side * 0.1, 0.4, 0.4);
            antenna.rotation.z = side * Math.PI / 6;
            antenna.rotation.x = -Math.PI / 4;
            shrimpGroup.add(antenna);
        }

        // Swimming legs
        for (let i = 0; i < 5; i++) {
            for (let side = -1; side <= 1; side += 2) {
                const leg = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.02, 0.02, 0.3),
                    antennaMaterial
                );
                leg.position.set(side * 0.2, 0.15, -i * 0.3);
                leg.rotation.z = side * Math.PI / 3;
                shrimpGroup.add(leg);
            }
        }

        // Tail fan
        const tailFan = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.05, 0.3),
            segmentMaterial
        );
        tailFan.position.set(0, 0.3, -1.7);
        shrimpGroup.add(tailFan);

        shrimpGroup.position.copy(position);
        this.scene.add(shrimpGroup);

        return {
            type: 'shrimp',
            group: shrimpGroup,
            animationOffset: Math.random() * Math.PI * 2
        };
    }

    createFish(position, color = 0x4169e1) {
        const fishGroup = new THREE.Group();

        // Body
        const bodyGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.3,
            metalness: 0.2
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.scale.set(1.5, 1, 1);
        body.position.y = 0.5;
        body.castShadow = true;
        fishGroup.add(body);

        // Tail
        const tailGeometry = new THREE.ConeGeometry(0.4, 0.6, 8);
        const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
        tail.rotation.x = -Math.PI / 2;
        tail.position.set(0, 0.5, -0.8);
        fishGroup.add(tail);

        // Dorsal fin
        const finMaterial = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.4
        });
        const dorsalFin = new THREE.Mesh(
            new THREE.ConeGeometry(0.2, 0.5, 4),
            finMaterial
        );
        dorsalFin.rotation.z = Math.PI;
        dorsalFin.position.set(0, 0.9, -0.2);
        fishGroup.add(dorsalFin);

        // Side fins
        for (let side = -1; side <= 1; side += 2) {
            const sideFin = new THREE.Mesh(
                new THREE.ConeGeometry(0.15, 0.3, 4),
                finMaterial
            );
            sideFin.rotation.z = side * Math.PI / 2;
            sideFin.position.set(side * 0.6, 0.5, 0.2);
            fishGroup.add(sideFin);
        }

        // Eyes
        const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const pupilMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });

        for (let side = -1; side <= 1; side += 2) {
            const eye = new THREE.Mesh(
                new THREE.SphereGeometry(0.12),
                eyeMaterial
            );
            eye.position.set(side * 0.3, 0.6, 0.5);
            fishGroup.add(eye);

            const pupil = new THREE.Mesh(
                new THREE.SphereGeometry(0.06),
                pupilMaterial
            );
            pupil.position.set(side * 0.32, 0.6, 0.55);
            fishGroup.add(pupil);
        }

        fishGroup.position.copy(position);
        this.scene.add(fishGroup);

        return {
            type: 'fish',
            group: fishGroup,
            animationOffset: Math.random() * Math.PI * 2,
            swimDirection: new THREE.Vector3(
                (Math.random() - 0.5) * 0.02,
                0,
                (Math.random() - 0.5) * 0.02
            )
        };
    }

    createCreatures() {
        // Create multiple crabs (not protected - decorative)
        this.creatures.push(this.createCrab(new THREE.Vector3(-10, 0.5, -8), 0xff6347));
        this.creatures.push(this.createCrab(new THREE.Vector3(12, 0.5, 10), 0xff4500));
        this.creatures.push(this.createCrab(new THREE.Vector3(-8, 0.5, 12), 0xdc143c));

        // Create jellyfish (PROTECTED - need protection)
        const jelly1 = this.createJellyfish(new THREE.Vector3(-5, 4, 5), 0xff69b4);
        this.creatures.push(jelly1);
        this.protectedCreatures.push(this.makeProtected(jelly1));
        
        const jelly2 = this.createJellyfish(new THREE.Vector3(8, 5, -10), 0xda70d6);
        this.creatures.push(jelly2);
        this.protectedCreatures.push(this.makeProtected(jelly2));
        
        const jelly3 = this.createJellyfish(new THREE.Vector3(0, 4.5, 0), 0xffc0cb);
        this.creatures.push(jelly3);
        this.protectedCreatures.push(this.makeProtected(jelly3));

        // Create octopuses (not protected - decorative)
        this.creatures.push(this.createOctopus(new THREE.Vector3(5, 0, -12), 0x9370db));
        this.creatures.push(this.createOctopus(new THREE.Vector3(-12, 0, 5), 0x8a2be2));

        // Create shrimp (not protected - decorative)
        this.creatures.push(this.createShrimp(new THREE.Vector3(10, 0.3, -5), 0xffa07a));
        this.creatures.push(this.createShrimp(new THREE.Vector3(-6, 0.3, -10), 0xff7f50));
        this.creatures.push(this.createShrimp(new THREE.Vector3(0, 0.3, 8), 0xffb6c1));

        // Create fish (PROTECTED - need protection)
        const fish1 = this.createFish(new THREE.Vector3(3, 3, -5), 0x4169e1);
        this.creatures.push(fish1);
        this.protectedCreatures.push(this.makeProtected(fish1));
        
        const fish2 = this.createFish(new THREE.Vector3(-8, 3.5, -3), 0x1e90ff);
        this.creatures.push(fish2);
        this.protectedCreatures.push(this.makeProtected(fish2));
        
        const fish3 = this.createFish(new THREE.Vector3(6, 2.5, 8), 0x00bfff);
        this.creatures.push(fish3);
        this.protectedCreatures.push(this.makeProtected(fish3));
        
        const fish4 = this.createFish(new THREE.Vector3(-3, 3, 10), 0x87ceeb);
        this.creatures.push(fish4);
        this.protectedCreatures.push(this.makeProtected(fish4));
    }

    makeProtected(creature): ProtectedCreature {
        const protectedCreature = {
            ...creature,
            position: creature.group.position,
            health: 50,
            maxHealth: 50,
            isDead: false,
            takeDamage: function(damage: number) {
                if (this.isDead) return;
                this.health -= damage;
                if (this.health <= 0) {
                    this.health = 0;
                    this.isDead = true;
                }
            }
        };
        return protectedCreature;
    }

    update() {
        const time = Date.now() * 0.001;

        this.creatures.forEach(creature => {
            switch(creature.type) {
                case 'crab':
                    // Crabs scuttle side to side
                    creature.group.position.x += Math.sin(time * 2 + creature.animationOffset) * 0.01;
                    creature.group.rotation.y = Math.sin(time + creature.animationOffset) * 0.2;
                    break;

                case 'jellyfish':
                    // Jellyfish bob up and down
                    creature.group.position.y = creature.baseY + Math.sin(time + creature.animationOffset) * 0.5;
                    creature.group.rotation.y += 0.005;
                    
                    // Pulse the bell
                    const scale = 1 + Math.sin(time * 2 + creature.animationOffset) * 0.1;
                    creature.group.children[0].scale.y = scale;
                    break;

                case 'octopus':
                    // Octopus gentle sway
                    creature.group.rotation.y = Math.sin(time * 0.5 + creature.animationOffset) * 0.3;
                    creature.group.position.y = 0.5 + Math.sin(time * 0.7 + creature.animationOffset) * 0.1;
                    break;

                case 'shrimp':
                    // Shrimp hop around
                    const hopTime = time * 3 + creature.animationOffset;
                    creature.group.position.y = 0.3 + Math.abs(Math.sin(hopTime)) * 0.3;
                    creature.group.rotation.x = Math.sin(hopTime) * 0.2;
                    break;

                case 'fish':
                    // Fish swim around
                    creature.group.position.add(creature.swimDirection);
                    creature.group.rotation.y += 0.01;
                    
                    // Tail wave
                    creature.group.children[1].rotation.y = Math.sin(time * 5 + creature.animationOffset) * 0.3;
                    
                    // Boundary checking - turn around if hitting walls
                    if (Math.abs(creature.group.position.x) > 20 || Math.abs(creature.group.position.z) > 20) {
                        creature.swimDirection.multiplyScalar(-1);
                        creature.group.rotation.y += Math.PI;
                    }
                    break;
            }
        });

        // Update protected creatures - fade out if dead
        this.protectedCreatures.forEach(creature => {
            if (creature.isDead && creature.group.parent) {
                creature.group.scale.multiplyScalar(0.98);
                if (creature.group.scale.x < 0.1) {
                    this.scene.remove(creature.group);
                }
            }
        });
    }

    getProtectedCreatures(): ProtectedCreature[] {
        return this.protectedCreatures.filter(c => !c.isDead);
    }

    getProtectedCreaturePositions(): THREE.Vector3[] {
        return this.protectedCreatures
            .filter(c => !c.isDead)
            .map(c => c.position);
    }

    getProtectedCreatureCount(): number {
        return this.protectedCreatures.length;
    }
}
