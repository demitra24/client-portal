export const PROJECT_STATUS = {
  planning: { label: 'Planning', dot: '#8A8574' },
  active: { label: 'Active', dot: '#177B3F' },
  review: { label: 'In review', dot: '#FF4D00' },
  completed: { label: 'Completed', dot: '#16140F' },
};
export const TASK_COLUMNS = [
  { id: 'todo', label: 'To do', dot: '#8A8574' },
  { id: 'in-progress', label: 'In progress', dot: '#FF4D00' },
  { id: 'review', label: 'In review', dot: '#C4620A' },
  { id: 'done', label: 'Done', dot: '#177B3F' },
];
export const TASK_STATUS = Object.fromEntries(TASK_COLUMNS.map((c) => [c.id, { label: c.label, dot: c.dot }]));
export const PRIORITY = {
  low: { label: 'Low', cls: 'text-mute' },
  medium: { label: 'Medium', cls: 'text-ink' },
  high: { label: 'High', cls: 'text-accent' },
};
export const ACT_TYPE = { project: '#16140F', task: '#FF4D00', comment: '#177B3F', file: '#C4620A', approval: '#FF4D00', user: '#8A8574' };

/* ---------------------------------- icons --------------------------------- */
const PATHS = {
  grid: <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></>,
  folder: <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.2 3.4-5 6.5-5s5.7 1.8 6.5 5" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" /><path d="M17.5 15.4c2 .6 3.5 2.1 4 4.6" /></>,
  briefcase: <><rect x="3" y="7" width="18" height="13" rx="1" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 12h18" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  check: <path d="M4 12.5l5 5L20 6.5" />,
  download: <><path d="M12 3v12m0 0l-4.5-4.5M12 15l4.5-4.5" /><path d="M4 19h16" /></>,
  upload: <><path d="M12 15V3m0 0L7.5 7.5M12 3l4.5 4.5" /><path d="M4 19h16" /></>,
  logout: <><path d="M9 4H5v16h4" /><path d="M14 8l4 4-4 4M18 12H9" /></>,
  send: <path d="M21 3L10 14M21 3l-7 18-4-7-7-4z" />,
  trash: <><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></>,
  back: <path d="M15 5l-7 7 7 7" />,
  flag: <path d="M5 21V4c4-2 8 2 12 0v11c-4 2-8-2-12 0" />,
  file: <><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4" /></>,
};
export const Icon = ({ name, className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>{PATHS[name]}</svg>
);

/* --------------------------------- controls -------------------------------- */
const BTN = {
  solid: 'bg-ink text-cream hover:bg-accent',
  accent: 'bg-accent text-white hover:bg-ink',
  moss: 'bg-moss text-white hover:bg-ink',
  ghost: 'border border-line bg-cream hover:border-ink',
  warn: 'border border-accent text-accent hover:bg-accent hover:text-white',
};
export const Btn = ({ variant = 'solid', className = '', ...p }) => (
  <button className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${BTN[variant]} ${className}`} {...p} />
);

export const Label = ({ children }) => <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-widest text-mute">{children}</label>;
export const inputCls = 'w-full border border-line bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-ink';
export const Field = ({ label, children }) => <div><Label>{label}</Label>{children}</div>;

/* ---------------------------------- modal ---------------------------------- */
export function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 md:p-10"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`rise w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} border border-line bg-cream shadow-2xl`}>
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h3 className="font-semibold tracking-tight">{title}</h3>
          <button onClick={onClose} className="text-mute transition-colors hover:text-accent"><Icon name="x" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------- small parts ------------------------------- */
export function Chip({ map, value }) {
  const m = map[value] || { label: value, dot: '#8A8574' };
  return (
    <span className="inline-flex items-center gap-1.5 border border-line bg-cream px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: m.dot }} />{m.label}
    </span>
  );
}

const AV_COLORS = ['#16140F', '#FF4D00', '#177B3F', '#C4620A', '#4C4A96', '#7A5C3E'];
export const Avatar = ({ name = '', size = 'h-8 w-8 text-[11px]' }) => {
  const initials = name.split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  const c = AV_COLORS[(name.charCodeAt(0) + name.length) % AV_COLORS.length];
  return <div className={`${size} flex shrink-0 items-center justify-center rounded-full font-mono font-medium`} style={{ background: c, color: '#FBF9F3' }}>{initials}</div>;
};

export function Ring({ value, size = 76, stroke = 6 }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E2DECF" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={value === 100 ? '#16140F' : '#FF4D00'} strokeWidth={stroke}
        strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} style={{ transition: 'stroke-dashoffset .6s ease' }} />
    </svg>
  );
}

export const Empty = ({ children }) => (
  <div className="border border-dashed border-line bg-cream/50 px-6 py-10 text-center"><p className="text-sm text-mute">{children}</p></div>
);
export const Spinner = ({ className = 'h-4 w-4' }) => <div className={`${className} animate-spin rounded-full border-2 border-ink/20 border-t-ink`} />;

export function PageHeader({ title, meta, children }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        {meta && <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-mute">{meta}</p>}
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

export const SectionTitle = ({ label, count }) => (
  <div className="mb-3 flex items-baseline justify-between">
    <h2 className="font-mono text-[11px] uppercase tracking-[0.25em]">{label}</h2>
    {count !== undefined && <span className="font-mono text-[11px] text-mute">{String(count).padStart(2, '0')}</span>}
  </div>
);

export const ListSkeleton = () => (
  <div className="animate-pulse space-y-3 pt-2">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-line/40" />)}</div>
);