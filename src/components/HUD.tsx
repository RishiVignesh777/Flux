import React from 'react';
import { PhysicsState, LevelData } from '../types/game';
import { PlayerEntity } from '../physics/engine';
import { 
  Pause, 
  RotateCcw, 
  Box, 
  Feather, 
  Magnet, 
  Zap, 
  Snowflake, 
  EyeOff, 
  Sparkles,
  ArrowUp
} from 'lucide-react';

interface HUDProps {
  level: LevelData;
  player: PlayerEntity;
  timeSeconds: number;
  deaths: number;
  switches: number;
  onSwitchState: (state: PhysicsState) => void;
  onRestart: () => void;
  onPause: () => void;
  onJumpPress?: () => void;
  onMoveLeft?: (active: boolean) => void;
  onMoveRight?: (active: boolean) => void;
  isTouchDevice?: boolean;
}

const STATE_CONFIG: Record<
  PhysicsState,
  { label: string; key: string; color: string; bg: string; border: string; icon: React.ReactNode; desc: string }
> = {
  NORMAL: {
    label: 'Standard',
    key: '0',
    color: 'text-slate-200',
    bg: 'bg-slate-800/80',
    border: 'border-slate-600',
    icon: <Box className="w-4 h-4" />,
    desc: 'Equilibrium physics',
  },
  HEAVY: {
    label: 'Heavy',
    key: '1',
    color: 'text-indigo-400',
    bg: 'bg-indigo-950/80',
    border: 'border-indigo-600',
    icon: <Box className="w-4 h-4 font-bold stroke-[3]" />,
    desc: 'High mass, sinks heavy plates',
  },
  LIGHT: {
    label: 'Light',
    key: '2',
    color: 'text-sky-300',
    bg: 'bg-sky-950/80',
    border: 'border-sky-500',
    icon: <Feather className="w-4 h-4" />,
    desc: 'Low mass, floats on wind',
  },
  MAGNETIC: {
    label: 'Magnetic',
    key: '3',
    color: 'text-rose-400',
    bg: 'bg-rose-950/80',
    border: 'border-rose-600',
    icon: <Magnet className="w-4 h-4" />,
    desc: 'Polar attraction & wall climb',
  },
  ELASTIC: {
    label: 'Elastic',
    key: '4',
    color: 'text-amber-300',
    bg: 'bg-amber-950/80',
    border: 'border-amber-500',
    icon: <Zap className="w-4 h-4" />,
    desc: 'Rebounds & dynamic bounce',
  },
  FROZEN: {
    label: 'Frozen',
    key: '5',
    color: 'text-cyan-300',
    bg: 'bg-cyan-950/80',
    border: 'border-cyan-500',
    icon: <Snowflake className="w-4 h-4" />,
    desc: 'Immobile anchor, stops hazards',
  },
  PHASE: {
    label: 'Phase',
    key: '6',
    color: 'text-purple-300',
    bg: 'bg-purple-950/80',
    border: 'border-purple-500',
    icon: <EyeOff className="w-4 h-4" />,
    desc: 'Crosses quantum phase barriers',
  },
};

export const HUD: React.FC<HUDProps> = ({
  level,
  player,
  timeSeconds,
  switches,
  onSwitchState,
  onRestart,
  onPause,
  onJumpPress,
  onMoveLeft,
  onMoveRight,
  isTouchDevice,
}) => {
  const currentStateConfig = STATE_CONFIG[player.state] || STATE_CONFIG.NORMAL;
  const statesList: PhysicsState[] = ['HEAVY', 'LIGHT', 'MAGNETIC', 'ELASTIC', 'FROZEN', 'PHASE'];

  const collectedCount = level.shards.filter(s => s.collected).length;

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 select-none">
      {/* Top Header Bar */}
      <div className="flex items-start justify-between">
        {/* Left: Level info & objective */}
        <div className="pointer-events-auto flex flex-col gap-1 rounded-lg border border-slate-800 bg-slate-950/85 px-3 py-2 backdrop-blur-md shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold tracking-widest text-sky-400">
              ROOM {String(level.id).padStart(2, '0')}
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-sm font-semibold text-slate-100">{level.name}</span>
          </div>
          <p className="text-xs text-slate-400 max-w-sm line-clamp-1">{level.hint || level.description}</p>
          <div className="flex items-center gap-3 pt-0.5 text-[11px] font-mono text-slate-400">
            <span>TIME: <span className="text-slate-200">{timeSeconds.toFixed(1)}s</span></span>
            <span>SWITCHES: <span className="text-slate-200">{switches}</span></span>
            <span className="flex items-center gap-1 text-sky-300">
              <Sparkles className="w-3 h-3" />
              {collectedCount}/{level.shards.length}
            </span>
          </div>
        </div>

        {/* Right: Quick Controls & Active State Badge */}
        <div className="flex items-center gap-2">
          {/* Active State Pill */}
          <div
            className={`pointer-events-auto flex items-center gap-2 rounded-lg border px-3 py-2 backdrop-blur-md shadow-lg ${currentStateConfig.bg} ${currentStateConfig.border}`}
          >
            <span className={currentStateConfig.color}>{currentStateConfig.icon}</span>
            <div className="flex flex-col">
              <span className={`text-xs font-bold uppercase tracking-wider ${currentStateConfig.color}`}>
                {currentStateConfig.label}
              </span>
              <span className="text-[10px] text-slate-400">{currentStateConfig.desc}</span>
            </div>
            {player.combinedState && (
              <span className="ml-1 rounded bg-purple-600/60 px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase text-purple-200">
                +FLUX
              </span>
            )}
          </div>

          {/* Restart & Pause Buttons */}
          <button
            id="hud-btn-restart"
            onClick={onRestart}
            title="Restart Level (R)"
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-600 hover:text-white transition active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            id="hud-btn-pause"
            onClick={onPause}
            title="Pause (ESC)"
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-600 hover:text-white transition active:scale-95"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Bar: Physics State Selection Buttons */}
      <div className="flex flex-col items-center gap-3">
        {/* Mobile touch locomotion controls if on small screen / touch device */}
        {isTouchDevice && (
          <div className="pointer-events-auto flex w-full max-w-sm justify-between px-2 pb-1">
            <div className="flex gap-2">
              <button
                id="touch-btn-left"
                onPointerDown={() => onMoveLeft?.(true)}
                onPointerUp={() => onMoveLeft?.(false)}
                onPointerLeave={() => onMoveLeft?.(false)}
                className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/90 text-xl font-bold text-white active:bg-sky-600"
              >
                ◀
              </button>
              <button
                id="touch-btn-right"
                onPointerDown={() => onMoveRight?.(true)}
                onPointerUp={() => onMoveRight?.(false)}
                onPointerLeave={() => onMoveRight?.(false)}
                className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/90 text-xl font-bold text-white active:bg-sky-600"
              >
                ▶
              </button>
            </div>
            <button
              id="touch-btn-jump"
              onPointerDown={() => onJumpPress?.()}
              className="flex h-12 w-20 items-center justify-center rounded-xl border border-sky-600 bg-sky-950/90 font-bold text-sky-200 active:bg-sky-600 active:text-white"
            >
              <ArrowUp className="w-5 h-5 mr-1" />
              JUMP
            </button>
          </div>
        )}

        {/* State Switcher Bar */}
        <div className="pointer-events-auto flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950/90 p-1.5 shadow-2xl backdrop-blur-md">
          {statesList.map(st => {
            const cfg = STATE_CONFIG[st];
            const isCurrent = player.state === st;
            const isAllowed = level.allowedStates.includes(st);

            return (
              <button
                key={st}
                id={`hud-state-${st.toLowerCase()}`}
                disabled={!isAllowed}
                onClick={() => isAllowed && onSwitchState(st)}
                title={`${cfg.label} (Press ${cfg.key})`}
                className={`group relative flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition active:scale-95 ${
                  isCurrent
                    ? `${cfg.bg} ${cfg.border} border text-white shadow-md shadow-${st.toLowerCase()}`
                    : isAllowed
                    ? 'border border-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    : 'border border-transparent text-slate-600 opacity-40 cursor-not-allowed'
                }`}
              >
                <span className={isCurrent ? cfg.color : 'text-slate-500 group-hover:text-slate-300'}>
                  {cfg.icon}
                </span>
                <span className="hidden sm:inline">{cfg.label}</span>
                <kbd className="hidden md:inline rounded bg-slate-800/80 px-1 py-0.2 text-[9px] font-mono text-slate-400">
                  {cfg.key}
                </kbd>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
