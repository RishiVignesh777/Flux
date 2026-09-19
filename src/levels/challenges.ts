import { ChallengeModifier, PhysicsState } from '../types/game';

export const CHALLENGE_MODIFIERS: ChallengeModifier[] = [
  {
    id: 'ch-no-jump',
    title: 'Grounded Protocol',
    description: 'Jump engine disabled. Rely purely on momentum, elastic rebounds, and gravity manipulation.',
    levelId: 21,
    noJump: true,
  },
  {
    id: 'ch-gravity-flux',
    title: 'Gravitational Anomaly',
    description: 'Local gravity rotates 90 degrees every 4.0 seconds. Adapt and survive.',
    levelId: 10,
    constantGravityShift: true,
    shiftInterval: 4.0,
  },
  {
    id: 'ch-dual-state',
    title: 'Polar Duality',
    description: 'Only Heavy and Light states are accessible in this hazardous chamber.',
    levelId: 6,
    allowedStates: ['HEAVY', 'LIGHT'],
  },
  {
    id: 'ch-limited-switches',
    title: 'State Conservation',
    description: 'Complete the puzzle chamber using no more than 4 physics switches.',
    levelId: 7,
    maxSwitches: 4,
  },
  {
    id: 'ch-speedrun',
    title: 'Critical Overload',
    description: 'Reactor failure in progress. Reach the exit portal within 18 seconds.',
    levelId: 9,
    timeLimitSeconds: 18,
  },
  {
    id: 'ch-ironman',
    title: 'One Chance',
    description: 'Manual reset and death restart are strictly disabled. Flawless run required.',
    levelId: 15,
    noRestart: true,
  },
];
