import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, BarChart3, Check, CircleHelp, Clock3, Headphones, Pause, Play, Plus, RotateCcw, ShieldCheck, Timer, Volume2, VolumeX } from 'lucide-react';
import { clockText, dateFromKey, dayKey, defaultBlockName, durationText, totalForDay, type Mode, type Session, type TimerState } from './lib/time';
import { readSessions, removeSession, STORAGE_PREFIX, writeSession } from './lib/storage';
import { useTimer } from './hooks/useTimer';
import SessionList from './components/SessionList';
import History from './components/History';
import StudyDashboardBanner from './components/StudyDashboardBanner';

export default function App() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [view, setView] = useState<'timer' | 'history'>('timer');
  const [today, setToday] = useState(dayKey());
  const [name, setName] = useState('');
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('25');
  const [muted, setMuted] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [help, setHelp] = useState(false);
  const audio = useRef<AudioContext | null>(null);
  const nameInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    function load() { try { setSessions(readSessions()); } catch { setError('Saved history could not be read. Check that browser storage is available. Existing data has not been changed.'); } }
    load();
    try { setMuted(localStorage.getItem('studyspace.muted') === 'true'); } catch { /* storage error is shown by load */ }
    const changed = (event: StorageEvent) => { if (event.key === null || event.key.startsWith(STORAGE_PREFIX)) load(); };
    window.addEventListener('storage', changed);
    const tick = window.setInterval(() => setToday(dayKey()), 1000);
    return () => { clearInterval(tick); window.removeEventListener('storage', changed); };
  }, []);
  useEffect(() => { if (!notice) return; const id = setTimeout(() => setNotice(''), 6000); return () => clearTimeout(id); }, [notice]);
  function prepareAudio() {
    if (muted) return;
    try { audio.current ??= new AudioContext(); void audio.current.resume().catch(() => {}); } catch { /* Timers also show visible completion feedback. */ }
  }
  function chime() {
    if (muted || !audio.current) return;
    try {
      const ctx = audio.current;
      [523.25, 659.25, 783.99].forEach((frequency, index) => {
        const oscillator = ctx.createOscillator(); const gain = ctx.createGain(); const start = ctx.currentTime + index * 0.2;
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(0.12, start + 0.02); gain.gain.exponentialRampToValueAtTime(0.001, start + 0.65);
        oscillator.connect(gain); gain.connect(ctx.destination); oscillator.start(start); oscillator.stop(start + 0.7);
      });
    } catch { /* Audio is optional, never block saving. */ }
  }
  function save(timer: TimerState): boolean {
    const end = new Date();
    const session: Session = { id: crypto.randomUUID(), name: name.trim() || defaultBlockName(sessions, dayKey(end)), mode: timer.mode, durationMs: timer.elapsedMs, startedAt: timer.startedAt!, endedAt: end.toISOString(), days: timer.days };
    try {
      writeSession(session);
      setSessions(previous => [...previous, session].sort((a, b) => a.startedAt.localeCompare(b.startedAt)));
      setName(''); setError(''); setNotice(`${session.name} saved. ${durationText(session.durationMs)} well spent.`);
      if (timer.mode === 'countdown' && timer.elapsedMs >= timer.targetMs) chime();
      return true;
    } catch {
      setError('This block could not be saved. Your timer is paused and its time is still here. Free up browser storage, then select Finish & save again.');
      return false;
    }
  }
  const timer = useTimer(save, () => setNotice('Timer paused while you were away. Resume when you’re ready.'));
  const { snapshot, running, elapsed } = timer;
  const begun = snapshot.startedAt !== null;
  const customDuration = (Number(hours) * 60 + Number(minutes)) * 60_000;
  const validDuration = hours !== '' && minutes !== '' && Number.isInteger(Number(hours)) && Number.isInteger(Number(minutes)) && Number(hours) >= 0 && Number(hours) <= 23 && Number(minutes) >= 0 && Number(minutes) <= 59 && customDuration > 0;
  const displayTarget = begun ? snapshot.targetMs : (validDuration ? customDuration : 0);
  const remaining = Math.max(0, displayTarget - elapsed);
  const displayTime = snapshot.mode === 'countdown' ? Math.ceil(remaining / 1000) * 1000 : elapsed;
  const fraction = snapshot.mode === 'countdown' ? (displayTarget > 0 ? remaining / displayTarget : 0) : ((elapsed % 3_600_000) / 3_600_000);
  const circumference = 2 * Math.PI * 142;
  const todaySessions = sessions.filter(s => s.days[today] !== undefined);
  const todayTotal = totalForDay(sessions, today);
  function reset(mode: Mode = snapshot.mode) {
    if (begun && !window.confirm('Discard this unfinished block? Saved study blocks will be kept.')) return;
    timer.reset(mode, validDuration ? customDuration : 25 * 60_000); setName('');
  }
  function start() {
    if (!begun) timer.reset(snapshot.mode, validDuration ? customDuration : 25 * 60_000);
    prepareAudio(); timer.start();
  }
  function newBlock() {
    if (begun && !window.confirm('Discard this unfinished block and start a new one?')) return;
    timer.reset(); setName(''); setView('timer'); setTimeout(() => nameInput.current?.focus(), 0);
  }
  function rename(session: Session, nextName: string) {
    const updated = { ...session, name: nextName };
    try { writeSession(updated); setSessions(previous => previous.map(s => s.id === session.id ? updated : s)); setNotice('Block renamed.'); }
    catch { setError('Could not rename this block. Check browser storage and try again.'); }
  }
  function remove(session: Session) {
    if (!window.confirm(`Delete “${session.name}”? Its study time will be removed from your totals.`)) return;
    try { removeSession(session.id); setSessions(previous => previous.filter(s => s.id !== session.id)); setNotice('Block deleted. Totals updated.'); }
    catch { setError('Could not delete this block. Check browser storage and try again.'); }
  }
  function toggleMute() {
    setMuted(!muted); try { localStorage.setItem('studyspace.muted', String(!muted)); } catch { setNotice('Sound preference applies to this visit only.'); }
  }
  useEffect(() => { document.title = begun ? `${clockText(displayTime)} · Studyspace` : 'Studyspace — Make time for what matters'; }, [begun, Math.floor(displayTime / 1000)]);
  return <div className="app-shell">
    <a className="skip-link" href="#main">Skip to main content</a>
    <header className="app-header"><a className="brand" href="#" onClick={e => { e.preventDefault(); setView('timer'); }}><span className="brand-icon"><Timer size={23} aria-hidden="true" /></span>studyspace<span className="brand-period">.</span></a><nav aria-label="Main navigation"><button aria-current={view === 'timer' ? 'page' : undefined} onClick={() => setView('timer')}><Timer size={16} aria-hidden="true" />Focus</button><button aria-current={view === 'history' ? 'page' : undefined} onClick={() => setView('history')}><BarChart3 size={16} aria-hidden="true" />History</button></nav><div className="header-right"><span className="local-badge"><span />Your space to focus</span><button className="icon-button" aria-label="How Studyspace works" aria-expanded={help} onClick={() => setHelp(!help)}><CircleHelp size={19} aria-hidden="true" /></button></div></header>
    {help && <section className="help-panel"><strong>A quieter way to get things done.</strong><p>Choose a countdown or stopwatch, name your block, and press Start. Finish & save records only active study time. Switching tabs pauses the timer automatically. Unfinished blocks are discarded when you close or reload this page.</p><p>Completed history stays in this browser on this website. It does not sync across devices. Sessions crossing midnight split their study time between the correct local days.</p><button className="secondary-button" onClick={() => setHelp(false)}>Got it</button></section>}
    {error && <div className="error-banner" role="alert">{error}<button onClick={() => setError('')} aria-label="Dismiss error">Dismiss</button></div>}
    <div className="toast-region" role="status" aria-live="polite">{notice && <div className="toast"><Check size={16} aria-hidden="true" />{notice}</div>}</div>
    <main id="main" tabIndex={-1}>
      {view === 'timer' ? <div className="dashboard">
        <aside className="sidebar" aria-labelledby="blocks-heading"><div className="sidebar-heading"><p className="eyebrow">YOUR DAILY PRACTICE</p><div><h2 id="blocks-heading">Study blocks</h2><span className="count-badge">{todaySessions.length}</span></div><p className="muted">{dateFromKey(today).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</p></div><button className="new-block" onClick={newBlock}><Plus size={16} aria-hidden="true" />New study block</button><div className="sidebar-list"><SessionList sessions={todaySessions} day={today} rename={rename} remove={remove} /></div><div className="daily-total"><span><Clock3 size={15} aria-hidden="true" />Total focus today</span><strong>{durationText(todayTotal)}</strong><p>{todaySessions.length} {todaySessions.length === 1 ? 'block' : 'blocks'} completed</p><button onClick={() => setView('history')}>See your progress<ArrowUpRight size={14} aria-hidden="true" /></button></div></aside>
        <section className={`timer-workspace ${running ? 'is-running' : ''}`} aria-labelledby="focus-heading"><div className="workspace-top"><div><p className="eyebrow">ONE THING AT A TIME</p><h1 id="focus-heading">Make room for focus.</h1><p className="muted">A little less distraction. A little more progress.</p></div><span className="pill"><Headphones size={14} aria-hidden="true" />{running ? 'In the zone' : 'Find your flow'}</span></div>
          <div className="timer-area"><div className="mode-switch" aria-label="Timer mode">{(['countdown', 'stopwatch'] as Mode[]).map(mode => <button key={mode} aria-pressed={snapshot.mode === mode} onClick={() => { if (snapshot.mode !== mode) reset(mode); }}>{mode === 'countdown' ? <Timer size={15} aria-hidden="true" /> : <Clock3 size={15} aria-hidden="true" />}{mode === 'countdown' ? 'Countdown' : 'Stopwatch'}</button>)}</div>
            <label className="block-label" htmlFor="block-name">WHAT ARE YOU WORKING ON?</label><input className="block-input" id="block-name" ref={nameInput} value={name} maxLength={100} onChange={e => setName(e.target.value)} placeholder={defaultBlockName(sessions, today)} />
            <div className="timer-dial"><svg className="timer-svg" viewBox="0 0 320 320" aria-hidden="true"><circle className="ring-outer" cx="160" cy="160" r="158" /><circle className="ring-track" cx="160" cy="160" r="142" /><circle className="ring-progress" cx="160" cy="160" r="142" transform="rotate(-90 160 160)" strokeDasharray={circumference} strokeDashoffset={snapshot.mode === 'countdown' ? -circumference * (1 - fraction) : circumference * (1 - fraction)} /></svg><div className="timer-face"><span className="timer-state"><span className={running ? 'live-dot' : 'status-dot'} />{running ? 'FOCUS TIME' : begun ? 'ON PAUSE' : 'READY WHEN YOU ARE'}</span><div className="timer-digits" role="timer" aria-live="off" aria-label={`${snapshot.mode === 'countdown' ? 'Time remaining' : 'Time elapsed'}: ${clockText(displayTime)}`}>{clockText(displayTime)}</div><span className="timer-caption">{snapshot.mode === 'countdown' ? 'one focused moment at a time' : 'every moment counts'}</span></div></div>
            {!begun && snapshot.mode === 'countdown' && <div className="duration-settings"><div className="presets" aria-label="Quick durations">{[25, 45, 60, 90].map(n => <button key={n} aria-pressed={customDuration === n * 60_000} onClick={() => { setHours(String(Math.floor(n / 60))); setMinutes(String(n % 60)); }}>{n}<span> min</span></button>)}</div><div className="custom-duration"><label>Hours<input type="number" min="0" max="23" value={hours} onChange={e => setHours(e.target.value)} /></label><span>:</span><label>Minutes<input type="number" min="0" max="59" value={minutes} onChange={e => setMinutes(e.target.value)} /></label></div>{!validDuration && <p className="input-error" role="alert">Choose a duration from 1 minute to 23 hours 59 minutes.</p>}</div>}
            <div className="timer-controls"><button className="icon-button restart-button" disabled={!begun} aria-label="Restart timer" onClick={() => reset()}><RotateCcw size={19} aria-hidden="true" /></button><button className="primary-button" disabled={!begun && snapshot.mode === 'countdown' && !validDuration} onClick={running ? timer.pause : start}>{running ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}{running ? 'Pause' : begun ? 'Resume' : 'Start focusing'}</button><button className="icon-button" aria-label={muted ? 'Unmute completion alarm' : 'Mute completion alarm'} aria-pressed={muted} onClick={toggleMute}>{muted ? <VolumeX size={19} aria-hidden="true" /> : <Volume2 size={19} aria-hidden="true" />}</button></div>
            {begun ? <button className="finish-button" onClick={timer.finish}><Check size={16} aria-hidden="true" />Finish & save</button> : <p className="timer-footnote">No rush. Just you and your next small step.</p>}
            {begun && <p className="timer-footnote">Your timer pauses automatically when you leave this tab.</p>}
          </div><StudyDashboardBanner />
        </section>
      </div> : <History sessions={sessions} today={today} rename={rename} remove={remove} />}
    </main><footer className="app-footer"><span>Made for a more focused you.</span><span><ShieldCheck size={13} aria-hidden="true" />Private by design. Saved on this device.</span></footer>
  </div>;
}
