import { useCallback, useEffect, useRef, useState } from 'react';
import { elapsedAt, newTimer, pauseTimer, startTimer, type Mode, type TimerState } from '../lib/time';

export function useTimer(onComplete: (timer: TimerState) => boolean, onAutoPause: () => void) {
  const ref = useRef(newTimer('countdown', 25 * 60_000));
  const [snapshot, setSnapshot] = useState(ref.current);
  const [elapsed, setElapsed] = useState(0);
  const completeRef = useRef(onComplete);
  const pauseRef = useRef(onAutoPause);
  completeRef.current = onComplete;
  pauseRef.current = onAutoPause;
  const publish = useCallback((timer: TimerState) => {
    ref.current = timer;
    setSnapshot(timer);
    setElapsed(timer.elapsedMs);
  }, []);
  const finish = useCallback(() => {
    const paused = pauseTimer(ref.current, performance.now());
    // Freeze first: rapid repeated clicks cannot save the same running segment.
    publish(paused);
    if (paused.elapsedMs < 1) return false;
    if (!completeRef.current(paused)) return false;
    publish(newTimer(paused.mode, paused.targetMs));
    return true;
  }, [publish]);
  useEffect(() => {
    const interval = window.setInterval(() => {
      const timer = ref.current;
      if (timer.anchor === null) return;
      const value = elapsedAt(timer, performance.now());
      setElapsed(value);
      if (timer.mode === 'countdown' && value >= timer.targetMs) finish();
    }, 100);
    const hide = () => {
      if (ref.current.anchor !== null) {
        publish(pauseTimer(ref.current, performance.now()));
        pauseRef.current();
      }
    };
    const visibility = () => { if (document.hidden) hide(); };
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (ref.current.startedAt !== null) { event.preventDefault(); event.returnValue = ''; }
    };
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('pagehide', hide);
    window.addEventListener('beforeunload', beforeUnload);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('pagehide', hide);
      window.removeEventListener('beforeunload', beforeUnload);
    };
  }, [finish, publish]);
  return {
    snapshot, elapsed, running: snapshot.anchor !== null,
    start: () => { if (!document.hidden) publish(startTimer(ref.current, performance.now(), Date.now())); },
    pause: () => publish(pauseTimer(ref.current, performance.now())),
    reset: (mode: Mode = ref.current.mode, targetMs = ref.current.targetMs) => publish(newTimer(mode, targetMs)),
    finish,
  };
}
