import { Link } from 'react-router-dom';
import { Chip, PROJECT_STATUS, Empty } from './ui';
import { fmtDate, daysUntil } from '../lib/format';

const Deadline = ({ p }) => {
  if (!p.deadline) return <span className="text-mute">—</span>;
  const days = daysUntil(p.deadline);
  const cls = p.status !== 'completed' && days < 0 ? 'text-accent' : days <= 3 ? 'text-amber' : 'text-ink/70';
  return <span className={cls}>{fmtDate(p.deadline)}</span>;
};

export function ProjectLedger({ projects }) {
  if (!projects.length) return <Empty>No projects yet{projects.length === 0 && projects ? '' : ''}. They will appear here as soon as work starts.</Empty>;
  return (
    <div className="border-t border-line">
      <div className="hidden grid-cols-[2.5rem_1fr_10rem_8rem_10rem_7rem] gap-4 border-b border-line px-2 py-2.5 font-mono text-[10px] uppercase tracking-widest text-mute lg:grid">
        <span>No</span><span>Project</span><span>Client</span><span>Status</span><span>Progress</span><span className="text-right">Deadline</span>
      </div>
      {projects.map((p, i) => (
        <Link key={p._id} to={`/projects/${p._id}`}
          className="group grid grid-cols-[2.5rem_1fr_auto] items-center gap-4 border-b border-line px-2 py-4 transition-colors hover:bg-cream lg:grid-cols-[2.5rem_1fr_10rem_8rem_10rem_7rem]">
          <span className="font-mono text-xs text-mute">{String(i + 1).padStart(2, '0')}</span>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-medium leading-tight transition-colors group-hover:text-accent">{p.name}</p>
            <p className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-widest text-mute lg:hidden">
              {p.code} · {p.client?.company} · {PROJECT_STATUS[p.status]?.label}
            </p>
            <p className="mt-0.5 hidden font-mono text-[10px] uppercase tracking-widest text-mute lg:block">{p.code}</p>
          </div>
          <span className="hidden truncate text-sm text-ink/70 lg:block">{p.client?.company}</span>
          <span className="hidden lg:block"><Chip map={PROJECT_STATUS} value={p.status} /></span>
          <div className="hidden items-center gap-2.5 lg:flex">
            <div className="h-[3px] w-full max-w-[64px] bg-line"><div className="h-full bg-ink transition-all" style={{ width: `${p.progress}%` }} /></div>
            <span className="w-8 font-mono text-[11px] text-mute">{p.progress}%</span>
          </div>
          <div className="flex items-center justify-end font-mono text-xs"><Deadline p={p} /></div>
        </Link>
      ))}
    </div>
  );
}