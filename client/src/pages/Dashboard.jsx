import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import { useLiveRefresh } from '../lib/hooks';
import { Icon, Btn, SectionTitle } from '../components/ui';
import { ProjectLedger } from '../components/ledger';
import { ActivityFeed } from '../components/feed';
import { fmtDateLong, daysUntil, dueLabel } from '../lib/format';

const roleTitle = (r) => (r === 'admin' ? 'Studio overview' : r === 'member' ? 'Your workbench' : 'Your projects');

const Skeleton = () => (
  <div className="animate-pulse space-y-8">
    <div className="h-9 w-56 bg-line/60" />
    <div className="grid grid-cols-2 gap-px border border-line bg-line lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => <div key={i} className="h-24 bg-white p-5"><div className="h-2.5 w-16 bg-line" /><div className="mt-4 h-7 w-10 bg-line" /></div>)}
    </div>
    <div className="grid gap-10 lg:grid-cols-3"><div className="h-64 bg-line/40 lg:col-span-2" /><div className="h-64 bg-line/40" /></div>
  </div>
);

function TaskRow({ t, onToggle }) {
  const due = dueLabel(t.dueDate);
  const done = t.status === 'done';
  return (
    <div className={`flex items-center gap-3 border-b border-line py-3 ${done ? 'opacity-55' : ''}`}>
      <button onClick={() => onToggle(t)}
        title={done ? 'Undo — put back to In progress' : 'Mark done'}
        className={`grid h-4 w-4 shrink-0 place-items-center border transition-colors ${done ? 'border-moss bg-moss text-white' : 'border-ink/40 hover:bg-ink'}`}>
        {done && <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5l5 5L20 6.5" /></svg>}
      </button>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-medium ${done ? 'line-through decoration-line' : ''}`}>{t.title}</p>
        <p className="font-mono text-[10px] uppercase tracking-widest text-mute">{t.project?.code} — {t.project?.name}</p>
      </div>
      {due && !done && <span className={`hidden font-mono text-[10px] uppercase sm:block ${due.tone === 'over' ? 'text-accent' : due.tone === 'soon' ? 'text-amber' : 'text-mute'}`}>{due.text}</span>}
      {done
        ? <span className="font-mono text-[10px] uppercase tracking-widest text-moss">done</span>
        : <Icon name="flag" className={`h-3.5 w-3.5 shrink-0 ${t.priority === 'high' ? 'text-accent' : t.priority === 'low' ? 'text-mute' : 'text-ink'}`} />}
    </div>
  );
}

function DeadlineRow({ p }) {
  const dt = new Date(p.deadline);
  const days = daysUntil(p.deadline);
  return (
    <Link to={`/projects/${p._id}`} className="flex items-center gap-3 border border-line bg-white p-3 transition-colors hover:border-ink">
      <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center border border-line bg-cream">
        <span className="font-mono text-[9px] uppercase leading-none text-mute">{dt.toLocaleDateString('en-US', { month: 'short' })}</span>
        <span className="mt-0.5 font-mono text-sm font-semibold leading-none">{dt.getDate()}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{p.name}</p>
        <p className="font-mono text-[10px] uppercase tracking-widest text-mute">{p.client?.company}</p>
      </div>
      <span className={`font-mono text-[10px] uppercase ${days < 0 ? 'text-accent' : days <= 3 ? 'text-amber' : 'text-mute'}`}>{days < 0 ? `${-days}d late` : `in ${days}d`}</span>
    </Link>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [opErr, setOpErr] = useState('');
  const load = useCallback(() => api.get('/dashboard/stats').then(({ data }) => setData(data)).catch(() => setData({ stats: null })), []);
  useEffect(() => { load(); }, [load]);
  useLiveRefresh(load);

  // two-way toggle: done ⇄ in-progress (mistake-proof)
  const toggleDone = async (t) => {
    try { await api.patch(`/tasks/${t._id}`, { status: t.status === 'done' ? 'in-progress' : 'done' }); load(); }
    catch { load(); }
  };
  const approve = async (projectId, approvalId) => {
    setOpErr('');
    try { await api.patch(`/projects/${projectId}/approvals/${approvalId}`, { decision: 'approved' }); load(); }
    catch (e) { setOpErr(errMsg(e)); }
  };

  if (!data) return <Skeleton />;
  if (!data.stats) return <div className="border-l-2 border-accent bg-white p-4 text-sm">Could not load the dashboard — is the API running?</div>;

  const { stats } = data;
  const h = new Date().getHours();
  const greet = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  const cells = [
    { label: 'Active projects', value: stats.activeProjects, sub: `of ${stats.projects} total` },
    user.role === 'admin'
      ? { label: 'Clients', value: stats.clients, sub: 'on the roster' }
      : { label: 'Open tasks', value: stats.openTasks, sub: stats.overdue ? `${stats.overdue} overdue` : 'on schedule' },
    { label: 'Due this week', value: stats.dueWeek, sub: 'deadlines in the next 7 days' },
    user.role === 'client'
      ? { label: 'Pending sign-offs', value: stats.pendingApprovals, sub: stats.pendingApprovals ? 'action needed' : 'all clear', accent: stats.pendingApprovals > 0 }
      : { label: 'Completion rate', value: `${stats.completion}%`, sub: 'across all tasks' },
  ];

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-mute">{greet}, {user.name.split(' ')[0]}</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tighter">{roleTitle(user.role)}<span className="text-accent">.</span></h1>
        </div>
        <p className="font-mono text-[11px] uppercase tracking-widest text-mute">{fmtDateLong(new Date())}</p>
      </header>

      <section className="grid grid-cols-2 gap-px border border-line bg-line lg:grid-cols-4">
        {cells.map((c) => (
          <div key={c.label} className="bg-white p-5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-mute">{c.label}</p>
            <p className={`mt-2 text-4xl font-semibold tracking-tighter ${c.accent ? 'text-accent' : ''}`}>{c.value}</p>
            {c.sub && <p className="mt-1 text-xs text-mute">{c.sub}</p>}
          </div>
        ))}
      </section>

      {opErr && <p className="border-l-2 border-accent pl-3 text-sm text-accent">{opErr}</p>}

      <div className="grid gap-10 lg:grid-cols-3">
        <div className="space-y-10 lg:col-span-2">
          {data.myTasks?.length > 0 && (
            <section>
              <SectionTitle label="My open tasks" count={data.myTasks.length} />
              <div className="border-t border-line">
                {data.myTasks.map((t) => <TaskRow key={t._id} t={t} onToggle={toggleDone} />)}
              </div>
            </section>
          )}
          {data.myDoneTasks?.length > 0 && (
            <section>
              <SectionTitle label="Recently completed" count={data.myDoneTasks.length} />
              <div className="border-t border-line">
                {data.myDoneTasks.map((t) => <TaskRow key={t._id} t={t} onToggle={toggleDone} />)}
              </div>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-mute">Click the ✓ to undo a mistaken completion</p>
            </section>
          )}
          <section>
            <SectionTitle label={user.role === 'client' ? 'Your projects' : 'Projects'} count={data.projects.length} />
            <ProjectLedger projects={data.projects} />
          </section>
        </div>

        <div className="space-y-10">
          {data.approvalsPending?.length > 0 && (
            <section>
              <SectionTitle label="Needs your sign-off" />
              <div className="space-y-3">
                {data.approvalsPending.map((x) => (
                  <div key={x.approval._id} className="border border-accent bg-white p-4">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-accent">Awaiting sign-off</p>
                    <p className="mt-1.5 font-medium">{x.approval.title}</p>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-mute">{x.project.code} — {x.project.name}</p>
                    <div className="mt-3 flex gap-2">
                      <Btn variant="moss" onClick={() => approve(x.project._id, x.approval._id)}><Icon name="check" className="h-3.5 w-3.5" />Approve</Btn>
                      <Link to={`/projects/${x.project._id}`} className="px-3 py-2 text-sm underline decoration-line underline-offset-4 hover:decoration-accent">Review first</Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
          {user.role !== 'client' && data.deadlines.length > 0 && (
            <section>
              <SectionTitle label="Upcoming deadlines" />
              <div className="space-y-2">{data.deadlines.map((p) => <DeadlineRow key={p._id} p={p} />)}</div>
            </section>
          )}
          <section>
            <SectionTitle label="Live activity" />
            <div className="border border-line bg-white px-4 py-1"><ActivityFeed items={data.activity} /></div>
          </section>
        </div>
      </div>
    </div>
  );
}