export type Mode = 'countdown' | 'stopwatch';
export type DayTotals = Record<string, number>;
export interface Session {
  id: string;
  name: string;
  mode: Mode;
  durationMs: number;
  startedAt: string;
  endedAt: string;
  days: DayTotals;
}
export function dayKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function dateFromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}
export function clockText(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map(n => String(n).padStart(2, '0')).join(':');
}
export function durationText(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
}
export function totalForDay(sessions: Session[], key: string): number {
  return sessions.reduce((n, s) => n + (s.days[key] || 0), 0);
}
/** Split only active time at local midnight, including DST-length days. */
export function allocateTime(days: DayTotals, wallStart: number, elapsed: number): DayTotals {
  const result = { ...days };
  let cursor = wallStart;
  let left = Math.max(0, elapsed);
  while (left > 0) {
    const date = new Date(cursor);
    const midnight = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).getTime();
    const portion = Math.min(left, midnight - cursor);
    const key = dayKey(date);
    result[key] = (result[key] || 0) + portion;
    left -= portion;
    cursor += portion;
  }
  return result;
}
export interface TimerState {
  mode: Mode;
  targetMs: number;
  elapsedMs: number;
  anchor: number | null;
  wallAnchor: number | null;
  startedAt: string | null;
  days: DayTotals;
}
export function newTimer(mode: Mode, targetMs: number): TimerState {
  return { mode, targetMs, elapsedMs: 0, anchor: null, wallAnchor: null, startedAt: null, days: {} };
}
export function elapsedAt(timer: TimerState, now: number): number {
  const elapsed = timer.elapsedMs + (timer.anchor === null ? 0 : Math.max(0, now - timer.anchor));
  return timer.mode === 'countdown' ? Math.min(timer.targetMs, elapsed) : elapsed;
}
export function startTimer(timer: TimerState, now: number, wallNow: number): TimerState {
  if (timer.anchor !== null) return timer;
  return { ...timer, anchor: now, wallAnchor: wallNow, startedAt: timer.startedAt || new Date(wallNow).toISOString() };
}
export function pauseTimer(timer: TimerState, now: number): TimerState {
  const elapsedMs = elapsedAt(timer, now);
  const days = timer.wallAnchor === null ? timer.days : allocateTime(timer.days, timer.wallAnchor, elapsedMs - timer.elapsedMs);
  return { ...timer, elapsedMs, days, anchor: null, wallAnchor: null };
}
export function defaultBlockName(sessions: Session[], day: string): string {
  const numbers = sessions.filter(s => s.days[day] !== undefined).map(s => Number(s.name.match(/^Block (\d+)$/)?.[1] || 0));
  return `Block ${Math.max(sessions.filter(s => s.days[day] !== undefined).length, ...numbers, 0) + 1}`;
}
