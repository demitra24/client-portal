import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../lib/socket';
import { Icon, Chip, Ring, PROJECT_STATUS, PROJECT_STATUS as PS, ListSkeleton, Empty } from '../components/ui';
import { Board } from '../components/board';
import { FilesPanel, CommentsPanel, ApprovalPanel, ProjectActivity } from '../components/panels';
import { TaskModal, ProjectModal } from '../components/modals';
import { money, fmtDate, daysUntil } from '../lib/format';

const TABS = [
  { id: 'board', label: 'Board' },
  { id: 'files', label: 'Files' },
  { id: 'discussion', label: 'Discussion' },
  { id: 'approval', label: 'Approval' },
  { id: 'activity', label: 'Activity' },
];

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [tab, setTab] = useState('board');
  const [error, setError] = useState('');
  const [taskModal, setTaskModal] = useState(null); // {task} | {status} | null
  const [editOpen, setEditOpen] = useState(false);
  const canManage = user.role !== 'client';

  const load = useCallback(async () => {
    try {
      const [{ data: p }, { data: t }] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get('/tasks', { params: { project: id } }),
      ]);
      setProject(p); setTasks(t); setError('');
    } catch (e) { setError(errMsg(e)); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  /* join this project's live room: board moves & updates stream in instantly */
  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    s.emit('project:join', id);
    const onTask = (t) => {
      if (!t || String(t.project) !== String(id)) return;
      setTasks((ts) => {
        const i = ts.findIndex((x) => x._id === t._id);
        if (i >= 0) { const copy = [...ts]; copy[i] = t; return copy; }
        return [...ts, t];
      });
    };
    const onRefresh = ({ projectId } = {}) => { if (!projectId || String(projectId) === String(id)) load(); };
    s.on('task:update', onTask);
    s.on('project:refresh', onRefresh);
    return () => { s.emit('project:leave', id); s.off('task:update', onTask); s.off('project:refresh', onRefresh); };
  }, [id, load]);

  if (error) return <div className="space-y-4"><Empty>{error}</Empty><Link to="/projects" className="text-sm underline underline-offset-4 hover:text-accent">← Back to projects</Link></div>;
  if (!project) return <ListSkeleton />;

  const done = tasks.filter((t) => t.status === 'done').length;
  const progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const overdueCount = tasks.filter((t) => t.dueDate && t.status !== 'done' && new Date(t.dueDate) < new Date()).length;
  const days = project.deadline ? daysUntil(project.deadline) : null;
  const handleSaved = (t, wasNew) => {
    setTaskModal(null);
    if (t) setTasks((ts) => (wasNew ? (ts.some((x) => x._id === t._id) ? ts : [...ts, t]) : ts.map((x) => (x._id === t._id ? t : x))));
  };

  return (
    <div>
      <Link to="/projects" className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-widest text-mute transition-colors hover:text-accent">
        <Icon name="back" className="h-3 w-3" />All projects
      </Link>

      {/* header */}
      <div className="mt-4 flex flex-wrap items-start justify-between gap-6 border-b border-line pb-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">{project.name}</h1>
            <span className="border border-line bg-cream px-2 py-0.5 font-mono text-[11px] uppercase tracking-widest text-mute">{project.code}</span>
          </div>
          <p className="mt-1.5 max-w-xl text-sm text-mute">{project.client?.company}{project.description ? ` — ${project.description}` : ''}</p>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 font-mono text-[11px] uppercase tracking-widest text-mute">
            {project.deadline && <span>Deadline {fmtDate(project.deadline)} · {days < 0 ? `${-days}d late` : `in ${days}d`}</span>}
            {canManage && <span>Budget {money(project.budget)}</span>}
            <span>{tasks.length} tasks · {done} done</span>
            {overdueCount > 0 && <span className="text-accent">{overdueCount} overdue</span>}
          </div>
        </div>
        <div className="flex items-center gap-5">
          {canManage ? (
            <select value={project.status}
              onChange={async (e) => { const { data } = await api.patch(`/projects/${id}`, { status: e.target.value }); setProject(data); }}
              className="border border-line bg-cream px-2 py-1.5 font-mono text-xs uppercase tracking-widest outline-none transition-colors focus:border-ink">
              {Object.entries(PS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          ) : <Chip map={PROJECT_STATUS} value={project.status} />}
          {user.role === 'admin' && (
            <button onClick={() => setEditOpen(true)} className="p-1.5 text-mute transition-colors hover:text-accent" title="Edit project"><Icon name="file" /></button>
          )}
          <div className="relative grid place-items-center">
            <Ring value={progress} />
            <span className="absolute font-mono text-xs font-semibold">{progress}%</span>
          </div>
        </div>
      </div>

      {/* tabs */}
      <div className="mt-6 flex gap-6 overflow-x-auto border-b border-line">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`-mb-px whitespace-nowrap border-b-2 pb-3 font-mono text-[11px] uppercase tracking-widest transition-colors ${tab === t.id ? 'border-accent text-ink' : 'border-transparent text-mute hover:text-ink'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'board' && <Board tasks={tasks} setTasks={setTasks} projectId={id} canManage={canManage} onOpen={setTaskModal} />}
        {tab === 'files' && <FilesPanel projectId={id} />}
        {tab === 'discussion' && <CommentsPanel projectId={id} />}
        {tab === 'approval' && <ApprovalPanel project={project} onChanged={load} />}
        {tab === 'activity' && <ProjectActivity id={id} />}
      </div>

      <TaskModal state={taskModal} onClose={() => setTaskModal(null)} onSaved={handleSaved} project={project} />
      <ProjectModal open={editOpen} onClose={() => setEditOpen(false)} onSaved={() => { setEditOpen(false); load(); }} onDeleted={() => nav('/projects')} project={project} />
    </div>
  );
}