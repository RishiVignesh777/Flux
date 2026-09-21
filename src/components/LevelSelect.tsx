import React, { useState } from 'react';
import { SavedGameData } from '../storage/saveSystem';
import { ArrowLeft, Lock, CheckCircle2, Sparkles, Clock } from 'lucide-react';
import { formatTimeMs } from '../utils/time';

interface LevelSelectProps {
  saveData: SavedGameData;
  onSelectLevel: (levelId: number) => void;
  onBack: () => void;
}

const SECTIONS = [
  { id: 1, title: 'SECTION 1: FUNDAMENTALS', range: [1, 10], desc: 'Movement, Jumping, Mass, Plates & Air Updrafts' },
  { id: 2, title: 'SECTION 2: MAGNETISM', range: [11, 20], desc: 'Polar Surfaces, Ceiling Adherence, Magnetic Blocks' },
  { id: 3, title: 'SECTION 3: MOMENTUM', range: [21, 30], desc: 'Elastic Bouncing, Dynamic Springs, Gravity Shifts' },
  { id: 4, title: 'SECTION 4: PHASE', range: [31, 40], desc: 'Quantum Phase Walls, Moving Platform Anchors' },
  { id: 5, title: 'SECTION 5: FLUX', range: [41, 50], desc: 'Flux Nodes & Dual Physics Synthesis' },
  { id: 6, title: 'SECTION 6: MASTER', range: [51, 60], desc: 'Grand Synthesis of All 6 Physics Modalities' },
];

export const LevelSelect: React.FC<LevelSelectProps> = ({
  saveData,
  onSelectLevel,
  onBack,
}) => {
  const [activeSectionId, setActiveSectionId] = useState(1);

  const activeSection = SECTIONS.find(s => s.id === activeSectionId) || SECTIONS[0];
  const [startLvl, endLvl] = activeSection.range;
  const levelList = Array.from({ length: endLvl - startLvl + 1 }, (_, i) => startLvl + i);

  return (
    <div className="relative flex h-full w-full flex-col bg-slate-950 p-6 text-slate-100 overflow-y-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            id="level-select-back"
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-wider text-white">CHAMBER SELECT</h1>
            <p className="text-xs text-slate-400">60 Handcrafted Physics Puzzle Rooms</p>
          </div>
        </div>

        {/* Global Shards Counter */}
        <div className="flex items-center gap-2 rounded-xl border border-sky-500/30 bg-sky-950/40 px-3.5 py-1.5 font-mono text-xs text-sky-300">
          <Sparkles className="w-4 h-4 fill-sky-400" />
          <span>{saveData.totalShards} SHARDS DISCOVERED</span>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 py-4">
        {SECTIONS.map(sec => {
          const isSelected = sec.id === activeSectionId;
          const isUnlocked = saveData.highestLevelUnlocked >= sec.range[0];

          return (
            <button
              key={sec.id}
              onClick={() => setActiveSectionId(sec.id)}
              className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition ${
                isSelected
                  ? 'border-sky-500 bg-sky-950/60 shadow-md shadow-sky-950/40'
                  : 'border-slate-800 bg-slate-900/50 hover:bg-slate-900'
              }`}
            >
              <div className="flex w-full items-center justify-between text-[10px] font-mono">
                <span className={isSelected ? 'text-sky-400 font-bold' : 'text-slate-500'}>
                  SEC {sec.id}
                </span>
                {!isUnlocked && <Lock className="w-3 h-3 text-slate-600" />}
              </div>
              <span className={`text-xs font-bold truncate w-full ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                {sec.title.split(': ')[1]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Section Header */}
      <div className="mb-4">
        <h2 className="text-sm font-bold text-sky-400 font-mono tracking-wider">
          {activeSection.title}
        </h2>
        <p className="text-xs text-slate-400">{activeSection.desc}</p>
      </div>

      {/* 10 Level Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 pb-12">
        {levelList.map(lvlId => {
          const isUnlocked = lvlId <= saveData.highestLevelUnlocked;
          const isCompleted = saveData.completedLevels.includes(lvlId);
          const shards = saveData.shardsPerLevel[lvlId] || 0;
          const stats = saveData.levelStats[lvlId];

          return (
            <button
              key={lvlId}
              id={`level-card-${lvlId}`}
              disabled={!isUnlocked}
              onClick={() => isUnlocked && onSelectLevel(lvlId)}
              className={`group relative flex flex-col justify-between rounded-2xl border p-4 text-left transition ${
                !isUnlocked
                  ? 'border-slate-800/60 bg-slate-900/30 opacity-50 cursor-not-allowed'
                  : isCompleted
                  ? 'border-emerald-500/40 bg-slate-900/80 hover:border-emerald-400 hover:bg-slate-850 hover:shadow-lg'
                  : 'border-slate-800 bg-slate-900/80 hover:border-sky-500 hover:bg-slate-850 hover:shadow-lg'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-sm font-bold text-slate-200 group-hover:text-white">
                  #{String(lvlId).padStart(2, '0')}
                </span>
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : !isUnlocked ? (
                  <Lock className="w-3.5 h-3.5 text-slate-600" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
                )}
              </div>

              {/* Shard Indicators */}
              <div className="flex items-center gap-1.5 mb-3">
                {[0, 1, 2].map(sIdx => (
                  <Sparkles
                    key={sIdx}
                    className={`w-3.5 h-3.5 ${
                      sIdx < shards ? 'text-sky-400 fill-sky-400' : 'text-slate-700'
                    }`}
                  />
                ))}
              </div>

              {/* Best time badge */}
              <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                <Clock className="w-3 h-3 text-slate-500" />
                {stats?.bestTime ? formatTimeMs(stats.bestTime) : isCompleted ? 'DONE' : 'UNPLAYED'}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
