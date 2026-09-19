import React from 'react';
import { Sparkles, ArrowRight, RotateCcw, Grid, Clock, Skull, Zap } from 'lucide-react';

interface LevelCompleteModalProps {
  levelId: number;
  levelName: string;
  timeSeconds: number;
  deaths: number;
  switches: number;
  shardsCollected: number;
  totalShards: number;
  bestTime?: number;
  isLastLevel?: boolean;
  onNextLevel: () => void;
  onReplay: () => void;
  onLevelSelect: () => void;
}

export const LevelCompleteModal: React.FC<LevelCompleteModalProps> = ({
  levelId,
  levelName,
  timeSeconds,
  deaths,
  switches,
  shardsCollected,
  totalShards,
  bestTime,
  isLastLevel,
  onNextLevel,
  onReplay,
  onLevelSelect,
}) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-sky-500/40 bg-slate-900/95 p-6 shadow-2xl shadow-sky-950/50 text-center">
        {/* Header Title */}
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-950/60 px-3 py-1 text-xs font-mono font-bold tracking-widest text-sky-400 mb-2">
          CHAMBER {String(levelId).padStart(2, '0')} RESOLVED
        </div>
        <h2 className="text-2xl font-bold tracking-wide text-white mb-1">
          LEVEL COMPLETE
        </h2>
        <p className="text-sm text-slate-400 mb-6">{levelName}</p>

        {/* Shards Badges */}
        <div className="flex items-center justify-center gap-3 mb-6">
          {Array.from({ length: Math.max(totalShards, 1) }).map((_, i) => {
            const hasShard = i < shardsCollected;
            return (
              <div
                key={i}
                className={`flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                  hasShard
                    ? 'border-sky-400 bg-sky-950/80 text-sky-300 shadow-md shadow-sky-500/20'
                    : 'border-slate-800 bg-slate-950 text-slate-600'
                }`}
              >
                <Sparkles className={`w-5 h-5 ${hasShard ? 'fill-sky-400' : ''}`} />
              </div>
            );
          })}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-800 bg-slate-950/80 p-3 mb-6 text-left text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-400 p-1.5 rounded bg-slate-900/40">
            <Clock className="w-4 h-4 text-sky-400" />
            <span>TIME: <strong className="text-white">{timeSeconds.toFixed(2)}s</strong></span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 p-1.5 rounded bg-slate-900/40">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>SWITCHES: <strong className="text-white">{switches}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 p-1.5 rounded bg-slate-900/40">
            <Skull className="w-4 h-4 text-rose-400" />
            <span>DEATHS: <strong className="text-white">{deaths}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 p-1.5 rounded bg-slate-900/40">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>BEST: <strong className="text-white">{bestTime ? `${bestTime.toFixed(2)}s` : `${timeSeconds.toFixed(2)}s`}</strong></span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          {!isLastLevel ? (
            <button
              id="complete-btn-next"
              onClick={onNextLevel}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-sky-500/25 hover:bg-sky-400 transition active:scale-[0.98]"
            >
              NEXT LEVEL
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              id="complete-btn-next"
              onClick={onLevelSelect}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 transition active:scale-[0.98]"
            >
              CAMPAIGN COMPLETED
              <Sparkles className="w-4 h-4" />
            </button>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              id="complete-btn-replay"
              onClick={onReplay}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition active:scale-[0.98]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              REPLAY
            </button>
            <button
              id="complete-btn-level-select"
              onClick={onLevelSelect}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition active:scale-[0.98]"
            >
              <Grid className="w-3.5 h-3.5" />
              LEVEL SELECT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
