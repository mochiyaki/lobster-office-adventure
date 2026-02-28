import * as THREE from 'three';

export class Scene {
    private scene: THREE.Scene;

    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb); // Sky blue
        this.scene.fog = new THREE.Fog(0x87ceeb, 80, 150);
        
        this.setupLighting();
        this.createOfficeEnvironment();
    }

    private setupLighting(): void {
        // Ambient light for overall illumination
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Directional light (sunlight through windows)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -50;
        this.scene.add(directionalLight);

        // Point lights for ambiance
        const pointLights = [
            new THREE.Vector3(-20, 5, -20),
            new THREE.Vector3(20, 5, 20),
            new THREE.Vector3(-20, 5, 20),
            new THREE.Vector3(20, 5, -20)
        ];

        pointLights.forEach(pos => {
            const light = new THREE.PointLight(0xffffff, 0.3, 30);
            light.position.copy(pos);
            this.scene.add(light);
        });
    }

    private createOfficeEnvironment(): void {
        // Floor (enlarged)
        const floorGeometry = new THREE.PlaneGeometry(100, 100);
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: 0x808080,
            roughness: 0.3,
            metalness: 0.1
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // Ceiling (enlarged)
        const ceilingGeometry = new THREE.PlaneGeometry(100, 100);
        const ceilingMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.8
        });
        const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = 8;
        this.scene.add(ceiling);

        // Glass walls (transparent)
        this.createGlassWalls();

        // Interior walls (solid)
        this.createInteriorWalls();

        // Add furniture and decorative elements
        this.addFurniture();
        this.addDecorativeElements();
    }

    private createGlassWalls(): void {
        const glassMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0.3,
            roughness: 0.1,
            metalness: 0.1,
            transmission: 0.9,
            thickness: 0.5
        });

        const walls = [
            { pos: new THREE.Vector3(0, 4, -45), rot: 0 },
            { pos: new THREE.Vector3(0, 4, 45), rot: Math.PI },
            { pos: new THREE.Vector3(-45, 4, 0), rot: Math.PI / 2 },
            { pos: new THREE.Vector3(45, 4, 0), rot: -Math.PI / 2 }
        ];

        walls.forEach(({ pos, rot }) => {
            const wall = new THREE.Mesh(
                new THREE.PlaneGeometry(90, 8),
                glassMaterial
            );
            wall.position.copy(pos);
            wall.rotation.y = rot;
            this.scene.add(wall);
        });
    }

    private createInteriorWalls(): void {
        // Interior walls removed to allow access to all checkpoints
    }

    private addFurniture(): void {
        const woodMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b4513,
            roughness: 0.7
        });

        const fabricMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a4a4a,
            roughness: 0.8
        });

        const metalMaterial = new THREE.MeshStandardMaterial({
            color: 0x888888,
            roughness: 0.3,
            metalness: 0.8
        });

        // Sofa sets
        this.createSofa(new THREE.Vector3(-25, 0, 5), Math.PI / 2, fabricMaterial, woodMaterial);
        this.createSofa(new THREE.Vector3(25, 0, -5), -Math.PI / 2, fabricMaterial, woodMaterial);

        // Coffee tables
        [new THREE.Vector3(-20, 0, 5), new THREE.Vector3(20, 0, -5), new THREE.Vector3(0, 0, 25)].forEach(pos => {
            this.createCoffeeTable(pos, woodMaterial);
        });

        // Work tables with laptops
        this.createWorkTable(new THREE.Vector3(-30, 0, -25), woodMaterial, metalMaterial);
        this.createWorkTable(new THREE.Vector3(30, 0, 25), woodMaterial, metalMaterial);

        // Chairs
        const chairPositions: Array<{ pos: THREE.Vector3, rot: number }> = [
            { pos: new THREE.Vector3(-30, 0, -23), rot: Math.PI },
            { pos: new THREE.Vector3(-28, 0, -25), rot: Math.PI / 2 },
            { pos: new THREE.Vector3(30, 0, 27), rot: 0 },
            { pos: new THREE.Vector3(32, 0, 25), rot: -Math.PI / 2 },
            { pos: new THREE.Vector3(-10, 0, 20), rot: Math.PI / 4 },
            { pos: new THREE.Vector3(10, 0, -20), rot: -Math.PI / 4 }
        ];

        chairPositions.forEach(({ pos, rot }) => {
            this.createChair(pos, rot, fabricMaterial, metalMaterial);
        });

        // Projector and screen
        this.createProjector(new THREE.Vector3(0, 6, -35), metalMaterial);
        this.createProjectorScreen(new THREE.Vector3(0, 3, -40));
    }

    private createSofa(position: THREE.Vector3, rotation: number, fabricMaterial: THREE.Material, woodMaterial: THREE.Material): void {
        const sofaGroup = new THREE.Group();

        // Seat
        const seat = new THREE.Mesh(
            new THREE.BoxGeometry(4, 0.5, 1.5),
            fabricMaterial
        );
        seat.position.y = 0.7;
        seat.castShadow = true;
        sofaGroup.add(seat);

        // Backrest
        const backrest = new THREE.Mesh(
            new THREE.BoxGeometry(4, 1.2, 0.3),
            fabricMaterial
        );
        backrest.position.set(0, 1.3, -0.6);
        backrest.castShadow = true;
        sofaGroup.add(backrest);

        // Armrests
        [-1.85, 1.85].forEach(x => {
            const armrest = new THREE.Mesh(
                new THREE.BoxGeometry(0.3, 0.8, 1.5),
                fabricMaterial
            );
            armrest.position.set(x, 1, 0);
            sofaGroup.add(armrest);
        });

        // Legs
        for (let x = -1.5; x <= 1.5; x += 3) {
            for (let z = -0.5; z <= 0.5; z += 1) {
                const leg = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.08, 0.08, 0.4),
                    woodMaterial
                );
                leg.position.set(x, 0.2, z);
                sofaGroup.add(leg);
            }
        }

        sofaGroup.position.copy(position);
        sofaGroup.rotation.y = rotation;
        this.scene.add(sofaGroup);
    }

    private createCoffeeTable(position: THREE.Vector3, woodMaterial: THREE.Material): void {
        const tableGroup = new THREE.Group();

        const top = new THREE.Mesh(
            new THREE.BoxGeometry(2, 0.1, 1.2),
            woodMaterial
        );
        top.position.y = 0.5;
        top.castShadow = true;
        top.receiveShadow = true;
        tableGroup.add(top);

        for (let x = -0.8; x <= 0.8; x += 1.6) {
            for (let z = -0.4; z <= 0.4; z += 0.8) {
                const leg = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.05, 0.05, 0.5),
                    woodMaterial
                );
                leg.position.set(x, 0.25, z);
                leg.castShadow = true;
                tableGroup.add(leg);
            }
        }

        tableGroup.position.copy(position);
        this.scene.add(tableGroup);
    }

    private createWorkTable(position: THREE.Vector3, woodMaterial: THREE.Material, metalMaterial: THREE.Material): void {
        const tableGroup = new THREE.Group();

        const top = new THREE.Mesh(
            new THREE.BoxGeometry(3, 0.1, 1.5),
            woodMaterial
        );
        top.position.y = 0.75;
        top.castShadow = true;
        top.receiveShadow = true;
        tableGroup.add(top);

        for (let x = -1.2; x <= 1.2; x += 2.4) {
            for (let z = -0.6; z <= 0.6; z += 1.2) {
                const leg = new THREE.Mesh(
                    new THREE.BoxGeometry(0.08, 0.75, 0.08),
                    metalMaterial
                );
                leg.position.set(x, 0.375, z);
                leg.castShadow = true;
                tableGroup.add(leg);
            }
        }

        this.createLaptop(tableGroup, new THREE.Vector3(0, 0.85, 0));

        tableGroup.position.copy(position);
        this.scene.add(tableGroup);
    }

    private createLaptop(parent: THREE.Group, position: THREE.Vector3): void {
        const laptopGroup = new THREE.Group();

        const laptopMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.4,
            metalness: 0.6
        });

        const screenMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a2e,
            emissive: 0x0f3460,
            emissiveIntensity: 0.3
        });

        const base = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, 0.03, 0.4),
            laptopMaterial
        );
        base.castShadow = true;
        laptopGroup.add(base);

        const screen = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, 0.4, 0.03),
            screenMaterial
        );
        screen.position.set(0, 0.2, -0.15);
        screen.rotation.x = -Math.PI / 6;
        screen.castShadow = true;
        laptopGroup.add(screen);

        laptopGroup.position.copy(position);
        parent.add(laptopGroup);
    }

    private createChair(position: THREE.Vector3, rotation: number, fabricMaterial: THREE.Material, metalMaterial: THREE.Material): void {
        const chairGroup = new THREE.Group();

        const seat = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, 0.1, 0.6),
            fabricMaterial
        );
        seat.position.y = 0.5;
        seat.castShadow = true;
        chairGroup.add(seat);

        const backrest = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, 0.7, 0.1),
            fabricMaterial
        );
        backrest.position.set(0, 0.85, -0.25);
        backrest.castShadow = true;
        chairGroup.add(backrest);

        for (let x = -0.25; x <= 0.25; x += 0.5) {
            for (let z = -0.25; z <= 0.25; z += 0.5) {
                const leg = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.03, 0.03, 0.5),
                    metalMaterial
                );
                leg.position.set(x, 0.25, z);
                chairGroup.add(leg);
            }
        }

        chairGroup.position.copy(position);
        chairGroup.rotation.y = rotation;
        this.scene.add(chairGroup);
    }

    private createProjector(position: THREE.Vector3, metalMaterial: THREE.Material): void {
        const projectorGroup = new THREE.Group();

        const body = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.3, 0.4, 16),
            metalMaterial
        );
        body.rotation.z = Math.PI / 2;
        body.castShadow = true;
        projectorGroup.add(body);

        const lensMaterial = new THREE.MeshStandardMaterial({
            color: 0x000000,
            emissive: 0xffff00,
            emissiveIntensity: 0.5
        });
        const lens = new THREE.Mesh(
            new THREE.CylinderGeometry(0.15, 0.15, 0.05),
            lensMaterial
        );
        lens.rotation.z = Math.PI / 2;
        lens.position.z = 0.22;
        projectorGroup.add(lens);

        const bracket = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 0.5, 0.2),
            metalMaterial
        );
        bracket.position.y = 0.25;
        projectorGroup.add(bracket);

        projectorGroup.position.copy(position);
        this.scene.add(projectorGroup);
    }

    private createProjectorScreen(position: THREE.Vector3): void {
        const screenGroup = new THREE.Group();

        const screenMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.8
        });
        const screen = new THREE.Mesh(
            new THREE.PlaneGeometry(8, 4.5),
            screenMaterial
        );
        screen.receiveShadow = true;
        screenGroup.add(screen);

        const frameMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.5
        });
        
        const frames = [
            { size: [8.2, 0.1, 0.1], pos: [0, 2.3, -0.05] },
            { size: [8.2, 0.1, 0.1], pos: [0, -2.3, -0.05] },
            { size: [0.1, 4.5, 0.1], pos: [-4.05, 0, -0.05] },
            { size: [0.1, 4.5, 0.1], pos: [4.05, 0, -0.05] }
        ];

        frames.forEach(({ size, pos }) => {
            const frame = new THREE.Mesh(
                new THREE.BoxGeometry(...size as [number, number, number]),
                frameMaterial
            );
            frame.position.set(...pos as [number, number, number]);
            screenGroup.add(frame);
        });

        screenGroup.position.copy(position);
        this.scene.add(screenGroup);
    }

    private addDecorativeElements(): void {
        const plantMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22 });
        
        for (let i = 0; i < 4; i++) {
            const plant = new THREE.Mesh(
                new THREE.ConeGeometry(0.5, 2, 8),
                plantMaterial
            );
            const angle = (i / 4) * Math.PI * 2;
            plant.position.set(
                Math.cos(angle) * 20,
                1,
                Math.sin(angle) * 20
            );
            this.scene.add(plant);
        }

        const gridHelper = new THREE.GridHelper(100, 100, 0x444444, 0x222222);
        gridHelper.position.y = 0.01;
        this.scene.add(gridHelper);
    }

    public getScene(): THREE.Scene {
        return this.scene;
    }
}
