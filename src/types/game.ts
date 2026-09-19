export type PhysicsState = 'NORMAL' | 'HEAVY' | 'LIGHT' | 'MAGNETIC' | 'ELASTIC' | 'FROZEN' | 'PHASE';

export type GravityDirection = 'DOWN' | 'UP' | 'LEFT' | 'RIGHT';

export interface Vector2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type SurfaceType = 'NORMAL' | 'ICE' | 'STICKY' | 'ELASTIC' | 'MAGNETIC_POS' | 'MAGNETIC_NEG' | 'ONE_WAY' | 'PHASE';

export interface Platform {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  type: SurfaceType;
  color?: string;
  moving?: {
    axis: 'x' | 'y';
    distance: number;
    speed: number;
    initialOffset?: number;
  };
}

export type BlockType = 'NORMAL' | 'HEAVY' | 'MAGNETIC_POS' | 'MAGNETIC_NEG';

export interface Block {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  type: BlockType;
  isGrounded?: boolean;
}

export type HazardType = 'SPIKE' | 'LASER' | 'CRUSHER' | 'SAW' | 'ELECTRIC';

export interface Hazard {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  type: HazardType;
  direction?: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
  cycle?: {
    period: number; // seconds
    activeDuration: number;
    offset: number;
  };
  moving?: {
    axis: 'x' | 'y';
    distance: number;
    speed: number;
  };
}

export interface PressurePlate {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  requiresHeavy: boolean;
  targetId: string; // target door or platform id
  isPressed: boolean;
}

export interface TimedSwitch {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  duration: number; // in seconds
  timeLeft: number;
  targetId: string;
  isActivated: boolean;
}

export interface Door {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  isOpen: boolean;
  invert?: boolean; // opens when switch is off if true
}

export interface WindZone {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  forceX: number;
  forceY: number;
}

export interface GravityZone {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  direction: GravityDirection;
}

export interface GravitySwitch {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  newDirection: GravityDirection;
}

export interface Teleporter {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  targetX: number;
  targetY: number;
  cooldown: number;
}

export interface FluxNode {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  combinedStates: [PhysicsState, PhysicsState];
  active: boolean;
}

export interface FluxShard {
  id: string;
  x: number;
  y: number;
  collected: boolean;
}

export interface LevelData {
  id: number;
  section: number; // 1 to 6
  name: string;
  description: string;
  hint?: string;
  width: number;
  height: number;
  defaultGravity: GravityDirection;
  allowedStates: PhysicsState[];
  playerSpawn: Vector2;
  exitDoor: Rect;
  platforms: Platform[];
  blocks: Block[];
  hazards: Hazard[];
  pressurePlates: PressurePlate[];
  timedSwitches: TimedSwitch[];
  doors: Door[];
  windZones: WindZone[];
  gravityZones: GravityZone[];
  gravitySwitches: GravitySwitch[];
  teleporters: Teleporter[];
  fluxNodes: FluxNode[];
  shards: FluxShard[];
  timeTargetSeconds?: number;
}

export interface PlayerStats {
  timeSeconds: number;
  deaths: number;
  stateSwitches: number;
  shardsCollected: number;
  bestTime?: number;
  ghostTrail?: { x: number; y: number; state: PhysicsState; time: number }[];
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  shape: 'circle' | 'square' | 'line' | 'frost' | 'ring' | 'sparkle';
  friction?: number;
  glow?: boolean;
}

export interface GameSettings {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  gameSpeed: number; // 0.5, 0.75, 1.0, 1.25
  screenShake: boolean;
  particleDensity: 'FULL' | 'REDUCED' | 'OFF';
  colorblindMode: boolean;
  keybindings: {
    left: string;
    right: string;
    jump: string;
    stateHeavy: string;
    stateLight: string;
    stateMagnetic: string;
    stateElastic: string;
    stateFrozen: string;
    statePhase: string;
    restart: string;
    pause: string;
  };
}

export type GameScreen = 
  | 'MENU'
  | 'PLAY'
  | 'LEVEL_SELECT'
  | 'TIME_ATTACK'
  | 'ENDLESS'
  | 'DAILY'
  | 'CHALLENGE'
  | 'EDITOR'
  | 'SETTINGS';

export interface ChallengeModifier {
  id: string;
  title: string;
  description: string;
  levelId: number;
  noJump?: boolean;
  constantGravityShift?: boolean;
  shiftInterval?: number;
  allowedStates?: PhysicsState[];
  maxSwitches?: number;
  timeLimitSeconds?: number;
  noRestart?: boolean;
  invisiblePlatforms?: boolean;
}
