import React, { useRef, useEffect, useState, useCallback } from 'react';
import { LevelData, PhysicsState, GameSettings, ChallengeModifier } from '../types/game';
import { PhysicsEngine, PlayerEntity } from '../physics/engine';
import { GameRenderer } from '../render/renderer';
import { soundManager } from '../audio/soundManager';
import { HUD } from './HUD';
import { LevelCompleteModal } from './LevelCompleteModal';
import { PauseMenu } from './PauseMenu';
import { GodotPlatformModal } from './GodotPlatformModal';

interface GameCanvasProps {
  levelData: LevelData;
  settings: GameSettings;
  challenge?: ChallengeModifier | null;
  bestTime?: number;
  onLevelCompleted: (timeSeconds: number, deaths: number, switches: number, shardsCollected: number) => void;
  onNextLevel: () => void;
  onOpenLevelSelect: () => void;
  onOpenSettings: () => void;
  onMainMenu: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  levelData,
  settings,
  challenge,
  bestTime,
  onLevelCompleted,
  onNextLevel,
  onOpenLevelSelect,
  onOpenSettings,
  onMainMenu,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Engines
  const engineRef = useRef<PhysicsEngine>(new PhysicsEngine());
  const rendererRef = useRef<GameRenderer>(new GameRenderer());

  // Deep cloned level instance to mutate blocks, switches, etc.
  const [activeLevel, setActiveLevel] = useState<LevelData>(() => JSON.parse(JSON.stringify(levelData)));

  // Player state
  const playerRef = useRef<PlayerEntity>({
    x: levelData.playerSpawn.x,
    y: levelData.playerSpawn.y,
    w: 20,
    h: 20,
    vx: 0,
    vy: 0,
    isGrounded: false,
    state: levelData.allowedStates[0] || 'NORMAL',
    combinedState: null,
    attachedToMagnet: false,
    magnetNormal: null,
    squashX: 1,
    squashY: 1,
    facing: 1,
    isDead: false,
    reachedExit: false,
  });

  // Trackers
  const [hudState, setHudState] = useState<PlayerEntity>(playerRef.current);
  const [timeSeconds, setTimeSeconds] = useState(0);
  const [deaths, setDeaths] = useState(0);
  const [switches, setSwitches] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Input states
  const inputRef = useRef({
    left: false,
    right: false,
    jump: false,
  });

  const prevGamepadButtonsRef = useRef<boolean[]>([]);
  const [controllerType, setControllerType] = useState<'KEYBOARD' | 'XBOX' | 'PLAYSTATION'>('KEYBOARD');
  const [showPlatformModal, setShowPlatformModal] = useState<boolean>(false);

  // Timers
  const gravityShiftTimerRef = useRef(0);
  const deathResetTimerRef = useRef<number | null>(null);
  const winTimeoutRef = useRef<number | null>(null);

  // Initialize & reset level
  const resetLevel = useCallback((incDeaths = false) => {
    if (deathResetTimerRef.current) {
      clearTimeout(deathResetTimerRef.current);
      deathResetTimerRef.current = null;
    }
    if (winTimeoutRef.current) {
      clearTimeout(winTimeoutRef.current);
      winTimeoutRef.current = null;
    }

    const freshLevel: LevelData = JSON.parse(JSON.stringify(levelData));
    setActiveLevel(freshLevel);

    engineRef.current.gravityDir = freshLevel.defaultGravity;
    gravityShiftTimerRef.current = 0;

    const initialAllowedState = challenge?.allowedStates?.[0] || freshLevel.allowedStates[0] || 'NORMAL';

    playerRef.current = {
      x: freshLevel.playerSpawn.x,
      y: freshLevel.playerSpawn.y,
      w: 20,
      h: 20,
      vx: 0,
      vy: 0,
      isGrounded: false,
      state: initialAllowedState,
      combinedState: null,
      attachedToMagnet: false,
      magnetNormal: null,
      squashX: 1,
      squashY: 1,
      facing: 1,
      isDead: false,
      reachedExit: false,
    };

    setHudState({ ...playerRef.current });
    setIsCompleted(false);

    if (incDeaths) {
      setDeaths(d => d + 1);
    }
  }, [levelData, challenge]);

  // When level prop changes, full reset
  useEffect(() => {
    setTimeSeconds(0);
    setDeaths(0);
    setSwitches(0);
    resetLevel(false);
  }, [levelData, resetLevel]);

  // Detect touch capability
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // State Switch Handler
  const handleSwitchState = useCallback((newState: PhysicsState) => {
    if (playerRef.current.isDead || playerRef.current.reachedExit) return;
    if (playerRef.current.state === newState) return;

    if (challenge?.allowedStates && !challenge.allowedStates.includes(newState)) {
      return;
    }
    if (challenge?.maxSwitches && switches >= challenge.maxSwitches) {
      return;
    }

    playerRef.current.state = newState;
    setSwitches(s => s + 1);
    setHudState({ ...playerRef.current });
    soundManager.playSwitch(newState);
  }, [challenge, switches]);

  // Sound Dispatcher from engine
  const handleSoundEvent = useCallback((type: string, extra?: unknown) => {
    switch (type) {
      case 'jump':
        soundManager.playJump(Boolean(extra));
        break;
      case 'land':
        soundManager.playLand(Boolean(extra));
        break;
      case 'bounce':
        soundManager.playBounce(typeof extra === 'number' ? extra : 1);
        break;
      case 'magnet':
        soundManager.playMagnetPull();
        break;
      case 'plate':
        soundManager.playPressurePlate(Boolean(extra));
        break;
      case 'door':
        soundManager.playDoor();
        break;
      case 'hazard':
      case 'death':
        soundManager.playHazardZap();
        if (settings.screenShake) {
          rendererRef.current.triggerScreenShake(8, 0.3);
        }
        break;
      case 'shard':
        soundManager.playShardCollect();
        break;
      case 'gravity':
        soundManager.playGravityShift();
        if (settings.screenShake) {
          rendererRef.current.triggerScreenShake(4, 0.2);
        }
        break;
      case 'win':
        soundManager.playLevelComplete();
        break;
    }
  }, [settings.screenShake]);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const bindings = settings.keybindings;

      if (e.code === bindings.pause) {
        setIsPaused(p => !p);
        return;
      }
      if (e.code === bindings.restart) {
        if (!challenge?.noRestart) {
          resetLevel(true);
        }
        return;
      }

      if (e.code === bindings.left) inputRef.current.left = true;
      if (e.code === bindings.right) inputRef.current.right = true;
      if (e.code === bindings.jump && !challenge?.noJump) {
        inputRef.current.jump = true;
      }

      // State switches
      if (e.code === bindings.stateHeavy) handleSwitchState('HEAVY');
      if (e.code === bindings.stateLight) handleSwitchState('LIGHT');
      if (e.code === bindings.stateMagnetic) handleSwitchState('MAGNETIC');
      if (e.code === bindings.stateElastic) handleSwitchState('ELASTIC');
      if (e.code === bindings.stateFrozen) handleSwitchState('FROZEN');
      if (e.code === bindings.statePhase) handleSwitchState('PHASE');
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const bindings = settings.keybindings;
      if (e.code === bindings.left) inputRef.current.left = false;
      if (e.code === bindings.right) inputRef.current.right = false;
      if (e.code === bindings.jump) inputRef.current.jump = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [settings.keybindings, handleSwitchState, resetLevel, challenge]);

  // Gamepad Polling
  const pollGamepad = useCallback(() => {
    const gamepads = navigator.getGamepads?.();
    if (!gamepads) return;
    const gp = gamepads[0];
    if (!gp) return;

    // Recognize Xbox vs PlayStation
    const id = (gp.id || '').toLowerCase();
    if (id.includes('playstation') || id.includes('ps4') || id.includes('ps5') || id.includes('dualshock') || id.includes('dualsense')) {
      if (controllerType !== 'PLAYSTATION') setControllerType('PLAYSTATION');
    } else {
      if (controllerType !== 'XBOX') setControllerType('XBOX');
    }

    // Movement: Left stick or D-pad
    const stickX = gp.axes[0];
    const dpadLeft = gp.buttons[14]?.pressed;
    const dpadRight = gp.buttons[15]?.pressed;

    inputRef.current.left = stickX < -0.25 || dpadLeft;
    inputRef.current.right = stickX > 0.25 || dpadRight;

    // Jump: Button 0 (A / Cross)
    if (!challenge?.noJump) {
      inputRef.current.jump = Boolean(gp.buttons[0]?.pressed);
    }

    const prev = prevGamepadButtonsRef.current;
    const justPressed = (btnIndex: number) => {
      const isPressed = Boolean(gp.buttons[btnIndex]?.pressed);
      const wasPressed = Boolean(prev[btnIndex]);
      return isPressed && !wasPressed;
    };

    // State switches (Edge-triggered so player switches cleanly once per tap)
    if (justPressed(4)) handleSwitchState('HEAVY'); // LB / L1
    if (justPressed(5)) handleSwitchState('LIGHT'); // RB / R1
    if (justPressed(2)) handleSwitchState('MAGNETIC'); // X / Square
    if (justPressed(1)) handleSwitchState('ELASTIC'); // B / Circle
    if (justPressed(6)) handleSwitchState('FROZEN'); // LT / L2
    if (justPressed(7)) handleSwitchState('PHASE'); // RT / R2

    // Restart: Button 3 (Y / Triangle)
    if (justPressed(3)) resetLevel(true);

    // Pause: Button 9 (Start / Menu / Options)
    if (justPressed(9)) setIsPaused(p => !p);

    // Store button state for edge detection
    prevGamepadButtonsRef.current = gp.buttons.map(b => Boolean(b.pressed));
  }, [challenge, handleSwitchState, resetLevel, controllerType]);

  // Fixed Timestep Game Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    const fixedDt = 1 / 60;
    let accumulator = 0;

    const gameLoop = (currentTime: number) => {
      animId = requestAnimationFrame(gameLoop);

      const rawDt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      const dt = rawDt * settings.gameSpeed;

      // Handle Gamepad
      pollGamepad();

      if (!isPaused && !isCompleted) {
        accumulator += dt;

        while (accumulator >= fixedDt) {
          const player = playerRef.current;

          // Challenge: Constant gravity shift
          if (challenge?.constantGravityShift && challenge.shiftInterval) {
            gravityShiftTimerRef.current += fixedDt;
            if (gravityShiftTimerRef.current >= challenge.shiftInterval) {
              gravityShiftTimerRef.current = 0;
              const dirs: Array<'DOWN' | 'LEFT' | 'UP' | 'RIGHT'> = ['DOWN', 'LEFT', 'UP', 'RIGHT'];
              const currentIdx = dirs.indexOf(engineRef.current.gravityDir);
              engineRef.current.gravityDir = dirs[(currentIdx + 1) % dirs.length];
              handleSoundEvent('gravity');
            }
          }

          // Challenge: Time limit
          if (challenge?.timeLimitSeconds) {
            if (timeSeconds > challenge.timeLimitSeconds && !player.isDead) {
              player.isDead = true;
              handleSoundEvent('death');
            }
          }

          // Step physics
          engineRef.current.update(
            fixedDt,
            player,
            activeLevel,
            inputRef.current,
            handleSoundEvent
          );

          // Handle Player Death
          if (player.isDead && !deathResetTimerRef.current) {
            deathResetTimerRef.current = window.setTimeout(() => {
              resetLevel(true);
            }, 600); // Rapid restart under 1 second!
          }

          // Handle Level Win
          if (player.reachedExit && !isCompleted && !winTimeoutRef.current) {
            // Trigger subtle level complete particle burst effect at the exit door location
            rendererRef.current.triggerLevelCompleteBurst(activeLevel.exitDoor, settings);

            const collectedShards = activeLevel.shards.filter(s => s.collected).length;
            onLevelCompleted(timeSeconds, deaths, switches, collectedShards);

            // Allow the particle burst to blossom at the exit door before displaying completion modal
            winTimeoutRef.current = window.setTimeout(() => {
              setIsCompleted(true);
              winTimeoutRef.current = null;
            }, 400);
          }

          accumulator -= fixedDt;
        }

        setTimeSeconds(t => t + dt);
      }

      // Render Frame
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          rendererRef.current.render(
            ctx,
            canvas.width,
            canvas.height,
            activeLevel,
            playerRef.current,
            engineRef.current.gravityDir,
            settings,
            dt
          );
        }
      }
    };

    animId = requestAnimationFrame(gameLoop);
    return () => {
      cancelAnimationFrame(animId);
      if (deathResetTimerRef.current) {
        clearTimeout(deathResetTimerRef.current);
      }
      if (winTimeoutRef.current) {
        clearTimeout(winTimeoutRef.current);
      }
    };
  }, [
    isPaused,
    isCompleted,
    activeLevel,
    settings,
    challenge,
    deaths,
    switches,
    timeSeconds,
    resetLevel,
    handleSoundEvent,
    onLevelCompleted,
    pollGamepad,
  ]);

  // Resize canvas to container
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          canvas.width = width;
          canvas.height = height;
        }
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="relative h-full w-full bg-slate-950 overflow-hidden select-none">
      <canvas ref={canvasRef} className="h-full w-full block" />

      {/* In-Game HUD */}
      {!isCompleted && !isPaused && (
        <HUD
          level={activeLevel}
          player={hudState}
          timeSeconds={timeSeconds}
          deaths={deaths}
          switches={switches}
          onSwitchState={handleSwitchState}
          onRestart={() => resetLevel(true)}
          onPause={() => setIsPaused(true)}
          onJumpPress={() => {
            if (!challenge?.noJump) {
              inputRef.current.jump = true;
              setTimeout(() => {
                inputRef.current.jump = false;
              }, 120);
            }
          }}
          onMoveLeft={active => {
            inputRef.current.left = active;
          }}
          onMoveRight={active => {
            inputRef.current.right = active;
          }}
          isTouchDevice={isTouchDevice}
          controllerType={controllerType}
          onOpenPlatformModal={() => setShowPlatformModal(true)}
        />
      )}

      {/* Target Platform & Godot 4 Modal */}
      {showPlatformModal && (
        <GodotPlatformModal onClose={() => setShowPlatformModal(false)} />
      )}

      {/* Pause Menu Modal */}
      {isPaused && (
        <PauseMenu
          onResume={() => setIsPaused(false)}
          onRestart={() => {
            setIsPaused(false);
            resetLevel(true);
          }}
          onOpenSettings={onOpenSettings}
          onLevelSelect={onOpenLevelSelect}
          onMainMenu={onMainMenu}
        />
      )}

      {/* Level Complete Modal */}
      {isCompleted && (
        <LevelCompleteModal
          levelId={activeLevel.id}
          levelName={activeLevel.name}
          timeSeconds={timeSeconds}
          deaths={deaths}
          switches={switches}
          shardsCollected={activeLevel.shards.filter(s => s.collected).length}
          totalShards={activeLevel.shards.length}
          bestTime={bestTime}
          isLastLevel={activeLevel.id >= 60}
          onNextLevel={onNextLevel}
          onReplay={() => resetLevel(false)}
          onLevelSelect={onOpenLevelSelect}
        />
      )}
    </div>
  );
};
