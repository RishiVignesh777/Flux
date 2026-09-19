import React from 'react';
import { Play, RotateCcw, Settings, Grid, Home } from 'lucide-react';

interface PauseMenuProps {
  onResume: () => void;
  onRestart: () => void;
  onOpenSettings: () => void;
  onLevelSelect: () => void;
  onMainMenu: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  onResume,
  onRestart,
  onOpenSettings,
  onLevelSelect,
  onMainMenu,
}) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl text-center">
        <h2 className="text-xl font-bold tracking-wider text-white mb-6">
          PAUSED
        </h2>

        <div className="flex flex-col gap-2.5">
          <button
            id="pause-btn-resume"
            onClick={onResume}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-sky-500/25 hover:bg-sky-400 transition active:scale-[0.98]"
          >
            <Play className="w-4 h-4" />
            RESUME
          </button>

          <button
            id="pause-btn-restart"
            onClick={onRestart}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition active:scale-[0.98]"
          >
            <RotateCcw className="w-4 h-4" />
            RESTART LEVEL (R)
          </button>

          <button
            id="pause-btn-settings"
            onClick={onOpenSettings}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition active:scale-[0.98]"
          >
            <Settings className="w-4 h-4" />
            SETTINGS
          </button>

          <button
            id="pause-btn-select"
            onClick={onLevelSelect}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition active:scale-[0.98]"
          >
            <Grid className="w-4 h-4" />
            LEVEL SELECT
          </button>

          <button
            id="pause-btn-home"
            onClick={onMainMenu}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-transparent py-2.5 text-xs font-semibold text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 transition active:scale-[0.98]"
          >
            <Home className="w-4 h-4" />
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
};
