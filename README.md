# 🦞 Lobster Office Adventure

A 3D underwater action game built with Three.js and TypeScript where you play as a lobster defending sea creatures from enemy attacks.

![screenshot](https://raw.githubusercontent.com/mochiyaki/lobster-office-adventure/master/demo.png)

## 🎮 Game Overview

Control a lobster in an immersive 3D underwater environment, complete quests, defeat enemies (sharks and turtles), and protect friendly sea creatures. Features combat mechanics with bubble shooting and claw attacks, mission objectives, and procedurally generated audio.

## ✨ Features

- **3D Underwater Environment**: Fully rendered ocean floor with dynamic lighting
- **Combat System**: 
  - Bubble projectiles (SPACE) with physics-based collision
  - Melee claw attacks (Q or Click) with area damage
- **Mission System**: 
  - Protect friendly creatures (fish and jellyfish)
  - Survive for 60 seconds
  - Defeat enemies to reduce threat level
- **Enemy AI**: 
  - Sharks (fast, high damage)
  - Turtles (tanky, slower)
  - State machine behavior (patrol → chase → attack → retreat)
- **Procedural Audio**: 
  - Synthesized sound effects using Web Audio API
  - Ambient underwater background music (pentatonic scale)
  - No external audio files required
- **Progression System**: Checkpoints with NPC dialogue and upgrades
- **Responsive UI**: Health bars, cooldown indicators, mission tracking

## 🎯 Game Mechanics

### Combat
- **Bubble Shoot**: Ranged attack, 0.5s cooldown, knockback effect
- **Claw Attack**: Melee attack, 1.0s cooldown, 30 damage, 2.0 radius
- **Health System**: Player and creatures have health that depletes on damage

### Mission Objectives
1. **Survive**: Stay alive for 60 seconds
2. **Protect Creatures**: Keep at least 70% of creatures alive
3. **Defeat Enemies**: Eliminate threats to reduce danger level

### Enemy Types
| Enemy  | Health | Speed | Damage | Range | Cooldown |
|--------|--------|-------|--------|-------|----------|
| Shark  | 80     | 0.15  | 15     | 2.5   | 1.5s     |
| Turtle | 120    | 0.08  | 10     | 2.0   | 2.0s     |

## 🎮 Controls

| Key/Action       | Function                  |
|------------------|---------------------------|
| W / ↑            | Move Forward              |
| S / ↓            | Move Backward             |
| A / ←            | Turn Left                 |
| D / →            | Turn Right                |
| SPACE            | Shoot Bubble              |
| Q / Left Click   | Claw Attack               |
| E                | Interact with NPC         |
| M                | Toggle Audio Mute         |
| Mouse Drag       | Rotate Camera             |
| Mouse Wheel      | Zoom In/Out               |

## 🏗️ Project Architecture

### System Overview

```
┌────────────────────────────────────────────────────────────┐
│                         Main Game                          │
│                        (main.ts)                           │
└────────────┬───────────────────────────────────────────────┘
             │
             ├─── Rendering ────────────────────────────┐
             │    • Three.js Scene                      │
             │    • Camera & Lighting                   │
             │    • SceneManager                        │
             │                                          │
             ├─── Player ───────────────────────────────┤
             │    • Lobster Entity (lobster.ts)         │
             │    • Movement & Rotation                 │
             │    • Combat Actions                      │
             │                                          │
             ├─── Combat System ────────────────────────┤
             │    • CombatSystem (combat.ts)            │
             │    • Health Components                   │
             │    • Team Management                     │
             │    • Damage Resolution                   │
             │                                          │
             ├─── Projectiles  ─────────────────────────┤
             │    • ProjectileManager (projectiles.ts)  │
             │    • Bubble Physics                      │
             │    • Collision Detection                 │
             │    • Visual Effects                      │
             │                                          │
             ├─── Enemies ──────────────────────────────┤
             │    • EnemyManager (enemies.ts)           │
             │    • Shark AI                            │
             │    • Turtle AI                           │
             │    • State Machines                      │
             │    • Spawning System                     │
             │                                          │
             ├─── Environment ──────────────────────────┤
             │    • SeaCreatures (seacreatures.ts)      │
             │    • Checkpoints (checkpoints.ts)        │
             │    • NPCSystem (npcs.ts)                 │
             │                                          │
             ├─── Mission ──────────────────────────────┤
             │    • MissionSystem (mission.ts)          │
             │    • Objective Tracking                  │
             │    • Statistics                          │
             │    • Win/Lose Conditions                 │
             │                                          │
             ├─── Audio ────────────────────────────────┤
             │    • AudioManager (audio.ts)             │
             │    • Web Audio API                       │
             │    • Synthesized Sounds                  │
             │    • Background Music                    │
             │                                          │
             └─── UI ───────────────────────────────────┘
                  • UI System (ui.ts)
                  • HUD Elements
                  • Mission Panel
                  • Game Over/Complete Screens
```

### Component Interaction Flow

```
┌──────────────┐
│   User Input │
└──────┬───────┘
       │
       v
┌──────────────┐      ┌─────────────────┐      ┌──────────────┐
│   Lobster    │◄────►│  Combat System  │◄────►│   Enemies    │
│  (Player)    │      │   (Health/DMG)  │      │(Shark/Turtle)│
└──────┬───────┘      └────────┬────────┘      └───────┬──────┘
       │                       │                       │
       │                       │                       │
       v                       v                       v
┌──────────────┐      ┌─────────────────┐      ┌──────────────┐
│ Projectile   │      │   Protected     │      │    Mission   │
│  Manager     │      │   Creatures     │      │    System    │
└──────┬───────┘      └────────┬────────┘      └───────┬──────┘
       │                       │                       │
       └───────────────────────┴───────────────────────┘
                               │
                               v
                      ┌────────────────┐
                      │   UI System    │
                      │  (Display)     │
                      └────────────────┘
```

## 🔄 Game Loop Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    Animation Frame Loop                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            v
              ┌─────────────────────────┐
              │  Calculate Delta Time   │
              └────────────┬────────────┘
                           │
                           v
              ┌─────────────────────────┐
              │   Update Player         │
              │   - Process input       │
              │   - Move & rotate       │
              │   - Handle attacks      │
              └────────────┬────────────┘
                           │
                           v
              ┌─────────────────────────┐
              │   Update Environment    │
              │   - Checkpoints         │
              │   - Sea creatures       │
              │   - NPCs                │
              └────────────┬────────────┘
                           │
                           v
              ┌─────────────────────────┐
              │   Update Combat         │
              │   - Projectiles         │
              │   - Collision detection │
              │   - Damage resolution   │
              └────────────┬────────────┘
                           │
                           v
              ┌─────────────────────────┐
              │   Update Enemies        │
              │   - AI state machines   │
              │   - Movement            │
              │   - Attacks             │
              │   - Spawning            │
              └────────────┬────────────┘
                           │
                           v
              ┌─────────────────────────┐
              │   Update Mission        │
              │   - Check objectives    │
              │   - Update statistics   │
              │   - Win/lose conditions │
              └────────────┬────────────┘
                           │
                           v
              ┌─────────────────────────┐
              │   Update UI             │
              │   - Health bars         │
              │   - Cooldowns           │
              │   - Mission status      │
              └────────────┬────────────┘
                           │
                           v
              ┌─────────────────────────┐
              │   Render Scene          │
              │   - Update camera       │
              │   - Draw all objects    │
              └─────────────────────────┘
```

## 📁 File Structure

```
game/
├── index.html              # Main HTML entry point
├── style.css               # Game UI styling
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript configuration
├── vite.config.js          # Vite build configuration
└── src/
    ├── main.ts             # Main game entry & loop (354 lines)
    ├── lobster.ts          # Player entity & controls (441 lines)
    ├── combat.ts           # Combat system & health (139 lines)
    ├── projectiles.ts      # Bubble projectile system (218 lines)
    ├── enemies.ts          # Enemy AI & management (630 lines)
    ├── mission.ts          # Mission objectives & stats (219 lines)
    ├── audio.ts            # Web Audio API sound system (334 lines)
    ├── ui.ts               # User interface management (221 lines)
    ├── seacreatures.ts     # Sea creature entities (542 lines)
    ├── checkpoints.ts      # Checkpoint system (216 lines)
    ├── npcs.ts             # NPC dialogue system (91 lines)
    └── scenemanager.ts     # Scene setup & lighting (130 lines)
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
# Navigate to the game directory
cd game

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Dependencies
- **three**: 3D graphics library
- **vite**: Build tool and dev server
- **typescript**: Type-safe development

## 🎨 Technical Highlights

### Combat System
- **Entity-Component-System** pattern for flexible entity management
- **Team-based targeting**: Enemies prioritize creatures over player
- **Health components** with death callbacks
- **Collision detection** using spatial queries

### Enemy AI State Machine

```
┌──────────┐    Detect Target     ┌───────────┐
│  PATROL  │ ──────────────────>  │   CHASE   │
└────┬─────┘                      └─────┬─────┘
     │                                  │
     │                                  │ In Range
     │                                  │
     │                                  v
     │                            ┌───────────┐
     │                            │  ATTACK   │
     │                            └─────┬─────┘
     │                                  │
     │ Lost Target                      │ Low Health
     │                                  │
     └──────────────────────────────────┼────────> ┌──────────┐
                                        └────────> │ RETREAT  │
                                                   └──────────┘
```

### Audio System
- **No external files**: All sounds generated procedurally
- **Web Audio API**: Oscillators, gain nodes, filters
- **Synthesized effects**:
  - Bubble: Dual sine waves (600Hz-1600Hz)
  - Claw: Sawtooth wave with lowpass filter
  - Hits: Triangle wave impact sounds
  - Music: Random pentatonic melodies

### Performance Optimizations
- **Delta time** for frame-independent movement
- **Object pooling** for projectiles
- **Spatial partitioning** for collision detection
- **Efficient enemy cleanup** and memory management

## 🎯 Mission System Flow

```
Mission Start
     │
     v
┌─────────────────────────────────────────────┐
│  Objectives:                                │
│  □ Survive 60 seconds                       │
│  □ Keep 70% of creatures alive              │
│  □ Defeat enemies                           │
└──────────────┬──────────────────────────────┘
               │
               v
     ┌─────────────────┐
     │  Mission Active │
     │  - Track time   │
     │  - Monitor HP   │
     │  - Count kills  │
     └────────┬────────┘
              │
              v
     ┌────────────────────┐
     │  Check Conditions  │
     └────────┬───────────┘
              │
      ┌───────┴───────┐
      │               │
      v               v
┌──────────┐    ┌──────────┐
│ Success  │    │  Failure │
│ (All v)  │    │ (Any x)  │
└────┬─────┘    └────┬─────┘
     │               │
     v               v
┌──────────┐    ┌──────────┐
│ Victory  │    │Game Over │
│ Screen   │    │ Screen   │
└──────────┘    └──────────┘
```

## 🐛 Development Notes

### Known Limitations
- Some TypeScript strict mode warnings (pre-existing)
- Audio requires user interaction to start (browser policy)

### Future Enhancement Ideas
- Boss battles
- More enemy types
- Power-ups and abilities
- Multiplayer support
- Save system for progression

## 📄 License

MIT

**Developed with Three.js, TypeScript, and Web Audio API**
