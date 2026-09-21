/**
 * Time formatting utilities with millisecond precision for speedrun HUD timers.
 */

export function formatTimeMs(totalSeconds: number): string {
  if (isNaN(totalSeconds) || totalSeconds < 0) return '00:00.000';
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const ms = Math.floor((totalSeconds % 1) * 1000);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

export function formatDeltaTimeMs(deltaSeconds: number): string {
  const sign = deltaSeconds < 0 ? '-' : '+';
  const abs = Math.abs(deltaSeconds);
  const minutes = Math.floor(abs / 60);
  const seconds = Math.floor(abs % 60);
  const ms = Math.floor((abs % 1) * 1000);
  if (minutes > 0) {
    return `${sign}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
  }
  return `${sign}${String(seconds).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}
