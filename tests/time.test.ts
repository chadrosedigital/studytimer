import { describe, expect, it } from 'vitest';
import { allocateTime, dayKey, elapsedAt, newTimer, pauseTimer, startTimer, totalForDay, type Session } from '../src/lib/time';

describe('accurate active-time accounting', () => {
  it('uses elapsed timestamps and ignores delayed interval counts', () => {
    const timer = startTimer(newTimer('stopwatch', 0), 100, Date.now());
    expect(elapsedAt(timer, 12_445)).toBe(12_345);
  });
  it('never counts paused time and supports multiple resumes', () => {
    const wall = new Date(2026, 9, 23, 12).getTime();
    let timer = startTimer(newTimer('stopwatch', 0), 0, wall);
    timer = pauseTimer(timer, 15_000);
    expect(elapsedAt(timer, 100_000)).toBe(15_000);
    timer = startTimer(timer, 100_000, wall + 100_000);
    timer = pauseTimer(timer, 105_000);
    expect(timer.elapsedMs).toBe(20_000);
    expect(Object.values(timer.days).reduce((a, b) => a + b, 0)).toBe(20_000);
  });
  it('caps countdown at the target even if the completion callback is delayed', () => {
    const timer = startTimer(newTimer('countdown', 60_000), 0, Date.now());
    expect(pauseTimer(timer, 65_000).elapsedMs).toBe(60_000);
  });
  it('splits active time over local midnight', () => {
    const start = new Date(2026, 9, 23, 23, 59, 50);
    const days = allocateTime({}, start.getTime(), 30_000);
    expect(days).toEqual({ '2026-10-23': 10_000, '2026-10-24': 20_000 });
  });
  it('does not attribute a pause across midnight as study time', () => {
    const start = new Date(2026, 9, 23, 23, 59, 40).getTime();
    let timer = startTimer(newTimer('stopwatch', 0), 0, start);
    timer = pauseTimer(timer, 10_000);
    timer = startTimer(timer, 60_000, start + 60_000);
    timer = pauseTimer(timer, 80_000);
    expect(timer.days).toEqual({ '2026-10-23': 10_000, '2026-10-24': 20_000 });
  });
  it('is idempotent when pause or start is repeated', () => {
    const timer = startTimer(newTimer('stopwatch', 0), 0, Date.now());
    expect(startTimer(timer, 500, Date.now())).toBe(timer);
    const paused = pauseTimer(timer, 1000);
    expect(pauseTimer(paused, 4000)).toEqual(paused);
  });
  it('derives totals from current sessions so deletion removes time', () => {
    const session = { days: { '2026-10-23': 20_000 } } as Session;
    expect(totalForDay([session, session], '2026-10-23')).toBe(40_000);
    expect(totalForDay([], '2026-10-23')).toBe(0);
  });
  it('uses local date keys, not UTC dates', () => {
    expect(dayKey(new Date(2026, 0, 2, 0, 1))).toBe('2026-01-02');
  });
});
