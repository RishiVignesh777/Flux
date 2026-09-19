import React, { useState } from 'react';
import { GameSettings } from '../types/game';
import { X, Volume2, Monitor, Eye, Keyboard, Gauge } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'AUDIO' | 'GRAPHICS' | 'CONTROLS'>('AUDIO');
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const handleVolumeChange = (field: 'masterVolume' | 'sfxVolume' | 'musicVolume', val: number) => {
    const updated = { ...settings, [field]: val };
    onUpdateSettings(updated);
    soundManager.setVolumes(updated.masterVolume, updated.sfxVolume, updated.musicVolume);
    if (field === 'sfxVolume' || field === 'masterVolume') {
      soundManager.playSwitch('LIGHT');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!editingKey) return;
    e.preventDefault();
    const updatedBindings = {
      ...settings.keybindings,
      [editingKey]: e.code,
    };
    onUpdateSettings({ ...settings, keybindings: updatedBindings });
    setEditingKey(null);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl flex flex-col max-h-[90vh]"
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h2 className="text-lg font-bold tracking-wide text-white">SETTINGS & ACCESSIBILITY</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2 pt-4 pb-4 border-b border-slate-800/80 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('AUDIO')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
              activeTab === 'AUDIO' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            AUDIO
          </button>
          <button
            onClick={() => setActiveTab('GRAPHICS')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
              activeTab === 'GRAPHICS' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            GRAPHICS & ACCESSIBILITY
          </button>
          <button
            onClick={() => setActiveTab('CONTROLS')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
              activeTab === 'CONTROLS' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            CONTROLS
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 text-sm">
          {activeTab === 'AUDIO' && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-slate-300 font-mono mb-1.5">
                  <span>MASTER VOLUME</span>
                  <span>{Math.round(settings.masterVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.masterVolume}
                  onChange={e => handleVolumeChange('masterVolume', parseFloat(e.target.value))}
                  className="w-full accent-sky-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 font-mono mb-1.5">
                  <span>SOUND EFFECTS (SFX)</span>
                  <span>{Math.round(settings.sfxVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.sfxVolume}
                  onChange={e => handleVolumeChange('sfxVolume', parseFloat(e.target.value))}
                  className="w-full accent-sky-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 font-mono mb-1.5">
                  <span>ATMOSPHERIC SYNTH (MUSIC)</span>
                  <span>{Math.round(settings.musicVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.musicVolume}
                  onChange={e => handleVolumeChange('musicVolume', parseFloat(e.target.value))}
                  className="w-full accent-sky-500 cursor-pointer"
                />
              </div>
            </div>
          )}

          {activeTab === 'GRAPHICS' && (
            <div className="space-y-4">
              {/* Game Speed */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Gauge className="w-4 h-4 text-sky-400" />
                    Simulation Speed
                  </div>
                  <div className="text-xs text-slate-400">Scale physics simulation speed</div>
                </div>
                <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  {[0.5, 0.75, 1.0, 1.25].map(spd => (
                    <button
                      key={spd}
                      onClick={() => onUpdateSettings({ ...settings, gameSpeed: spd })}
                      className={`px-2 py-1 text-xs font-mono rounded ${
                        settings.gameSpeed === spd ? 'bg-sky-500 font-bold text-slate-950' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Screen Shake */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">Screen Shake</div>
                  <div className="text-xs text-slate-400">Impact dynamic shake effects</div>
                </div>
                <button
                  onClick={() => onUpdateSettings({ ...settings, screenShake: !settings.screenShake })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    settings.screenShake ? 'bg-sky-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      settings.screenShake ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Particle Density */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">Particle Density</div>
                  <div className="text-xs text-slate-400">Adjust physics trail and visual debris count</div>
                </div>
                <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  {(['FULL', 'REDUCED', 'OFF'] as const).map(density => (
                    <button
                      key={density}
                      onClick={() => onUpdateSettings({ ...settings, particleDensity: density })}
                      className={`px-2 py-1 text-xs font-mono rounded ${
                        settings.particleDensity === density
                          ? 'bg-sky-500 font-bold text-slate-950'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {density}
                    </button>
                  ))}
                </div>
              </div>

              {/* Colorblind Mode */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-emerald-400" />
                    Colorblind State Glyphs
                  </div>
                  <div className="text-xs text-slate-400">High-contrast geometric glyph overlays on states</div>
                </div>
                <button
                  onClick={() => onUpdateSettings({ ...settings, colorblindMode: !settings.colorblindMode })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    settings.colorblindMode ? 'bg-sky-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      settings.colorblindMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'CONTROLS' && (
            <div className="space-y-2">
              <div className="text-xs text-slate-400 mb-2">
                Click a binding and press any key to remap.
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {Object.entries(settings.keybindings).map(([action, code]) => (
                  <div
                    key={action}
                    className="flex items-center justify-between p-2 rounded-lg border border-slate-800 bg-slate-950/70"
                  >
                    <span className="text-slate-400 uppercase">{action.replace('state', 'State ')}</span>
                    <button
                      onClick={() => setEditingKey(action)}
                      className={`px-2 py-1 rounded text-[11px] font-bold ${
                        editingKey === action
                          ? 'bg-amber-500 text-slate-950 animate-pulse'
                          : 'bg-slate-800 text-sky-400 hover:bg-slate-700'
                      }`}
                    >
                      {editingKey === action ? 'PRESS KEY' : code.replace('Key', '').replace('Digit', '')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-sky-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-sky-400 transition active:scale-95"
          >
            SAVE & CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
