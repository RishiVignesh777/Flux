# FLUX — Target Development Platform (Godot 4.x)

## 29. Target Development Platform Specification

**FLUX** is built primarily for **Windows PC 64-bit** using **Godot 4.x**, adhering to modular architecture, full controller and keyboard input maps, and scalable resolution support.

---

### 1. Primary Platform: Windows PC

* **OS Support**: Windows 10 / 11 (64-bit)
* **Controls**:
  * Keyboard & Mouse
  * Xbox-style Controller (XInput: Series X|S, Xbox One, Xbox 360)
  * PlayStation-style Controller (DirectInput / DualShock 4, DualSense 5)
* **Framerate Target**: Locked 60 FPS (`physics_ticks_per_second = 60`)
* **Resolution**:
  * Minimum: 1280×720
  * Recommended: 1920×1080
  * Native 4K (3840×2160) support via Godot's `canvas_items` stretch mode
  * Aspect ratio support: 16:9, 16:10, and 21:9 Ultrawide (`window/stretch/aspect="expand"`)

---

### 2. Secondary Platforms

Designed without platform-specific dependencies for seamless export to:
* **Linux**: x86_64 binaries
* **macOS**: Universal (.app / .dmg)

---

### 3. Engine & System Architecture

```
godot/
├── project.godot                     # Godot 4.x engine config, window stretch, input mappings
├── scenes/
│   ├── main.tscn                     # Main runtime scene
│   ├── player.tscn                   # CharacterBody2D player with collisions and visual aura
│   └── hud.tscn                      # Clean 2D vector HUD & pause overlay
├── scripts/
│   ├── core/
│   │   └── player_controller.gd      # PC controller with coyote time, jump buffering, squash/stretch
│   └── systems/
│       ├── physics_state_system.gd   # Normal, Heavy, Light, Magnetic, Elastic, Frozen, Phase
│       ├── gravity_system.gd         # 4-direction gravity rotation & vector math
│       ├── momentum_system.gd        # Kinetic energy preservation & bounce reflection
│       ├── interactive_object_system.gd # Plates, magnetic rails, doors, launch pads, shards
│       ├── hazard_system.gd          # Spikes, lasers, void zones with state desync immunities
│       ├── level_system.gd           # First 10 chambers data and level loader
│       ├── save_system.gd            # Platform-independent JSON save system (user://)
│       ├── audio_system.gd           # Procedural sound synthesis & SFX players
│       ├── ui_system.gd              # Dynamic controller glyphs (Xbox/PS) and HUD
│       └── level_editor.gd           # In-engine grid editor with JSON export/import
```

---

### 4. Input Architecture (Godot Input Map)

| Action | Keyboard Binding | Xbox Controller | PlayStation Controller |
| :--- | :--- | :--- | :--- |
| `move_left` | A / Left Arrow | D-Pad Left / Left Stick Left | D-Pad Left / Left Stick Left |
| `move_right` | D / Right Arrow | D-Pad Right / Left Stick Right | D-Pad Right / Left Stick Right |
| `jump` | Space / W / Up Arrow | **A** button | **✕** (Cross) |
| `restart` | R | **Y** button | **△** (Triangle) |
| `pause` | Escape / Tab | **Menu / Start** | **Options** |
| `state_heavy` | 1 | **LB** (Left Bumper) | **L1** |
| `state_light` | 2 | **RB** (Right Bumper) | **R1** |
| `state_magnetic` | 3 | **X** button | **□** (Square) |
| `state_elastic` | 4 | **B** button | **○** (Circle) |
| `state_frozen` | 5 | **LT** (Left Trigger) | **L2** |
| `state_phase` | 6 | **RT** (Right Trigger) | **R2** |

---

### 5. Running & Exporting the Project

1. Install **Godot 4.3 or newer** (Standard 64-bit).
2. Open Godot, click **Import**, select `godot/project.godot`, and open the project.
3. Press **F5** to run the project.
4. To export for **Windows PC**:
   - Go to `Project` -> `Export`.
   - Add **Windows Desktop (Runnable)** preset.
   - Set Architecture to `x86_64`.
   - Click **Export Project** to generate `FLUX.exe`.
