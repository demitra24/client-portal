import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../api';
import { Icon, Spinner, inputCls, Label } from '../components/ui';

const SHOW_DEMO = import.meta.env.VITE_DEMO_MODE !== 'false'; // on unless explicitly disabled

const DEMO = [
  { label: 'Admin', email: 'admin@portal.io', password: 'admin123' },
  { label: 'Team member', email: 'daniel@portal.io', password: 'member123' },
  { label: 'Client', email: 'clara@halstead.io', password: 'client123' },
];

export default function Login() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (user) nav('/', { replace: true }); }, [user, nav]);

  const doLogin = async (em, pw) => {
    setBusy(true); setErr('');
    try { await login(em, pw); } catch (e) { setErr(errMsg(e)); setBusy(false); }
  };
  const submit = (e) => { e.preventDefault(); if (email && password) doLogin(email.trim(), password); };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* brand panel */}
      <div className="blueprint relative hidden flex-col justify-between bg-ink p-12 text-cream lg:flex">
        <div className="flex items-center gap-2.5"><span className="h-3 w-3 bg-accent" /><span className="text-lg font-bold tracking-tight">Portal</span></div>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-cream/40">Client project management</p>
          <h1 className="mt-5 max-w-md text-5xl font-semibold leading-[1.05] tracking-tighter">
            Client work, without the chaos<span className="text-accent">.</span>
            <span className="blink ml-2 inline-block h-10 w-4 translate-y-1 bg-accent" />
          </h1>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-cream/55">
            One workspace for projects, tasks, deadlines and deliverables — with your clients in the loop, always.
          </p>
        </div>
        <ul className="space-y-2 font-mono text-[11px] uppercase tracking-widest text-cream/40">
          <li>01 — Role-based dashboards</li>
          <li>02 — Real-time status tracking</li>
          <li>03 — Files, comments &amp; approvals</li>
        </ul>
      </div>

      {/* form panel */}
      <div className="flex items-center justify-center bg-paper p-6">
        <div className="w-full max-w-sm">
          <div className="mb-10 flex items-center gap-2.5 lg:hidden"><span className="h-3 w-3 bg-accent" /><span className="text-lg font-bold tracking-tight">Portal</span></div>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-mute">Sign in</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">Welcome back</h2>
          <form onSubmit={submit} className="mt-8 space-y-4">
            <div><Label>Email</Label><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@studio.io" className={inputCls} /></div>
            <div><Label>Password</Label><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={inputCls} /></div>
            {err && <p className="border-l-2 border-accent pl-3 text-sm text-accent">{err}</p>}
            <button type="submit" disabled={busy}
              className="mt-2 flex w-full items-center justify-center gap-2 bg-ink py-3 text-sm font-medium text-cream transition-colors hover:bg-accent disabled:opacity-50">
              {busy ? <Spinner className="h-4 w-4 border-cream/30 border-t-cream" /> : <>Sign in <Icon name="back" className="h-3.5 w-3.5 rotate-180" /></>}
            </button>
          </form>
          {SHOW_DEMO && (
            <div className="mt-10 border-t border-line pt-6">
              <p className="font-mono text-[10px] uppercase tracking-widest text-mute">Demo accounts — one click</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {DEMO.map((d) => (
                  <button key={d.label} disabled={busy} onClick={() => doLogin(d.email, d.password)}
                    className="border border-line bg-cream px-2 py-2 text-xs font-medium transition-colors hover:border-ink disabled:opacity-50">
                    {d.label}
                  </button>
                ))}
              </div>
              <p className="mt-3 font-mono text-[10px] leading-relaxed text-mute">
                Demo environment — data may be reset at any time.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}