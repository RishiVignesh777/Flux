import { LevelData, PhysicsState, Platform, Hazard, WindZone, PressurePlate, Door } from '../types/game';

// Simple LCG pseudo-random number generator for reproducible seeds
function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generateProceduralLevel(seed: number, difficultyTier: number, modeName = 'Endless'): LevelData {
  const rand = seededRandom(seed);
  const w = 840;
  const h = 500;
  const boundaryThickness = 24;

  const allowedStates: PhysicsState[] = ['NORMAL', 'HEAVY', 'LIGHT'];
  if (difficultyTier >= 2) allowedStates.push('MAGNETIC');
  if (difficultyTier >= 3) allowedStates.push('ELASTIC');
  if (difficultyTier >= 4) allowedStates.push('FROZEN');
  if (difficultyTier >= 5) allowedStates.push('PHASE');

  const platforms: Platform[] = [
    { id: 'floor', x: 0, y: h - boundaryThickness, w, h: boundaryThickness, type: 'NORMAL' },
    { id: 'ceil', x: 0, y: 0, w, h: boundaryThickness, type: 'NORMAL' },
    { id: 'wall-l', x: 0, y: 0, w: boundaryThickness, h, type: 'NORMAL' },
    { id: 'wall-r', x: w - boundaryThickness, y: 0, w: boundaryThickness, h, type: 'NORMAL' },
  ];

  const hazards: Hazard[] = [];
  const windZones: WindZone[] = [];
  const pressurePlates: PressurePlate[] = [];
  const doors: Door[] = [];

  // Generate 2 - 4 modular puzzle segments across the room
  const segmentCount = 2 + Math.min(3, Math.floor(difficultyTier * 0.7));
  const segmentWidth = (w - 140) / segmentCount;

  for (let i = 0; i < segmentCount; i++) {
    const segX = 70 + i * segmentWidth;
    const choice = Math.floor(rand() * 5);

    if (choice === 0) {
      // Elevated platform with chasm
      const platY = 240 + Math.floor(rand() * 120);
      platforms.push({
        id: `p-seg-${i}`,
        x: segX + 20,
        y: platY,
        w: segmentWidth - 40,
        h: 20,
        type: rand() > 0.6 ? 'ELASTIC' : 'NORMAL',
      });
      if (rand() > 0.5) {
        hazards.push({
          id: `spk-seg-${i}`,
          x: segX + 30,
          y: h - boundaryThickness - 20,
          w: segmentWidth - 60,
          h: 20,
          type: 'SPIKE',
        });
      }
    } else if (choice === 1 && allowedStates.includes('MAGNETIC')) {
      // Magnetic overhead ceiling
      platforms.push({
        id: `mag-seg-${i}`,
        x: segX + 10,
        y: boundaryThickness,
        w: segmentWidth - 20,
        h: 20,
        type: 'MAGNETIC_POS',
      });
      hazards.push({
        id: `spk-mag-${i}`,
        x: segX + 10,
        y: h - boundaryThickness - 20,
        w: segmentWidth - 20,
        h: 20,
        type: 'SPIKE',
      });
    } else if (choice === 2 && allowedStates.includes('LIGHT')) {
      // Wind updraft channel
      windZones.push({
        id: `wnd-seg-${i}`,
        x: segX + 30,
        y: 100,
        w: 80,
        h: 376,
        forceX: 0,
        forceY: -720,
      });
      platforms.push({
        id: `wnd-landing-${i}`,
        x: segX + 120,
        y: 200,
        w: 90,
        h: 20,
        type: 'NORMAL',
      });
    } else if (choice === 3 && allowedStates.includes('PHASE')) {
      // Phase barrier
      platforms.push({
        id: `ph-seg-${i}`,
        x: segX + segmentWidth / 2,
        y: 120,
        w: 24,
        h: 356,
        type: 'PHASE',
      });
    } else {
      // Stepping stones
      platforms.push({
        id: `step-1-${i}`,
        x: segX + 15,
        y: 350,
        w: 70,
        h: 18,
        type: 'ONE_WAY',
      });
      platforms.push({
        id: `step-2-${i}`,
        x: segX + 95,
        y: 260,
        w: 70,
        h: 18,
        type: 'NORMAL',
      });
    }
  }

  // Add a security gate in higher tiers
  if (difficultyTier >= 2) {
    const doorId = `door-proc-${difficultyTier}`;
    const plateX = 140 + Math.floor(rand() * 200);
    pressurePlates.push({
      id: `plate-proc-${difficultyTier}`,
      x: plateX,
      y: h - boundaryThickness - 10,
      w: 44,
      h: 10,
      requiresHeavy: allowedStates.includes('HEAVY') && rand() > 0.4,
      targetId: doorId,
      isPressed: false,
    });
    doors.push({
      id: doorId,
      x: w - 120,
      y: h - boundaryThickness - 140,
      w: 20,
      h: 140,
      isOpen: false,
    });
  }

  const shards = [
    { id: 's1', x: Math.floor(w * 0.45), y: 180, collected: false },
  ];
  if (difficultyTier >= 3) {
    shards.push({ id: 's2', x: Math.floor(w * 0.75), y: 120, collected: false });
  }

  return {
    id: difficultyTier,
    section: Math.min(6, Math.max(1, Math.ceil(difficultyTier / 3))),
    name: `${modeName} Tier ${difficultyTier}`,
    description: `Procedurally sequenced sector #${difficultyTier} under quantum flux parameters.`,
    hint: 'Assess geometry and switch states accordingly.',
    width: w,
    height: h,
    defaultGravity: 'DOWN',
    allowedStates,
    playerSpawn: { x: 50, y: h - boundaryThickness - 30 },
    exitDoor: { x: w - 65, y: h - boundaryThickness - 54, w: 36, h: 54 },
    platforms,
    blocks: [],
    hazards,
    pressurePlates,
    timedSwitches: [],
    doors,
    windZones,
    gravityZones: [],
    gravitySwitches: [],
    teleporters: [],
    fluxNodes: [],
    shards,
    timeTargetSeconds: 30,
  };
}

export function getDailyLevel(): LevelData {
  // Use current UTC date string as seed: YYYYMMDD
  const now = new Date();
  const dateSeed = now.getUTCFullYear() * 10000 + (now.getUTCMonth() + 1) * 100 + now.getUTCDate();
  return generateProceduralLevel(dateSeed, 4, 'Daily Flux');
}
