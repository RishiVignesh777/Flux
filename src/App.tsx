import { useState, useEffect, useCallback } from 'react';
import { GameScreen, LevelData, ChallengeModifier, GameSettings } from './types/game';
import { SaveSystem, SavedGameData } from './storage/saveSystem';
import { getLevelData } from './levels/levelData';
import { generateProceduralLevel, getDailyLevel } from './levels/endlessGenerator';
import { soundManager } from './audio/soundManager';
import { MainMenu } from './components/MainMenu';
import { LevelSelect } from './components/LevelSelect';
import { ChallengeSelect } from './components/ChallengeSelect';
import { LevelEditor } from './components/LevelEditor';
import { SettingsModal } from './components/SettingsModal';
import { GameCanvas } from './components/GameCanvas';
import { GodotPlatformModal } from './components/GodotPlatformModal';

export default function App() {
  const [screen, setScreen] = useState<GameScreen>('MENU');
  const [saveData, setSaveData] = useState<SavedGameData>(() => SaveSystem.loadGameData());
  const [settings, setSettings] = useState<GameSettings>(() => SaveSystem.loadSettings());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Active level state
  const [currentLevelId, setCurrentLevelId] = useState(1);
  const [customLevelToPlay, setCustomLevelToPlay] = useState<LevelData | null>(null);
  const [activeChallenge, setActiveChallenge] = useState<ChallengeModifier | null>(null);

  // Endless tier tracker
  const [endlessTier, setEndlessTier] = useState(1);

  // Sync settings volume
  useEffect(() => {
    soundManager.setVolumes(settings.masterVolume, settings.sfxVolume, settings.musicVolume);
  }, [settings]);

  // Launch a campaign level
  const handleStartCampaignLevel = (levelId: number) => {
    setCurrentLevelId(levelId);
    setCustomLevelToPlay(null);
    setActiveChallenge(null);
    setScreen('PLAY');
    soundManager.startAmbientMusic();
  };

  // Launch a challenge trial
  const handleStartChallenge = (ch: ChallengeModifier) => {
    setActiveChallenge(ch);
    setCurrentLevelId(ch.levelId);
    setCustomLevelToPlay(null);
    setScreen('PLAY');
    soundManager.startAmbientMusic();
  };

  // Launch endless flux
  const handleStartEndless = () => {
    setEndlessTier(1);
    setCustomLevelToPlay(generateProceduralLevel(Date.now(), 1, 'Endless'));
    setActiveChallenge(null);
    setScreen('PLAY');
    soundManager.startAmbientMusic();
  };

  // Launch daily flux
  const handleStartDaily = () => {
    setCustomLevelToPlay(getDailyLevel());
    setActiveChallenge(null);
    setScreen('PLAY');
    soundManager.startAmbientMusic();
  };

  // Level completion callback
  const handleLevelCompleted = useCallback((time: number, deaths: number, switches: number, shards: number) => {
    if (activeChallenge) {
      const data = SaveSystem.loadGameData();
      if (!data.completedChallenges.includes(activeChallenge.id)) {
        data.completedChallenges.push(activeChallenge.id);
        SaveSystem.saveGameData(data);
        setSaveData(data);
      }
      return;
    }

    if (customLevelToPlay) {
      if (customLevelToPlay.name.startsWith('Endless')) {
        // Increment endless tier
        setEndlessTier(prev => {
          const next = prev + 1;
          setCustomLevelToPlay(generateProceduralLevel(Date.now() + next, next, 'Endless'));
          return next;
        });
      }
      return;
    }

    // Standard campaign level
    const updated = SaveSystem.recordLevelCompletion(currentLevelId, time, deaths, switches, shards);
    setSaveData(updated);
  }, [activeChallenge, customLevelToPlay, currentLevelId]);

  // Next level navigation
  const handleNextLevel = () => {
    if (customLevelToPlay?.name.startsWith('Endless')) {
      const nextTier = endlessTier + 1;
      setEndlessTier(nextTier);
      setCustomLevelToPlay(generateProceduralLevel(Date.now() + nextTier, nextTier, 'Endless'));
      return;
    }

    if (currentLevelId < 60) {
      setCurrentLevelId(prev => prev + 1);
    } else {
      setScreen('LEVEL_SELECT');
    }
  };

  // Determine current active level payload
  const resolvedLevelData: LevelData = customLevelToPlay || getLevelData(currentLevelId);
  const bestTime = saveData.levelStats[currentLevelId]?.bestTime;

  return (
    <div className="relative h-screen w-screen bg-slate-950 font-sans overflow-hidden select-none">
      {screen === 'MENU' && (
        <MainMenu
          saveData={saveData}
          onNavigate={dest => {
            if (dest === 'SETTINGS') {
              setIsSettingsOpen(true);
            } else if (dest === 'TIME_ATTACK') {
              handleStartCampaignLevel(saveData.highestLevelUnlocked);
            } else if (dest === 'ENDLESS') {
              handleStartEndless();
            } else if (dest === 'DAILY') {
              handleStartDaily();
            } else {
              setScreen(dest);
            }
          }}
          onStartLatestLevel={() => handleStartCampaignLevel(saveData.highestLevelUnlocked)}
        />
      )}

      {screen === 'LEVEL_SELECT' && (
        <LevelSelect
          saveData={saveData}
          onSelectLevel={lvlId => handleStartCampaignLevel(lvlId)}
          onBack={() => setScreen('MENU')}
        />
      )}

      {screen === 'CHALLENGE' && (
        <ChallengeSelect
          saveData={saveData}
          onSelectChallenge={ch => handleStartChallenge(ch)}
          onBack={() => setScreen('MENU')}
        />
      )}

      {screen === 'EDITOR' && (
        <LevelEditor
          onBack={() => setScreen('MENU')}
          onTestPlay={lvl => {
            setCustomLevelToPlay(lvl);
            setScreen('PLAY');
          }}
        />
      )}

      {screen === 'PLATFORM_GODOT' && (
        <GodotPlatformModal onClose={() => setScreen('MENU')} />
      )}

      {screen === 'PLAY' && (
        <GameCanvas
          levelData={resolvedLevelData}
          settings={settings}
          challenge={activeChallenge}
          bestTime={bestTime}
          onLevelCompleted={handleLevelCompleted}
          onNextLevel={handleNextLevel}
          onOpenLevelSelect={() => setScreen('LEVEL_SELECT')}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onMainMenu={() => {
            soundManager.stopAmbientMusic();
            setScreen('MENU');
          }}
        />
      )}

      {/* Global Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={newSet => {
            setSettings(newSet);
            SaveSystem.saveSettings(newSet);
          }}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
}
