import React, { useEffect, useState, useRef } from 'react';
import { Trophy, Clock, Zap } from 'lucide-react';
import { formatTimeMs, formatDeltaTimeMs } from '../utils/time';

interface HUDTimerProps {
  timeSecondsRef?: React.MutableRefObject<number>;
  timeSeconds?: number;
  bestTime?: number;
  isPaused?: boolean;
  isCompleted?: boolean;
  compact?: boolean;
  className?: string;
}

export const HUDTimer: React.FC<HUDTimerProps> = ({
  timeSecondsRef,
  timeSeconds = 0,
  bestTime,
  isPaused = false,
  isCompleted = false,
  compact = false,
  className = '',
}) => {
  const [displayTime, setDisplayTime] = useState<number>(() => {
    return timeSecondsRef ? timeSecondsRef.current : timeSeconds;
  });

  const timerTextRef = useRef<HTMLSpanElement | null>(null);
  const deltaTextRef = useRef<HTMLSpanElement | null>(null);

  // High-frequency RAF loop for millisecond precision rendering
  useEffect(() => {
    let animId: number;

    const tick = () => {
      const currentTime = timeSecondsRef ? timeSecondsRef.current : timeSeconds;

      // Update direct DOM elements for zero-latency 60fps rendering without full component re-renders
      if (timerTextRef.current) {
        timerTextRef.current.textContent = formatTimeMs(currentTime);
      }

      if (deltaTextRef.current && bestTime !== undefined && bestTime > 0) {
        const delta = currentTime - bestTime;
        deltaTextRef.current.textContent = formatDeltaTimeMs(delta);
        if (delta <= 0) {
          deltaTextRef.current.className = 'text-[10px] font-mono font-bold text-emerald-400';
        } else {
          deltaTextRef.current.className = 'text-[10px] font-mono font-semibold text-rose-400/90';
        }
      }

      setDisplayTime(currentTime);

      if (!isPaused && !isCompleted) {
        animId = requestAnimationFrame(tick);
      }
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [timeSecondsRef, timeSeconds, isPaused, isCompleted, bestTime]);

  const hasBest = bestTime !== undefined && bestTime > 0;
  const isNewBest = isCompleted && hasBest && displayTime <= (bestTime || Infinity);
  const delta = hasBest ? displayTime - (bestTime as number) : 0;
  const isAhead = delta <= 0;

  if (compact) {
    return (
      <div
        id="hud-realtime-timer-compact"
        data-testid="hud-timer"
        className={`inline-flex items-center gap-2 font-mono ${className}`}
      >
        <span className="flex items-center gap-1 text-slate-300">
          <Clock className="w-3.5 h-3.5 text-sky-400" />
          <span ref={timerTextRef} className="font-bold text-white tabular-nums">
            {formatTimeMs(displayTime)}
          </span>
        </span>
        {hasBest && (
          <span className="flex items-center gap-1 text-amber-300 text-[10px]" title="Best Time from localStorage">
            <Trophy className="w-3 h-3 text-amber-400" />
            <span className="text-slate-400">PB:</span>
            <span className="font-semibold text-amber-300 tabular-nums">{formatTimeMs(bestTime as number)}</span>
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      id="hud-realtime-timer"
      data-testid="hud-timer"
      className={`pointer-events-auto relative flex items-center gap-3 rounded-xl border border-sky-500/30 bg-slate-950/85 px-3.5 py-1.5 shadow-xl shadow-sky-950/40 backdrop-blur-md transition-all ${
        isNewBest ? 'border-amber-400/80 bg-amber-950/60 shadow-amber-500/20' : ''
      } ${className}`}
    >
      {/* Live Timer Section */}
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-950/80 border border-sky-500/40 text-sky-400">
          <Clock className="w-4 h-4 animate-pulse" />
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 font-bold">
            TIME
          </span>
          <span
            ref={timerTextRef}
            id="hud-timer-display"
            className="text-sm font-mono font-extrabold tracking-tight text-white tabular-nums drop-shadow-sm"
          >
            {formatTimeMs(displayTime)}
          </span>
        </div>
      </div>

      {/* Vertical Divider */}
      <div className="h-7 w-px bg-slate-800" />

      {/* Best Time / PB Section */}
      <div className="flex items-center gap-2" id="hud-best-time-container">
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-lg border ${
            hasBest
              ? 'bg-amber-950/80 border-amber-500/40 text-amber-400'
              : 'bg-slate-900/60 border-slate-800 text-slate-500'
          }`}
        >
          <Trophy className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 font-bold">
            BEST (PB)
          </span>
          <div className="flex items-center gap-1.5">
            <span
              id="hud-best-time"
              className={`text-xs font-mono font-bold tabular-nums ${
                hasBest ? 'text-amber-300' : 'text-slate-500'
              }`}
            >
              {hasBest ? formatTimeMs(bestTime as number) : '--:--.---'}
            </span>

            {/* Live Delta vs PB */}
            {hasBest && !isCompleted && (
              <span
                ref={deltaTextRef}
                id="hud-timer-delta"
                className={`text-[10px] font-mono font-bold tabular-nums ${
                  isAhead ? 'text-emerald-400' : 'text-rose-400/90'
                }`}
                title="Current delta relative to Personal Best"
              >
                {formatDeltaTimeMs(delta)}
              </span>
            )}

            {/* New Record Celebration Badge */}
            {isNewBest && (
              <span className="inline-flex items-center gap-0.5 rounded bg-amber-500/20 border border-amber-400/50 px-1 py-0.2 text-[9px] font-mono font-extrabold uppercase text-amber-300 animate-pulse">
                <Zap className="w-2.5 h-2.5" /> NEW PB
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
