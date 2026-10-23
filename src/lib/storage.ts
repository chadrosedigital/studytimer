import type { Session } from './time';
const PREFIX = 'studyspace.session.v1.';
export const STORAGE_PREFIX = PREFIX;
export function readSessions(): Session[] {
  const sessions: Session[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(PREFIX)) continue;
    const s: unknown = JSON.parse(localStorage.getItem(key) || 'null');
    if (!isSession(s)) throw new Error('A saved study block could not be read. Your stored data has not been changed.');
    sessions.push(s);
  }
  return sessions.sort((a, b) => a.startedAt.localeCompare(b.startedAt));
}
export function isSession(value: unknown): value is Session {
  if (!value || typeof value !== 'object') return false;
  const s = value as Session;
  return typeof s.id === 'string' && typeof s.name === 'string' &&
    ['countdown', 'stopwatch'].includes(s.mode) && Number.isFinite(s.durationMs) && s.durationMs > 0 &&
    typeof s.startedAt === 'string' && Number.isFinite(Date.parse(s.startedAt)) &&
    typeof s.endedAt === 'string' && Number.isFinite(Date.parse(s.endedAt)) &&
    !!s.days && typeof s.days === 'object' && Object.entries(s.days).every(([k, v]) => /^\d{4}-\d{2}-\d{2}$/.test(k) && Number.isFinite(v) && v >= 0);
}
export function writeSession(session: Session): void {
  localStorage.setItem(PREFIX + session.id, JSON.stringify(session));
}
export function removeSession(id: string): void { localStorage.removeItem(PREFIX + id); }
