import { useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../lib/socket';
import { Icon, Avatar, ACT_TYPE } from './ui';
import { rel } from '../lib/format';

const NAV = [
  { to: '/', label: 'Overview', icon: 'grid', end: true },
  { to: '/projects', label: 'Projects', icon: 'folder' },
  { to: '/clients', label: 'Clients', icon: 'briefcase', admin: true },
  { to: '/team', label: 'Team', icon: 'users', admin: true },
];

const Brand = () => (
  <Link to="/" className="flex items-center gap-2.5">
    <span className="h-3 w-3 bg-accent" />
    <span className="text-lg font-bold tracking-tight">Portal</span>
    <span className="mt-1 font-mono text-[10px] text-cream/40">v1.0</span>
  </Link>
);

export function Sidebar() {
  const { user, logout } = useAuth();
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    setConnected(s.connected);
    const on = () => setConnected(true), off = () => setConnected(false);
    s.on('connect', on); s.on('disconnect', off);
    return () => { s.off('connect', on); s.off('disconnect', off); };
  }, []);
  const items = NAV.filter((n) => !n.admin || user.role === 'admin');

  return (<>
    {/* mobile top bar */}
    <div className="sticky top-0 z-30 flex items-center justify-between bg-ink px-4 py-3 text-cream md:hidden">
      <Brand />
      <nav className="flex gap-5">
        {items.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => (isActive ? 'text-accent' : 'text-cream/50')}>
            <Icon name={n.icon} className="h-5 w-5" />
          </NavLink>
        ))}
      </nav>
    </div>

    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-ink text-cream md:flex">
      <div className="border-b border-cream/10 px-6 py-6"><Brand /></div>
      <nav className="flex-1 space-y-1 px-3 py-6">
        {items.map((n, i) => (
          <NavLink key={n.to} to={n.to} end={n.end}
            className={({ isActive }) => `relative flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${isActive ? 'text-cream' : 'text-cream/45 hover:text-cream'}`}>
            {({ isActive }) => (<>
              {isActive && <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 bg-accent" />}
              <span className="w-4 font-mono text-[10px] text-cream/35">0{i + 1}</span>
              <Icon name={n.icon} />
              <span>{n.label}</span>
            </>)}
          </NavLink>
        ))}
      </nav>
      <div className="space-y-4 border-t border-cream/10 px-6 py-4">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-cream/50">
          <span className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-moss live-dot' : 'bg-cream/30'}`} />
          {connected ? 'Live · connected' : 'Connecting…'}
        </div>
        <div className="flex items-center gap-3">
          <Avatar name={user.name} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-cream/45">{user.role}</p>
          </div>
          <button onClick={logout} title="Sign out" className="ml-auto text-cream/50 transition-colors hover:text-accent"><Icon name="logout" /></button>
        </div>
      </div>
    </aside>
  </>);
}

/* real-time toasts: every action by teammates/clients pops in here */
export function LiveLayer() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    const onAct = (a) => {
      if (!a || String(a.actor?._id) === String(user._id)) return;
      const key = a._id || Math.random();
      setItems((t) => [...t.slice(-2), { ...a, key }]);
      setTimeout(() => setItems((t) => t.filter((x) => x.key !== key)), 4600);
    };
    s.on('activity:new', onAct);
    return () => s.off('activity:new', onAct);
  }, [user]);
  return (
    <div className="fixed bottom-5 left-5 z-50 max-w-sm space-y-2">
      {items.map((a) => (
        <div key={a.key} className="rise flex items-start gap-3 bg-ink px-4 py-3 text-cream shadow-[4px_4px_0_rgba(22,20,15,0.15)]">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: ACT_TYPE[a.type] || '#fff' }} />
          <div>
            <p className="text-sm leading-snug"><span className="font-medium">{a.actor?.name || 'Someone'}</span> {a.message}</p>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-cream/40">{rel(a.createdAt)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}