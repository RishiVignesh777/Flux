import { GameSettings, PlayerStats, LevelData } from '../types/game';

const SAVE_KEY = 'flux_game_save_v1';
const SETTINGS_KEY = 'flux_game_settings_v1';
const CUSTOM_LEVELS_KEY = 'flux_game_custom_levels_v1';

export interface SavedGameData {
  highestLevelUnlocked: number;
  completedLevels: number[];
  levelStats: Record<number, PlayerStats>;
  totalShards: number;
  shardsPerLevel: Record<number, number>; // levelId -> number of collected shards
  completedChallenges: string[];
  endlessHighScore: number;
  dailyCompletedDates: string[];
}

export const DEFAULT_SETTINGS: GameSettings = {
  masterVolume: 0.9,
  sfxVolume: 0.8,
  musicVolume: 0.4,
  gameSpeed: 1.0,
  screenShake: true,
  particleDensity: 'FULL',
  colorblindMode: false,
  keybindings: {
    left: 'KeyA',
    right: 'KeyD',
    jump: 'Space',
    stateHeavy: 'Digit1',
    stateLight: 'Digit2',
    stateMagnetic: 'Digit3',
    stateElastic: 'Digit4',
    stateFrozen: 'Digit5',
    statePhase: 'Digit6',
    restart: 'KeyR',
    pause: 'Escape',
  },
};

export const DEFAULT_SAVE_DATA: SavedGameData = {
  highestLevelUnlocked: 1,
  completedLevels: [],
  levelStats: {},
  totalShards: 0,
  shardsPerLevel: {},
  completedChallenges: [],
  endlessHighScore: 0,
  dailyCompletedDates: [],
};

export class SaveSystem {
  public static loadGameData(): SavedGameData {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return { ...DEFAULT_SAVE_DATA };
      return { ...DEFAULT_SAVE_DATA, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULT_SAVE_DATA };
    }
  }

  public static saveGameData(data: SavedGameData) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }

  public static recordLevelCompletion(
    levelId: number,
    timeSeconds: number,
    deaths: number,
    stateSwitches: number,
    shardsCollected: number
  ): SavedGameData {
    const data = this.loadGameData();

    if (!data.completedLevels.includes(levelId)) {
      data.completedLevels.push(levelId);
    }

    // Unlock next level up to 60
    if (levelId >= data.highestLevelUnlocked && levelId < 60) {
      data.highestLevelUnlocked = levelId + 1;
    }

    // Update stats
    const existing = data.levelStats[levelId];
    const bestTime = existing && existing.bestTime ? Math.min(existing.bestTime, timeSeconds) : timeSeconds;

    data.levelStats[levelId] = {
      timeSeconds,
      deaths,
      stateSwitches,
      shardsCollected: Math.max(existing?.shardsCollected || 0, shardsCollected),
      bestTime,
    };

    // Update shards
    const prevShards = data.shardsPerLevel[levelId] || 0;
    if (shardsCollected > prevShards) {
      data.totalShards += shardsCollected - prevShards;
      data.shardsPerLevel[levelId] = shardsCollected;
    }

    this.saveGameData(data);
    try {
      localStorage.setItem(`flux_best_time_${levelId}`, bestTime.toString());
    } catch {}
    return data;
  }

  public static getBestTime(levelId: number): number | undefined {
    try {
      const direct = localStorage.getItem(`flux_best_time_${levelId}`);
      if (direct !== null) {
        const parsed = parseFloat(direct);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
      const data = this.loadGameData();
      if (data.levelStats?.[levelId]?.bestTime) {
        return data.levelStats[levelId].bestTime;
      }
    } catch {
      // Ignore
    }
    return undefined;
  }

  public static saveBestTime(levelId: number, timeSeconds: number): void {
    try {
      localStorage.setItem(`flux_best_time_${levelId}`, timeSeconds.toString());
      const data = this.loadGameData();
      if (!data.levelStats[levelId]) {
        data.levelStats[levelId] = {
          timeSeconds,
          deaths: 0,
          stateSwitches: 0,
          shardsCollected: 0,
          bestTime: timeSeconds,
        };
      } else {
        const curBest = data.levelStats[levelId].bestTime;
        data.levelStats[levelId].bestTime = curBest ? Math.min(curBest, timeSeconds) : timeSeconds;
      }
      this.saveGameData(data);
    } catch (e) {
      console.error('Failed to save best time to localStorage', e);
    }
  }

  public static loadSettings(): GameSettings {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return { ...DEFAULT_SETTINGS };
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  public static saveSettings(settings: GameSettings) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  }

  public static loadCustomLevels(): LevelData[] {
    try {
      const raw = localStorage.getItem(CUSTOM_LEVELS_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public static saveCustomLevel(level: LevelData) {
    try {
      const current = this.loadCustomLevels();
      const idx = current.findIndex(l => l.id === level.id);
      if (idx >= 0) {
        current[idx] = level;
      } else {
        current.push(level);
      }
      localStorage.setItem(CUSTOM_LEVELS_KEY, JSON.stringify(current));
    } catch (e) {
      console.error('Failed to save custom level', e);
    }
  }

  public static deleteCustomLevel(levelId: number) {
    try {
      const current = this.loadCustomLevels().filter(l => l.id !== levelId);
      localStorage.setItem(CUSTOM_LEVELS_KEY, JSON.stringify(current));
    } catch (e) {
      console.error('Failed to delete custom level', e);
    }
  }
}
