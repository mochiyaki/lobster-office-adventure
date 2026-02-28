import * as THREE from 'three';
import { Scene as GameScene } from './scene';
import { Lobster } from './lobster';
import { Checkpoints, type Checkpoint } from './checkpoints';
import { UI } from './ui';
import { NPCSystem } from './npcs';
import { SeaCreatures } from './seacreatures';
import { CombatSystem } from './combat';
import { ProjectileManager } from './projectiles';
import { EnemyManager } from './enemies';
import { MissionSystem } from './mission';
import { AudioManager } from './audio';

class Game {
    private canvas: HTMLCanvasElement;
    private renderer: THREE.WebGLRenderer;
    private camera: THREE.PerspectiveCamera;
    private scene: THREE.Scene;
    private sceneManager: GameScene;
    private lobster: Lobster;
    private checkpoints: Checkpoints;
    private seaCreatures: SeaCreatures;
    private ui: UI;
    private npcSystem: NPCSystem;
    
    // Combat systems
    private combatSystem: CombatSystem;
    private projectileManager: ProjectileManager;
    private enemyManager: EnemyManager;
    private missionSystem: MissionSystem;
    private audioManager: AudioManager;
    
    private cameraDistance: number = 8;
    private cameraHeight: number = 5;
    private cameraAngle: number = 0;
    
    private lastTime: number = 0;
    private audioEnabled: boolean = false;

    constructor() {
        const canvasElement = document.getElementById('game-canvas');
        if (!canvasElement || !(canvasElement instanceof HTMLCanvasElement)) {
            throw new Error('Canvas element not found');
        }
        this.canvas = canvasElement;
        
        this.setupRenderer();
        this.setupCamera();
        
        // Initialize game
        this.initializeGame();
        
        // Mouse controls for camera
        this.setupMouseControls();
        
        // Setup audio toggle
        this.setupAudioToggle();
        
        // Start game loop
        this.lastTime = performance.now();
        this.animate();
    }

    private setupAudioToggle(): void {
        const audioButton = document.getElementById('audio-toggle');
        if (!audioButton) return;

        // Toggle on button click
        audioButton.addEventListener('click', () => {
            if (this.audioManager) {
                this.audioManager.toggleMute();
                this.updateAudioButton();
            }
        });

        // Toggle with M key
        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'm') {
                if (this.audioManager) {
                    this.audioManager.toggleMute();
                    this.updateAudioButton();
                }
            }
        });
    }

    private updateAudioButton(): void {
        const audioButton = document.getElementById('audio-toggle');
        if (!audioButton || !this.audioManager) return;

        if (this.audioManager.isMuted()) {
            audioButton.textContent = '🔇';
            audioButton.classList.add('muted');
        } else {
            audioButton.textContent = '🔊';
            audioButton.classList.remove('muted');
        }
    }

    private initializeGame(): void {
        // Initialize game systems
        this.sceneManager = new GameScene();
        this.scene = this.sceneManager.getScene();
        
        // Initialize audio system
        this.audioManager = new AudioManager();
        
        // Initialize combat systems
        this.combatSystem = new CombatSystem();
        this.projectileManager = new ProjectileManager(this.scene, this.combatSystem);
        
        this.lobster = new Lobster(this.scene, this.projectileManager, this.audioManager);
        this.checkpoints = new Checkpoints(this.scene, this.lobster);
        this.seaCreatures = new SeaCreatures(this.scene);
        this.ui = new UI();
        this.npcSystem = new NPCSystem(this.checkpoints, this.lobster, this.ui);
        
        // Register lobster with combat system
        this.combatSystem.registerEntity('player', this.lobster.getHealth());
        
        // Initialize enemy and mission systems
        this.enemyManager = new EnemyManager(this.scene, this.combatSystem);
        this.missionSystem = new MissionSystem(this.seaCreatures.getProtectedCreatureCount());
        
        // Update UI with mission
        this.ui.updateMission(this.missionSystem);
        
        // Bind play again button
        this.ui.bindPlayAgain(() => this.restartGame());
        
        // Enable audio on first user interaction
        if (!this.audioEnabled) {
            const enableAudio = () => {
                this.audioManager.enableAudio();
                this.audioEnabled = true;
                document.removeEventListener('click', enableAudio);
                document.removeEventListener('keydown', enableAudio);
            };
            document.addEventListener('click', enableAudio);
            document.addEventListener('keydown', enableAudio);
        } else {
            // Restart background music if already enabled
            this.audioManager.playBackgroundMusic();
        }
    }

    private restartGame(): void {
        // Clear existing game state
        this.enemyManager.clear();
        this.projectileManager.clear();
        
        // Remove old scene
        while(this.scene.children.length > 0) {
            this.scene.remove(this.scene.children[0]);
        }
        
        // Reinitialize game
        this.initializeGame();
        
        // Hide game over screens
        this.ui.hideGameOver();
    }

    private setupRenderer(): void {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    private setupCamera(): void {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    private setupMouseControls(): void {
        let isDragging = false;
        let previousMouseX = 0;

        this.canvas.addEventListener('mousedown', (e: MouseEvent) => {
            isDragging = true;
            previousMouseX = e.clientX;
        });

        this.canvas.addEventListener('mouseup', () => {
            isDragging = false;
        });

        this.canvas.addEventListener('mousemove', (e: MouseEvent) => {
            if (isDragging) {
                const deltaX = e.clientX - previousMouseX;
                this.cameraAngle -= deltaX * 0.005;
                previousMouseX = e.clientX;
            }
        });

        this.canvas.addEventListener('mouseleave', () => {
            isDragging = false;
        });

        // Mouse wheel for zoom
        this.canvas.addEventListener('wheel', (e: WheelEvent) => {
            e.preventDefault();
            this.cameraDistance += e.deltaY * 0.01;
            this.cameraDistance = Math.max(4, Math.min(15, this.cameraDistance));
        });
    }

    private updateCamera(): void {
        const lobsterPos = this.lobster.getPosition();
        const lobsterRot = this.lobster.getRotation();
        
        // Calculate camera position behind and above the lobster
        const totalAngle = lobsterRot + this.cameraAngle;
        this.camera.position.x = lobsterPos.x - Math.sin(totalAngle) * this.cameraDistance;
        this.camera.position.y = lobsterPos.y + this.cameraHeight;
        this.camera.position.z = lobsterPos.z - Math.cos(totalAngle) * this.cameraDistance;
        
        // Look at lobster
        this.camera.lookAt(lobsterPos.x, lobsterPos.y + 1, lobsterPos.z);
    }

    private animate = (): void => {
        requestAnimationFrame(this.animate);

        // Calculate delta time
        const currentTime = performance.now();
        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1); // Cap at 100ms
        this.lastTime = currentTime;

        // Check if mission is still active
        if (this.missionSystem.isMissionActive()) {
            // Update game systems
            this.lobster.update(
                this.combatSystem,
                () => this.missionSystem.onBubbleShot(),
                () => this.missionSystem.onClawAttack()
            );
            
            const nearestCheckpoint = this.checkpoints.update();
            this.seaCreatures.update();
            this.npcSystem.update(nearestCheckpoint);
            
            // Update combat systems
            this.projectileManager.update(deltaTime);
            this.combatSystem.update();
            
            // Get protected creatures (full entities, not just positions)
            const protectedCreatures = this.seaCreatures.getProtectedCreatures();
            
            // Update enemies (pass lobster entity and protected creatures)
            this.enemyManager.update(deltaTime, this.lobster, protectedCreatures);
            
            // Check for enemy-creature collisions
            this.checkEnemyCreatureCollisions();
            
            // Check for enemy-player collisions (enemies attack lobster)
            this.checkEnemyPlayerCollisions();
            
            // Check for defeated enemies
            const enemies = this.enemyManager.getEnemies();
            enemies.forEach(enemy => {
                if (!enemy.getHealth().isAlive && enemy.isActive) {
                    this.missionSystem.onEnemyDefeated(enemy);
                }
            });
            
            // Update mission
            this.missionSystem.update(deltaTime);
            
            // Update UI
            this.ui.updateMission(this.missionSystem);
            this.ui.updateCombat(this.lobster, this.enemyManager.getEnemies());
        } else {
            // Mission ended - show appropriate screen
            if (this.missionSystem.isMissionComplete()) {
                this.ui.showMissionComplete(this.missionSystem);
                // Play mission complete sound once
                if (this.audioManager && this.audioEnabled) {
                    this.audioManager.playSound('mission-complete');
                    this.audioManager.stopBackgroundMusic();
                }
            } else if (this.missionSystem.isMissionFailed()) {
                this.ui.showGameOver(this.missionSystem);
                // Play mission failed sound once
                if (this.audioManager && this.audioEnabled) {
                    this.audioManager.playSound('mission-failed');
                    this.audioManager.stopBackgroundMusic();
                }
            }
        }
        
        this.updateCamera();

        // Render scene
        this.renderer.render(this.scene, this.camera);
    }

    private checkEnemyCreatureCollisions(): void {
        const enemies = this.enemyManager.getEnemies();
        const creatures = this.seaCreatures.getProtectedCreatures();
        
        enemies.forEach(enemy => {
            creatures.forEach(creature => {
                if (!creature.isDead && enemy.isActive) {
                    const distance = enemy.getPosition().distanceTo(creature.position);
                    if (distance < 2.0) {
                        // Enemy attacks creature
                        creature.takeDamage(10);
                        if (creature.isDead) {
                            this.missionSystem.onCreatureLost();
                        }
                    }
                }
            });
        });
    }

    private checkEnemyPlayerCollisions(): void {
        const enemies = this.enemyManager.getEnemies();
        const playerPos = this.lobster.getPosition();
        
        enemies.forEach(enemy => {
            if (enemy.isActive) {
                const distance = enemy.getPosition().distanceTo(playerPos);
                if (distance < 2.0) {
                    // Damage is handled per enemy attack cooldown, but we can add passive damage
                    // For now, this is handled in enemy AI attack logic
                }
            }
        });
    }
}

// Start the game when the page loads
window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
