import React from 'react';
import { CHALLENGE_MODIFIERS } from '../levels/challenges';
import { SavedGameData } from '../storage/saveSystem';
import { ArrowLeft, Flame, CheckCircle2, Play } from 'lucide-react';
import { ChallengeModifier } from '../types/game';

interface ChallengeSelectProps {
  saveData: SavedGameData;
  onSelectChallenge: (ch: ChallengeModifier) => void;
  onBack: () => void;
}

export const ChallengeSelect: React.FC<ChallengeSelectProps> = ({
  saveData,
  onSelectChallenge,
  onBack,
}) => {
  return (
    <div className="relative flex h-full w-full flex-col bg-slate-950 p-6 text-slate-100 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-wider text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500" />
              CHALLENGE PROTOCOLS
            </h1>
            <p className="text-xs text-slate-400">Restricted rule modifier trials</p>
          </div>
        </div>

        <div className="font-mono text-xs text-amber-400 bg-amber-950/40 border border-amber-500/30 rounded-xl px-3.5 py-1.5">
          {saveData.completedChallenges.length}/{CHALLENGE_MODIFIERS.length} PROTOCOLS COMPLETED
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-6">
        {CHALLENGE_MODIFIERS.map(ch => {
          const isDone = saveData.completedChallenges.includes(ch.id);

          return (
            <div
              key={ch.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-amber-500/50 transition"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-amber-400">
                    CHAMBER #{ch.levelId}
                  </span>
                  {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>
                <h2 className="text-base font-bold text-white mb-2">{ch.title}</h2>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">{ch.description}</p>
              </div>

              <button
                onClick={() => onSelectChallenge(ch)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500/90 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition active:scale-95"
              >
                <Play className="w-3.5 h-3.5" />
                INITIATE PROTOCOL
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
