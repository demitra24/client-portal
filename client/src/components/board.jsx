import { useState } from 'react';
import { api } from '../api';
import { Icon, Avatar, TASK_COLUMNS, PRIORITY } from './ui';
import { dueLabel } from '../lib/format';

function TaskCard({ t, canManage, dragging, onDragStart, onDragEnd, onOpen }) {
  const due = dueLabel(t.dueDate);
  const pr = PRIORITY[t.priority] || PRIORITY.medium;
  return (
    <div draggable={canManage}
      onDragStart={(e) => { e.dataTransfer.setData('text/plain', t._id); e.dataTransfer.effectAllowed = 'move'; onDragStart(); }}
      onDragEnd={onDragEnd}
      onClick={() => canManage && onOpen()}
      className={`select-none border bg-white p-3 transition-all hover:border-ink hover:shadow-[3px_3px_0_#16140F] ${dragging ? 'rotate-1 opacity-30' : ''} ${canManage ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug">{t.title}</p>
        <Icon name="flag" className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${pr.cls}`} />
      </div>
      {t.description && <p className="mt-1 line-clamp-2 text-xs text-mute">{t.description}</p>}
      <div className="mt-2.5 flex items-center justify-between">
        {t.assignee ? (
          <div className="flex items-center gap-1.5">
            <Avatar name={t.assignee.name} size="h-5 w-5 text-[8px]" />
            <span className="text-[11px] text-mute">{t.assignee.name.split(' ')[0]}</span>
          </div>
        ) : <span className="font-mono text-[10px] uppercase text-mute/70">Unassigned</span>}
        {due && <span className={`font-mono text-[10px] uppercase tracking-wide ${due.tone === 'over' ? 'text-accent' : due.tone === 'soon' ? 'text-amber' : 'text-mute'}`}>{due.text}</span>}
      </div>
    </div>
  );
}

export function Board({ tasks, setTasks, projectId, canManage, onOpen }) {
  const [dragId, setDragId] = useState(null);
  const [overCol, setOverCol] = useState(null);

  const move = async (taskId, status) => {
    const t = tasks.find((x) => x._id === taskId);
    if (!t || t.status === status) return;
    setTasks((ts) => ts.map((x) => (x._id === taskId ? { ...x, status } : x))); // optimistic
    try { await api.patch(`/tasks/${taskId}`, { status }); }
    catch { const { data } = await api.get('/tasks', { params: { project: projectId } }); setTasks(data); }
  };

  return (
    <div className="grid gap-3 md:grid-cols-4">
      {TASK_COLUMNS.map((col) => {
        const items = tasks.filter((t) => t.status === col.id);
        return (
          <div key={col.id}
            onDragOver={(e) => { if (!canManage) return; e.preventDefault(); setOverCol(col.id); }}
            onDragLeave={() => setOverCol((c) => (c === col.id ? null : c))}
            onDrop={(e) => { e.preventDefault(); setOverCol(null); const tid = e.dataTransfer.getData('text/plain'); if (tid) move(tid, col.id); }}
            className={`flex min-h-[60vh] flex-col border bg-cream/50 transition-colors ${overCol === col.id ? 'border-accent bg-cream' : 'border-line'}`}>
            <header className="flex items-center justify-between border-b border-line px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: col.dot }} />
                <span className="font-mono text-[11px] uppercase tracking-widest">{col.label}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-mono text-[11px] text-mute">{items.length}</span>
                {canManage && (
                  <button onClick={() => onOpen({ status: col.id })} className="p-1 text-mute transition-colors hover:text-accent">
                    <Icon name="plus" className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </header>
            <div className="flex-1 space-y-2 p-2">
              {items.map((t) => (
                <TaskCard key={t._id} t={t} canManage={canManage} dragging={dragId === t._id}
                  onDragStart={() => setDragId(t._id)}
                  onDragEnd={() => { setDragId(null); setOverCol(null); }}
                  onOpen={() => onOpen({ task: t })} />
              ))}
              {!items.length && <p className="py-6 text-center font-mono text-[10px] uppercase tracking-widest text-mute/70">Empty</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}