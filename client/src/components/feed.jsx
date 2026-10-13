import { Empty, ACT_TYPE } from './ui';
import { rel } from '../lib/format';

export function ActivityFeed({ items, empty = 'No activity yet — it will appear here as work happens.' }) {
  if (!items?.length) return <Empty>{empty}</Empty>;
  return (
    <ul className="divide-y divide-line">
      {items.map((a) => (
        <li key={a._id} className="flex gap-3 py-3">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: ACT_TYPE[a.type] || '#8A8574' }} />
          <div className="min-w-0 flex-1">
            <p className="text-sm leading-snug"><span className="font-medium">{a.actor?.name || 'System'}</span> {a.message}</p>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-mute">{rel(a.createdAt)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}