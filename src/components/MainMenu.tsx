import React from 'react';
import { GameScreen } from '../types/game';
import { SavedGameData } from '../storage/saveSystem';
import { Play, Grid, Flame, Clock, Infinity, Calendar, Edit3, Settings, Sparkles, Monitor } from 'lucide-react';

interface MainMenuProps {
  saveData: SavedGameData;
  onNavigate: (screen: GameScreen) => void;
  onStartLatestLevel: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  saveData,
  onNavigate,
  onStartLatestLevel,
}) => {
  const completedPercentage = Math.round((saveData.completedLevels.length / 60) * 100);

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center bg-slate-950 p-6 text-slate-100 select-none overflow-hidden">
      {/* Subtle background ambient geometric grid */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-15"
        style={{
          backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px), radial-gradient(#6366f1 1px, #0a0d14 1px)',
          backgroundSize: '40px 40px',
          backgroundPosition: '0 0, 20px 20px',
        }}
      />

      {/* Main Title Container */}
      <div className="relative z-10 flex flex-col items-center mb-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-950/40 px-3 py-1 text-[11px] font-mono tracking-widest text-sky-400 mb-3">
          <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-ping" />
          2D PHYSICS LOGIC PLATFORMER
        </div>

        <h1 className="text-6xl sm:text-7xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-400">
          FLUX
        </h1>

        <p className="mt-2 text-xs sm:text-sm font-mono tracking-wider text-slate-400">
          MASS • MAGNETISM • MOMENTUM • PHASE
        </p>

        {/* Global Progress Pill */}
        <div className="mt-4 flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-1.5 text-xs font-mono text-slate-300">
          <span className="flex items-center gap-1.5">
            <span className="text-sky-400 font-bold">{saveData.completedLevels.length}/60</span>
            <span className="text-slate-500">CHAMBERS ({completedPercentage}%)</span>
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1.5 text-sky-300">
            <Sparkles className="w-3.5 h-3.5 fill-sky-400" />
            <span>{saveData.totalShards} SHARDS</span>
          </span>
        </div>
      </div>

      {/* Menu Buttons Group */}
      <div className="relative z-10 flex w-full max-w-xs flex-col gap-2.5 font-mono text-xs">
        {/* Play / Continue */}
        <button
          id="menu-btn-play"
          onClick={onStartLatestLevel}
          className="group flex items-center justify-between rounded-xl bg-sky-500 px-5 py-3.5 font-bold text-slate-950 shadow-lg shadow-sky-500/20 hover:bg-sky-400 transition active:scale-[0.98]"
        >
          <span className="flex items-center gap-2.5">
            <Play className="w-4 h-4 fill-slate-950" />
            {saveData.completedLevels.length > 0 ? `CONTINUE (ROOM ${saveData.highestLevelUnlocked})` : 'PLAY CAMPAIGN'}
          </span>
          <span className="text-[10px] opacity-75">ENTER</span>
        </button>

        {/* Level Select */}
        <button
          id="menu-btn-level-select"
          onClick={() => onNavigate('LEVEL_SELECT')}
          className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 px-5 py-3 font-semibold text-slate-200 hover:border-slate-700 hover:bg-slate-850 hover:text-white transition active:scale-[0.98]"
        >
          <span className="flex items-center gap-2.5">
            <Grid className="w-4 h-4 text-sky-400" />
            LEVEL SELECT
          </span>
          <span className="text-[10px] text-slate-500">60 ROOMS</span>
        </button>

        {/* Challenge Mode */}
        <button
          id="menu-btn-challenge"
          onClick={() => onNavigate('CHALLENGE')}
          className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 px-5 py-3 font-semibold text-slate-200 hover:border-amber-500/50 hover:bg-slate-850 hover:text-white transition active:scale-[0.98]"
        >
          <span className="flex items-center gap-2.5">
            <Flame className="w-4 h-4 text-amber-400" />
            CHALLENGE MODE
          </span>
          <span className="text-[10px] text-amber-400/80">MODIFIERS</span>
        </button>

        {/* Time Attack */}
        <button
          id="menu-btn-time-attack"
          onClick={() => onNavigate('TIME_ATTACK')}
          className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 px-5 py-3 font-semibold text-slate-200 hover:border-slate-700 hover:bg-slate-850 hover:text-white transition active:scale-[0.98]"
        >
          <span className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-emerald-400" />
            TIME ATTACK
          </span>
          <span className="text-[10px] text-slate-500">SPEEDRUN</span>
        </button>

        {/* Endless Flux */}
        <button
          id="menu-btn-endless"
          onClick={() => onNavigate('ENDLESS')}
          className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 px-5 py-3 font-semibold text-slate-200 hover:border-slate-700 hover:bg-slate-850 hover:text-white transition active:scale-[0.98]"
        >
          <span className="flex items-center gap-2.5">
            <Infinity className="w-4 h-4 text-purple-400" />
            ENDLESS FLUX
          </span>
          <span className="text-[10px] text-slate-500">PROCEDURAL</span>
        </button>

        {/* Daily Flux */}
        <button
          id="menu-btn-daily"
          onClick={() => onNavigate('DAILY')}
          className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 px-5 py-3 font-semibold text-slate-200 hover:border-slate-700 hover:bg-slate-850 hover:text-white transition active:scale-[0.98]"
        >
          <span className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-rose-400" />
            DAILY FLUX
          </span>
          <span className="text-[10px] text-slate-500">TODAY</span>
        </button>

        {/* Level Editor */}
        <button
          id="menu-btn-editor"
          onClick={() => onNavigate('EDITOR')}
          className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 px-5 py-3 font-semibold text-slate-200 hover:border-slate-700 hover:bg-slate-850 hover:text-white transition active:scale-[0.98]"
        >
          <span className="flex items-center gap-2.5">
            <Edit3 className="w-4 h-4 text-cyan-400" />
            LEVEL EDITOR
          </span>
          <span className="text-[10px] text-slate-500">CREATE</span>
        </button>

        {/* Target Platform & Godot 4 */}
        <button
          id="menu-btn-godot"
          onClick={() => onNavigate('PLATFORM_GODOT')}
          className="flex items-center justify-between rounded-xl border border-sky-500/30 bg-sky-950/50 px-5 py-3 font-semibold text-sky-300 hover:border-sky-400 hover:bg-sky-900/50 hover:text-white transition active:scale-[0.98]"
        >
          <span className="flex items-center gap-2.5">
            <Monitor className="w-4 h-4 text-sky-400" />
            GODOT 4 PC SPEC
          </span>
          <span className="text-[10px] text-emerald-400 font-mono font-bold">SECTION 29</span>
        </button>

        {/* Settings */}
        <button
          id="menu-btn-settings"
          onClick={() => onNavigate('SETTINGS')}
          className="flex items-center justify-between rounded-xl border border-transparent px-5 py-2.5 font-semibold text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition active:scale-[0.98]"
        >
          <span className="flex items-center gap-2.5">
            <Settings className="w-4 h-4" />
            SETTINGS & AUDIO
          </span>
          <span className="text-[10px]">CONFIG</span>
        </button>
      </div>

      {/* Footer Controls summary */}
      <div className="relative z-10 mt-8 text-[11px] font-mono text-slate-500 flex gap-4">
        <span>[A / D] Move</span>
        <span>[SPACE] Jump</span>
        <span>[1 - 6] Physics States</span>
        <span>[R] Reset</span>
        <span>[ESC] Pause</span>
      </div>
    </div>
  );
};
