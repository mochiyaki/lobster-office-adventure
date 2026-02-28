import * as THREE from 'three';

export interface Checkpoint {
    name: string;
    position: THREE.Vector3;
    color: number;
    npc: string;
    description: string;
    upgrades: Array<{
        type: string;
        value: number | string;
        name: string;
        description: string;
    }>;
    group: THREE.Group;
    ring: THREE.Mesh;
    visited: boolean;
}

export class Checkpoints {
    private scene: THREE.Scene;
    private lobster: any;
    private checkpoints: Checkpoint[] = [];
    private visitedCheckpoints: Set<string> = new Set();

    constructor(scene: THREE.Scene, lobster: any) {
        this.scene = scene;
        this.lobster = lobster;
        
        this.createCheckpoints();
    }

    createCheckpoints() {
        const checkpointData = [
            {
                name: 'Snowflake',
                position: new THREE.Vector3(-15, 0, -15),
                color: 0x29abe2,
                npc: 'Snowflake Expert',
                description: 'Master of data processing and cloud analytics',
                upgrades: [
                    { type: 'speed', value: 0.3, name: 'Data Processing Speed', description: 'Move 30% faster!' },
                    { type: 'ability', value: 'snowflake_insight', name: 'Snowflake Insight', description: 'Unlock data visualization abilities' }
                ]
            },
            {
                name: 'Composio',
                position: new THREE.Vector3(15, 0, -15),
                color: 0x9c27b0,
                npc: 'Integration Specialist',
                description: 'Expert in connecting systems and workflows',
                upgrades: [
                    { type: 'range', value: 2.0, name: 'Extended Integration Range', description: 'Interact from further away' },
                    { type: 'ability', value: 'composio_connect', name: 'Composio Connect', description: 'Link with distant objects' }
                ]
            },
            {
                name: 'Skyfire',
                position: new THREE.Vector3(-15, 0, 15),
                color: 0xff6b35,
                npc: 'Payment Pioneer',
                description: 'Specialist in AI payment systems',
                upgrades: [
                    { type: 'ability', value: 'skyfire_wallet', name: 'Skyfire Wallet', description: 'Unlock premium areas' },
                    { type: 'speed', value: 0.2, name: 'Transaction Speed', description: 'Faster movement in special zones' }
                ]
            },
            {
                name: 'CrewAI',
                position: new THREE.Vector3(15, 0, 15),
                color: 0x00c853,
                npc: 'AI Coordinator',
                description: 'Master of multi-agent collaboration',
                upgrades: [
                    { type: 'ability', value: 'crew_companion', name: 'AI Companion', description: 'Summon helper AI agents' },
                    { type: 'range', value: 1.5, name: 'Team Coordination', description: 'Better awareness of surroundings' }
                ]
            }
        ];

        checkpointData.forEach(data => {
            const checkpoint = this.createCheckpoint(data);
            this.checkpoints.push(checkpoint);
        });
    }

    createCheckpoint(data) {
        const checkpointGroup = new THREE.Group();

        // Counter base
        const baseGeometry = new THREE.BoxGeometry(3, 1.5, 2);
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0x555555,
            roughness: 0.5
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.75;
        base.castShadow = true;
        checkpointGroup.add(base);

        // Counter top
        const topGeometry = new THREE.BoxGeometry(3.2, 0.2, 2.2);
        const topMaterial = new THREE.MeshStandardMaterial({
            color: data.color,
            roughness: 0.3,
            metalness: 0.5
        });
        const top = new THREE.Mesh(topGeometry, topMaterial);
        top.position.y = 1.6;
        top.castShadow = true;
        checkpointGroup.add(top);

        // Glowing indicator
        const indicatorGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1);
        const indicatorMaterial = new THREE.MeshStandardMaterial({
            color: data.color,
            emissive: data.color,
            emissiveIntensity: 0.5
        });
        const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
        indicator.position.y = 1.75;
        checkpointGroup.add(indicator);

        // Point light for glow
        const pointLight = new THREE.PointLight(data.color, 1, 10);
        pointLight.position.y = 2;
        checkpointGroup.add(pointLight);

        // Animated ring
        const ringGeometry = new THREE.TorusGeometry(1.5, 0.1, 16, 32);
        const ringMaterial = new THREE.MeshStandardMaterial({
            color: data.color,
            emissive: data.color,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.6
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.1;
        checkpointGroup.add(ring);

        // Sign/Label (create 3D text effect with simple geometry)
        const labelGeometry = new THREE.PlaneGeometry(2, 0.5);
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 512, 128);
        ctx.fillStyle = '#' + data.color.toString(16).padStart(6, '0');
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(data.name, 256, 64);
        
        const labelTexture = new THREE.CanvasTexture(canvas);
        const labelMaterial = new THREE.MeshBasicMaterial({
            map: labelTexture,
            transparent: true
        });
        const label = new THREE.Mesh(labelGeometry, labelMaterial);
        label.position.set(0, 2.5, 0);
        checkpointGroup.add(label);

        checkpointGroup.position.copy(data.position);
        this.scene.add(checkpointGroup);

        return {
            name: data.name,
            position: data.position,
            color: data.color,
            npc: data.npc,
            description: data.description,
            upgrades: data.upgrades,
            group: checkpointGroup,
            ring: ring,
            visited: false
        };
    }

    update() {
        const lobsterPos = this.lobster.getPosition();
        let nearestCheckpoint = null;
        let minDistance = Infinity;

        this.checkpoints.forEach(checkpoint => {
            const distance = lobsterPos.distanceTo(checkpoint.position);
            
            // Animate ring
            checkpoint.ring.rotation.z += 0.01;
            checkpoint.ring.position.y = 0.1 + Math.sin(Date.now() * 0.002) * 0.2;

            if (distance < this.lobster.getSkills().interactionRange) {
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestCheckpoint = checkpoint;
                }
            }
        });

        return nearestCheckpoint;
    }

    visitCheckpoint(checkpointName) {
        this.visitedCheckpoints.add(checkpointName);
        const checkpoint = this.checkpoints.find(cp => cp.name === checkpointName);
        if (checkpoint) {
            checkpoint.visited = true;
        }
    }

    getCheckpoint(name) {
        return this.checkpoints.find(cp => cp.name === name);
    }

    getVisitedCount() {
        return this.visitedCheckpoints.size;
    }

    getTotalCount() {
        return this.checkpoints.length;
    }
}
