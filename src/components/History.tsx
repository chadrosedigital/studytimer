import { useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, Clock3, Layers, TrendingUp } from 'lucide-react';
import { dateFromKey, dayKey, durationText, totalForDay, type Session } from '../lib/time';
import SessionList from './SessionList';
interface Props { sessions: Session[]; today: string; rename: (s: Session, name: string) => void; remove: (s: Session) => void; }
export default function History({ sessions, today, rename, remove }: Props) {
  const [selected, setSelected] = useState(today);
  const [month, setMonth] = useState(() => { const d = dateFromKey(today); return new Date(d.getFullYear(), d.getMonth(), 1, 12); });
  const now = dateFromKey(today);
  const monday = new Date(now); monday.setDate(now.getDate() - (now.getDay() + 6) % 7);
  const week = Array.from({ length: 7 }, (_, i) => { const date = new Date(monday); date.setDate(monday.getDate() + i); const key = dayKey(date); return { key, date, value: totalForDay(sessions, key) }; });
  const allDays = [...new Set(sessions.flatMap(s => Object.keys(s.days)))].sort();
  const total = sessions.reduce((sum, s) => sum + s.durationMs, 0);
  const monthPrefix = today.slice(0, 7);
  const monthTotal = allDays.filter(d => d.startsWith(monthPrefix)).reduce((sum, d) => sum + totalForDay(sessions, d), 0);
  const weekTotal = week.reduce((sum, d) => sum + d.value, 0);
  const max = Math.max(...week.map(d => d.value), 60_000);
  const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const offset = (month.getDay() + 6) % 7;
  const chosenSessions = sessions.filter(s => s.days[selected] !== undefined);
  function selectDay(key: string) { setSelected(key); const d = dateFromKey(key); setMonth(new Date(d.getFullYear(), d.getMonth(), 1, 12)); }
  return <section className="history-view" aria-labelledby="history-title">
    <div className="section-heading"><div><p className="eyebrow">THE BIGGER PICTURE</p><h1 id="history-title">Every session adds up.</h1><p className="muted">Small steps. Meaningful progress.</p></div><span className="pill"><CalendarDays size={14} aria-hidden="true" />Your study history</span></div>
    <div className="stats-grid">{[
      { label: 'Today', value: durationText(totalForDay(sessions, today)), icon: Clock3 },
      { label: 'This week', value: durationText(weekTotal), icon: TrendingUp },
      { label: 'This month', value: durationText(monthTotal), icon: CalendarDays },
      { label: 'All-time focus', value: durationText(total), icon: Layers },
    ].map(s => <div className="stat-card" key={s.label}><s.icon size={17} aria-hidden="true" /><span>{s.label}</span><strong>{s.value}</strong></div>)}</div>
    <div className="history-grid">
      <section className="panel"><div className="panel-heading"><h2>This week</h2><span className="muted">{durationText(weekTotal)} total</span></div><div className="bar-chart" aria-label="Study time this week">{week.map(d => <button key={d.key} className={`chart-column ${selected === d.key ? 'selected' : ''}`} onClick={() => selectDay(d.key)} aria-label={`${d.date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}: ${durationText(d.value)}`} aria-pressed={selected === d.key}><span className="bar-value">{durationText(d.value)}</span><span className="bar-track"><span className={`bar ${d.key === today ? 'today-bar' : ''}`} style={{ height: `${Math.max(2, d.value / max * 100)}%` }} /></span><span className="bar-label">{d.date.toLocaleDateString(undefined, { weekday: 'short' })}</span></button>)}</div><div className="chart-summary"><span><strong>{sessions.length}</strong> completed {sessions.length === 1 ? 'session' : 'sessions'}</span><span><strong>{durationText(allDays.length ? total / allDays.length : 0)}</strong> / active day</span></div></section>
      <section className="panel"><div className="panel-heading"><h2>{month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h2><div className="flex"><button className="icon-button" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1, 12))}><ChevronLeft size={17} /></button><button className="icon-button" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1, 12))}><ChevronRight size={17} /></button></div></div><div className="calendar">{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={`label-${i}`} className="weekday">{d}</span>)}{Array.from({ length: offset }, (_, i) => <span key={`blank-${i}`} />)}{Array.from({ length: count }, (_, i) => {
        const date = new Date(month.getFullYear(), month.getMonth(), i + 1, 12); const key = dayKey(date); const amount = totalForDay(sessions, key);
        return <button key={key} className={`calendar-day ${amount > 0 ? 'studied' : ''} ${key === selected ? 'selected-day' : ''} ${key === today ? 'calendar-today' : ''}`} onClick={() => setSelected(key)} aria-label={`${date.toLocaleDateString()}: ${durationText(amount)}`} aria-pressed={key === selected}>{i + 1}{amount > 0 && <span className="activity-dot" />}</button>;
      })}</div><p className="calendar-caption"><span className="activity-dot" /> A little time, well spent.</p></section>
    </div>
    <section className="panel day-detail"><div className="panel-heading"><div><h2>{dateFromKey(selected).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</h2><p className="muted">{durationText(totalForDay(sessions, selected))} studied · {chosenSessions.length} {chosenSessions.length === 1 ? 'block' : 'blocks'}</p></div><label className="date-picker">View day<input aria-label="View study day" type="date" value={selected} onChange={e => { if (e.target.value) selectDay(e.target.value); }} /></label></div><SessionList sessions={chosenSessions} day={selected} rename={rename} remove={remove} /></section>
  </section>;
}
