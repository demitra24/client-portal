export const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';
export const fmtDateLong = (d) => new Date(d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
export const daysUntil = (d) => Math.ceil((new Date(d) - new Date()) / 864e5);
export const money = (n) => (n || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
export const fmtSize = (b) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, (b / 1024) | 0)} KB`);

export const rel = (d) => {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${(s / 60) | 0}m ago`;
  if (s < 86400) return `${(s / 3600) | 0}h ago`;
  if (s < 604800) return `${(s / 86400) | 0}d ago`;
  return fmtDate(d);
};

export const dueLabel = (d) => {
  if (!d) return null;
  const n = daysUntil(d);
  if (n < 0) return { text: `${-n}d overdue`, tone: 'over' };
  if (n === 0) return { text: 'due today', tone: 'soon' };
  if (n <= 2) return { text: `due in ${n}d`, tone: 'soon' };
  return { text: `due ${fmtDate(d)}`, tone: 'ok' };
};