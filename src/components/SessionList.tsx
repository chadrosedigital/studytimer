import { BookOpen, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { durationText, type Session } from '../lib/time';
interface Props { sessions: Session[]; day: string; rename: (s: Session, name: string) => void; remove: (s: Session) => void; }
export default function SessionList({ sessions, day, rename, remove }: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState('');
  if (!sessions.length) return <div className="empty-state"><BookOpen size={26} aria-hidden="true" /><p>A little focus goes a long way.</p><span>Your completed blocks will appear here.</span></div>;
  return <ul className="session-list">{sessions.map(s => <li key={s.id}>
    <div className="session-dot" aria-hidden="true" />
    <div className="session-content">
      {editing === s.id ? <form onSubmit={e => { e.preventDefault(); rename(s, name.trim() || s.name); setEditing(null); }}>
        <label className="sr-only" htmlFor={`edit-${s.id}`}>Block name</label>
        <input id={`edit-${s.id}`} autoFocus maxLength={100} value={name} onChange={e => setName(e.target.value)} onKeyDown={e => { if (e.key === 'Escape') setEditing(null); }} />
        <div className="edit-actions"><button type="submit">Save</button><button type="button" onClick={() => setEditing(null)}>Cancel</button></div>
      </form> : <button className="session-name" onClick={() => { setEditing(s.id); setName(s.name); }} title="Rename block">{s.name}<Pencil size={12} aria-hidden="true" /></button>}
      <p>{durationText(s.days[day] || s.durationMs)} <span>·</span> {s.mode === 'countdown' ? 'Countdown' : 'Stopwatch'}</p>
      <time className="session-time" dateTime={s.startedAt}>{new Date(s.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(s.endedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
    </div>
    <button className="icon-button delete-button" aria-label={`Delete ${s.name}`} onClick={() => remove(s)}><Trash2 size={15} aria-hidden="true" /></button>
  </li>)}</ul>;
}
