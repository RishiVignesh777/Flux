import { LevelData, PhysicsState, GravityDirection, Platform, Block, Hazard, PressurePlate, TimedSwitch, Door, WindZone, GravityZone, GravitySwitch, Teleporter, FluxNode, FluxShard } from '../types/game';

// Helper to construct a base room with boundaries
function createBaseLevel(
  id: number,
  section: number,
  name: string,
  description: string,
  hint: string,
  allowedStates: PhysicsState[],
  defaultGravity: GravityDirection = 'DOWN',
  w = 800,
  h = 500
): LevelData {
  const boundaryThickness = 24;
  const platforms: Platform[] = [
    // Bottom floor
    { id: `floor-${id}`, x: 0, y: h - boundaryThickness, w: w, h: boundaryThickness, type: 'NORMAL' },
    // Top ceiling
    { id: `ceil-${id}`, x: 0, y: 0, w: w, h: boundaryThickness, type: 'NORMAL' },
    // Left wall
    { id: `wall-l-${id}`, x: 0, y: 0, w: boundaryThickness, h: h, type: 'NORMAL' },
    // Right wall
    { id: `wall-r-${id}`, x: w - boundaryThickness, y: 0, w: boundaryThickness, h: h, type: 'NORMAL' },
  ];

  return {
    id,
    section,
    name,
    description,
    hint,
    width: w,
    height: h,
    defaultGravity,
    allowedStates,
    playerSpawn: { x: 60, y: h - boundaryThickness - 30 },
    exitDoor: { x: w - 70, y: h - boundaryThickness - 54, w: 36, h: 54 },
    platforms,
    blocks: [],
    hazards: [],
    pressurePlates: [],
    timedSwitches: [],
    doors: [],
    windZones: [],
    gravityZones: [],
    gravitySwitches: [],
    teleporters: [],
    fluxNodes: [],
    shards: [],
    timeTargetSeconds: 25,
  };
}

// Generate the 60 Handcrafted Puzzle Levels
export function getLevelData(levelId: number): LevelData {
  const id = Math.max(1, Math.min(60, levelId));
  const section = Math.ceil(id / 10);

  // SECTION 1: FUNDAMENTALS (Levels 1 - 10)
  if (id === 1) {
    const lvl = createBaseLevel(1, 1, 'Arrival', 'Learn basic locomotion and jump to reach the exit portal.', 'Press A/D to move, Space to jump.', ['NORMAL']);
    lvl.platforms.push({ id: 'p1', x: 280, y: 380, w: 140, h: 20, type: 'NORMAL' });
    lvl.platforms.push({ id: 'p2', x: 480, y: 300, w: 140, h: 20, type: 'NORMAL' });
    lvl.shards.push({ id: 's1', x: 350, y: 340, collected: false });
    return lvl;
  }

  if (id === 2) {
    const lvl = createBaseLevel(2, 1, 'The Heavy Plate', 'A massive door blocks the exit. A standard player is too light.', 'Press 1 to switch to HEAVY state to sink the plate.', ['NORMAL', 'HEAVY']);
    lvl.pressurePlates.push({ id: 'plate1', x: 260, y: 466, w: 48, h: 10, requiresHeavy: true, targetId: 'door1', isPressed: false });
    lvl.doors.push({ id: 'door1', x: 480, y: 330, w: 20, h: 146, isOpen: false });
    lvl.shards.push({ id: 's1', x: 284, y: 440, collected: false });
    return lvl;
  }

  if (id === 3) {
    const lvl = createBaseLevel(3, 1, 'Draft & Glide', 'A deep chasm with an air current.', 'Press 2 to switch to LIGHT state to catch the updraft.', ['NORMAL', 'HEAVY', 'LIGHT']);
    lvl.platforms.push({ id: 'gap-l', x: 24, y: 360, w: 200, h: 20, type: 'NORMAL' });
    lvl.platforms.push({ id: 'gap-r', x: 540, y: 260, w: 236, h: 20, type: 'NORMAL' });
    lvl.windZones.push({ id: 'w1', x: 280, y: 150, w: 200, h: 326, forceX: 0, forceY: -650 });
    lvl.exitDoor.y = 206;
    lvl.shards.push({ id: 's1', x: 380, y: 220, collected: false });
    return lvl;
  }

  if (id === 4) {
    const lvl = createBaseLevel(4, 1, 'Displacement', 'Push a standard crate onto a pressure plate to hold a security door open.', 'Push the crate into position.', ['NORMAL', 'HEAVY']);
    lvl.blocks.push({ id: 'b1', x: 240, y: 430, w: 32, h: 32, vx: 0, vy: 0, type: 'NORMAL' });
    lvl.pressurePlates.push({ id: 'p1', x: 400, y: 466, w: 48, h: 10, requiresHeavy: false, targetId: 'door1', isPressed: false });
    lvl.doors.push({ id: 'door1', x: 550, y: 350, w: 20, h: 126, isOpen: false });
    lvl.shards.push({ id: 's1', x: 424, y: 430, collected: false });
    return lvl;
  }

  if (id === 5) {
    const lvl = createBaseLevel(5, 1, 'Mass Hierarchy', 'Heavy blocks can only be shifted while Heavy.', 'Become Heavy to push the 10T block.', ['NORMAL', 'HEAVY', 'LIGHT']);
    lvl.blocks.push({ id: 'b1', x: 220, y: 424, w: 40, h: 40, vx: 0, vy: 0, type: 'HEAVY' });
    lvl.pressurePlates.push({ id: 'p1', x: 420, y: 466, w: 50, h: 10, requiresHeavy: true, targetId: 'door1', isPressed: false });
    lvl.doors.push({ id: 'door1', x: 580, y: 340, w: 20, h: 136, isOpen: false });
    lvl.shards.push({ id: 's1', x: 320, y: 360, collected: false });
    return lvl;
  }

  if (id === 6) {
    const lvl = createBaseLevel(6, 1, 'Thermal Siphon', 'Alternate between Light to ascend and Heavy to drop rapidly past spikes.', 'Switch states in mid-air.', ['NORMAL', 'HEAVY', 'LIGHT']);
    lvl.windZones.push({ id: 'w1', x: 180, y: 80, w: 100, h: 396, forceX: 0, forceY: -700 });
    lvl.platforms.push({ id: 'mid', x: 340, y: 240, w: 120, h: 20, type: 'NORMAL' });
    lvl.hazards.push({ id: 'spk1', x: 300, y: 456, w: 180, h: 20, type: 'SPIKE' });
    lvl.shards.push({ id: 's1', x: 230, y: 140, collected: false });
    return lvl;
  }

  if (id === 7) {
    const lvl = createBaseLevel(7, 1, 'Two Steps', 'Two plates must be triggered simultaneously.', 'A block on one plate, yourself on the other.', ['NORMAL', 'HEAVY', 'LIGHT']);
    lvl.blocks.push({ id: 'b1', x: 200, y: 430, w: 32, h: 32, vx: 0, vy: 0, type: 'NORMAL' });
    lvl.pressurePlates.push({ id: 'p1', x: 320, y: 466, w: 40, h: 10, requiresHeavy: false, targetId: 'door1', isPressed: false });
    lvl.doors.push({ id: 'door1', x: 460, y: 340, w: 18, h: 136, isOpen: false });
    lvl.pressurePlates.push({ id: 'p2', x: 580, y: 466, w: 40, h: 10, requiresHeavy: true, targetId: 'door2', isPressed: false });
    lvl.doors.push({ id: 'door2', x: 670, y: 340, w: 18, h: 136, isOpen: false });
    lvl.shards.push({ id: 's1', x: 520, y: 430, collected: false });
    return lvl;
  }

  if (id === 8) {
    const lvl = createBaseLevel(8, 1, 'The Chasm Bridge', 'One-way platforms allow upward transit but provide firm footing.', 'Jump through from underneath.', ['NORMAL', 'LIGHT']);
    lvl.platforms.push({ id: 'ow1', x: 240, y: 370, w: 100, h: 16, type: 'ONE_WAY' });
    lvl.platforms.push({ id: 'ow2', x: 400, y: 280, w: 100, h: 16, type: 'ONE_WAY' });
    lvl.platforms.push({ id: 'ow3', x: 560, y: 190, w: 100, h: 16, type: 'ONE_WAY' });
    lvl.exitDoor.x = 680;
    lvl.exitDoor.y = 136;
    lvl.shards.push({ id: 's1', x: 450, y: 240, collected: false });
    return lvl;
  }

  if (id === 9) {
    const lvl = createBaseLevel(9, 1, 'Velocity Gate', 'A timed switch with a short fuse requires rapid crossing.', 'Hit the switch, switch to Light to glide across.', ['NORMAL', 'LIGHT']);
    lvl.timedSwitches.push({ id: 'sw1', x: 140, y: 440, w: 30, h: 36, duration: 4.5, timeLeft: 0, targetId: 'd1', isActivated: false });
    lvl.hazards.push({ id: 'sp1', x: 250, y: 456, w: 250, h: 20, type: 'SPIKE' });
    lvl.platforms.push({ id: 'p1', x: 320, y: 340, w: 100, h: 18, type: 'NORMAL' });
    lvl.doors.push({ id: 'd1', x: 580, y: 340, w: 20, h: 136, isOpen: false });
    lvl.shards.push({ id: 's1', x: 370, y: 300, collected: false });
    return lvl;
  }

  if (id === 10) {
    const lvl = createBaseLevel(10, 1, 'Fundamentals Exam', 'Combine everything learned in Section 1 to conquer the chamber.', 'Use Heavy for plates and Light for updrafts.', ['NORMAL', 'HEAVY', 'LIGHT']);
    lvl.blocks.push({ id: 'b1', x: 180, y: 424, w: 40, h: 40, vx: 0, vy: 0, type: 'HEAVY' });
    lvl.pressurePlates.push({ id: 'p1', x: 300, y: 466, w: 44, h: 10, requiresHeavy: true, targetId: 'd1', isPressed: false });
    lvl.doors.push({ id: 'd1', x: 400, y: 350, w: 18, h: 126, isOpen: false });
    lvl.windZones.push({ id: 'w1', x: 460, y: 160, w: 90, h: 316, forceX: 0, forceY: -750 });
    lvl.platforms.push({ id: 'p2', x: 600, y: 260, w: 140, h: 20, type: 'NORMAL' });
    lvl.exitDoor.y = 206;
    lvl.shards.push({ id: 's1', x: 505, y: 220, collected: false });
    lvl.shards.push({ id: 's2', x: 700, y: 220, collected: false });
    return lvl;
  }

  // SECTION 2: MAGNETISM (Levels 11 - 20)
  if (id >= 11 && id <= 20) {
    const lvl = createBaseLevel(id, 2, `Magnetic Field ${id - 10}`, 'Magnetic surfaces attract you and allow ceiling/wall adherence.', 'Press 3 for MAGNETIC state.', ['NORMAL', 'HEAVY', 'LIGHT', 'MAGNETIC']);
    const sub = id - 10;

    // Magnetic ceiling or wall
    lvl.platforms.push({ id: `mag-c-${id}`, x: 220, y: 24, w: 340, h: 24, type: 'MAGNETIC_POS' });
    lvl.hazards.push({ id: `spk-${id}`, x: 180, y: 456, w: 420, h: 20, type: 'SPIKE' });

    if (sub >= 3) {
      // Magnetic block puzzle
      lvl.blocks.push({ id: `mb-${id}`, x: 300, y: 390, w: 34, h: 34, vx: 0, vy: 0, type: 'MAGNETIC_NEG' });
      lvl.pressurePlates.push({ id: `mp-${id}`, x: 500, y: 466, w: 44, h: 10, requiresHeavy: false, targetId: `md-${id}`, isPressed: false });
      lvl.doors.push({ id: `md-${id}`, x: 640, y: 340, w: 20, h: 136, isOpen: false });
    }

    if (sub >= 6) {
      // Wall crawling section
      lvl.platforms.push({ id: `mag-wall-${id}`, x: 620, y: 150, w: 24, h: 200, type: 'MAGNETIC_POS' });
    }

    lvl.shards.push({ id: `s-${id}`, x: 380, y: 90, collected: false });
    if (sub % 2 === 0) {
      lvl.shards.push({ id: `s2-${id}`, x: 560, y: 90, collected: false });
    }
    return lvl;
  }

  // SECTION 3: MOMENTUM (Levels 21 - 30)
  if (id >= 21 && id <= 30) {
    const lvl = createBaseLevel(id, 3, `Momentum Vector ${id - 20}`, 'Use Elastic state to bounce with preserved momentum.', 'Press 4 for ELASTIC state. Rebound off walls.', ['NORMAL', 'HEAVY', 'LIGHT', 'MAGNETIC', 'ELASTIC']);
    const sub = id - 20;

    // Elastic pads and high pillars
    lvl.platforms.push({ id: `el-pad-${id}`, x: 260, y: 456, w: 100, h: 20, type: 'ELASTIC' });
    lvl.platforms.push({ id: `high-p-${id}`, x: 440, y: 220, w: 120, h: 20, type: 'NORMAL' });

    if (sub >= 4) {
      // Moving platform
      lvl.platforms.push({
        id: `mov-${id}`,
        x: 320,
        y: 300,
        w: 90,
        h: 18,
        type: 'NORMAL',
        moving: { axis: 'x', distance: 80, speed: 2 },
      });
    }

    if (sub >= 7) {
      // Gravity switch
      lvl.gravitySwitches.push({ id: `gs-${id}`, x: 500, y: 190, w: 26, h: 26, newDirection: 'UP' });
    }

    lvl.shards.push({ id: `s-${id}`, x: 490, y: 160, collected: false });
    return lvl;
  }

  // SECTION 4: PHASE (Levels 31 - 40)
  if (id >= 31 && id <= 40) {
    const lvl = createBaseLevel(id, 4, `Quantum Phase ${id - 30}`, 'Phase through purple phase walls and barriers.', 'Press 6 for PHASE state.', ['NORMAL', 'HEAVY', 'LIGHT', 'MAGNETIC', 'ELASTIC', 'FROZEN', 'PHASE']);
    const sub = id - 30;

    lvl.platforms.push({ id: `ph-w1-${id}`, x: 300, y: 200, w: 24, h: 276, type: 'PHASE' });
    lvl.platforms.push({ id: `ph-w2-${id}`, x: 520, y: 80, w: 24, h: 280, type: 'PHASE' });

    if (sub >= 4) {
      // Timed hazards
      lvl.hazards.push({ id: `lz-${id}`, x: 380, y: 400, w: 100, h: 20, type: 'LASER', cycle: { period: 3, activeDuration: 1.8, offset: 0 } });
    }

    if (sub >= 7) {
      // Frozen anchor utility
      lvl.platforms.push({
        id: `mov-frz-${id}`,
        x: 400,
        y: 280,
        w: 80,
        h: 18,
        type: 'NORMAL',
        moving: { axis: 'y', distance: 90, speed: 2.5 },
      });
    }

    lvl.shards.push({ id: `s-${id}`, x: 312, y: 280, collected: false });
    return lvl;
  }

  // SECTION 5: FLUX (Levels 41 - 50)
  if (id >= 41 && id <= 50) {
    const lvl = createBaseLevel(id, 5, `Flux Node ${id - 40}`, 'Flux Nodes synthesize two physics states into one synergistic power.', 'Touch the Flux Node to absorb combined states.', ['NORMAL', 'HEAVY', 'LIGHT', 'MAGNETIC', 'ELASTIC', 'FROZEN', 'PHASE']);
    const sub = id - 40;

    let combo: [PhysicsState, PhysicsState] = ['HEAVY', 'ELASTIC'];
    if (sub === 2) combo = ['LIGHT', 'MAGNETIC'];
    if (sub === 3) combo = ['FROZEN', 'MAGNETIC'];
    if (sub === 4) combo = ['LIGHT', 'ELASTIC'];
    if (sub >= 5) combo = ['PHASE', 'MAGNETIC'];

    lvl.fluxNodes.push({ id: `fn-${id}`, x: 180, y: 420, w: 30, h: 30, combinedStates: combo, active: true });
    lvl.platforms.push({ id: `p-step-${id}`, x: 340, y: 320, w: 100, h: 20, type: 'NORMAL' });
    lvl.platforms.push({ id: `p-mag-${id}`, x: 480, y: 160, w: 160, h: 20, type: 'MAGNETIC_POS' });

    lvl.shards.push({ id: `s-${id}`, x: 560, y: 120, collected: false });
    return lvl;
  }

  // SECTION 6: MASTER (Levels 51 - 60)
  const lvl = createBaseLevel(id, 6, `Master Synthesis ${id - 50}`, 'Comprehensive test of momentum, magnetism, phase, and gravity.', 'Synthesize all mechanics flawlessly.', ['NORMAL', 'HEAVY', 'LIGHT', 'MAGNETIC', 'ELASTIC', 'FROZEN', 'PHASE']);
  const sub = id - 50;

  lvl.platforms.push({ id: `m-mag-${id}`, x: 240, y: 180, w: 140, h: 20, type: 'MAGNETIC_POS' });
  lvl.platforms.push({ id: `m-ph-${id}`, x: 460, y: 260, w: 24, h: 216, type: 'PHASE' });
  lvl.platforms.push({ id: `m-el-${id}`, x: 180, y: 456, w: 80, h: 20, type: 'ELASTIC' });

  lvl.pressurePlates.push({ id: `pp-${id}`, x: 360, y: 466, w: 44, h: 10, requiresHeavy: true, targetId: `md-${id}`, isPressed: false });
  lvl.doors.push({ id: `md-${id}`, x: 600, y: 340, w: 20, h: 136, isOpen: false });

  lvl.hazards.push({ id: `sp-${id}`, x: 260, y: 456, w: 90, h: 20, type: 'SPIKE' });

  if (sub >= 5) {
    lvl.gravitySwitches.push({ id: `mgs-${id}`, x: 310, y: 150, w: 26, h: 26, newDirection: 'RIGHT' });
    lvl.teleporters.push({ id: `tp-${id}`, x: 650, y: 430, w: 28, h: 28, targetX: 700, targetY: 100, cooldown: 0 });
    lvl.exitDoor.y = 80;
  }

  lvl.shards.push({ id: `s1-${id}`, x: 310, y: 120, collected: false });
  lvl.shards.push({ id: `s2-${id}`, x: 500, y: 220, collected: false });
  if (sub === 10) {
    lvl.shards.push({ id: `s3-${id}`, x: 720, y: 60, collected: false });
  }

  return lvl;
}

export const TOTAL_LEVELS = 60;
