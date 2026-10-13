import { useCallback, useEffect, useRef, useState } from 'react';
import { api, errMsg, API_BASE } from '../api';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../lib/socket';
import { Icon, Avatar, Btn, Empty, inputCls, Label } from './ui';
import { ActivityFeed } from './feed';
import { rel, fmtSize, fmtDateLong } from '../lib/format';

/* live-refresh whenever anything in this project changes */
const useProjectRefresh = (load) => {
  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    const h = () => load();
    s.on('project:refresh', h);
    return () => s.off('project:refresh', h);
  }, [load]);
};

/* --------------------------------- files --------------------------------- */
export function FilesPanel({ projectId }) {
  const { user } = useAuth();
  const [files, setFiles] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const inputRef = useRef();
  const load = useCallback(() => api.get(`/projects/${projectId}/files`).then(({ data }) => setFiles(data)).catch((e) => setErr(errMsg(e))), [projectId]);
  useEffect(() => { load(); }, [load]);
  useProjectRefresh(load);

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true); setErr('');
    const fd = new FormData();
    fd.append('file', file);
    try { await api.post(`/projects/${projectId}/files`, fd); load(); }
    catch (ex) { setErr(errMsg(ex)); }
    finally { setBusy(false); e.target.value = ''; }
  };
  const remove = async (f) => {
    try { await api.delete(`/projects/${projectId}/files/${f._id}`); load(); }
    catch (ex) { setErr(errMsg(ex)); }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-widest text-mute">{files ? `${files.length} file${files.length === 1 ? '' : 's'} shared` : 'Loading…'}</p>
        <Btn onClick={() => inputRef.current?.click()} disabled={busy}>
          <Icon name="upload" className="h-3.5 w-3.5" />{busy ? 'Uploading…' : 'Upload file'}
        </Btn>
        <input ref={inputRef} type="file" className="hidden" onChange={upload} />
      </div>
      {err && <p className="mb-4 border-l-2 border-accent pl-3 text-sm text-accent">{err}</p>}
      {!files ? null : files.length === 0 ? (
        <Empty>Nothing shared yet. Deliverables, briefs and assets will live here.</Empty>
      ) : (
        <ul className="divide-y divide-line border-t border-line">
          {files.map((f) => (
            <li key={f._id} className="flex items-center gap-4 py-3">
              {f.mime?.startsWith('image/') ? (
                <img src={`${API_BASE}${f.url}`} alt="" className="h-10 w-10 shrink-0 border border-line object-cover" />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-line text-mute"><Icon name="file" /></div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{f.originalName}</p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-mute">
                  {(f.originalName.split('.').pop() || '').toUpperCase()} · {fmtSize(f.size)} · {f.uploader?.name} · {rel(f.createdAt)}
                </p>
              </div>
              <a href={`${API_BASE}/api/projects/${projectId}/files/${f._id}/download?token=${localStorage.getItem('portal_token')}`}
                title="Download" className="p-1.5 text-mute transition-colors hover:text-moss"><Icon name="download" /></a>
              {(user.role !== 'client' || String(f.uploader?._id) === String(user._id)) && (
                <button onClick={() => remove(f)} title="Remove" className="p-1.5 text-mute transition-colors hover:text-accent"><Icon name="trash" /></button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* -------------------------------- discussion ------------------------------- */
export function CommentsPanel({ projectId }) {
  const [items, setItems] = useState(null);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => api.get(`/projects/${projectId}/comments`).then(({ data }) => setItems(data)).catch(() => setItems([])), [projectId]);
  useEffect(() => { load(); }, [load]);
  useProjectRefresh(load);

  const submit = async (e) => {
    e?.preventDefault();
    if (!body.trim() || busy) return;
    setBusy(true);
    try { await api.post(`/projects/${projectId}/comments`, { body }); setBody(''); load(); }
    finally { setBusy(false); }
  };

  return (
    <div className="max-w-2xl">
      <ul className="divide-y divide-line border-t border-line">
        {(items || []).map((c) => (
          <li key={c._id} className="flex gap-3 py-4">
            <Avatar name={c.author?.name} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-sm font-medium">{c.author?.name}</span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-mute">{c.author?.role}</span>
                <span className="ml-auto font-mono text-[10px] uppercase tracking-widest text-mute">{rel(c.createdAt)}</span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{c.body}</p>
            </div>
          </li>
        ))}
        {items && !items.length && <li className="py-8 text-center text-sm text-mute">No messages yet — start the conversation below.</li>}
      </ul>
      <form onSubmit={submit} className="mt-6">
        <textarea rows={2} value={body} onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
          placeholder="Share an update, question or feedback…"
          className={`${inputCls} resize-y`} />
        <div className="mt-2 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest text-mute">Enter to post · Shift+Enter for a new line</span>
          <Btn type="submit" disabled={busy || !body.trim()}><Icon name="send" className="h-3.5 w-3.5" />Post</Btn>
        </div>
      </form>
    </div>
  );
}

/* -------------------------------- approvals -------------------------------- */
export function ApprovalPanel({ project, onChanged }) {
  const { user } = useAuth();
  const isClient = user.role === 'client';
  const pending = project.approvals?.find((a) => a.status === 'pending');
  const history = [...(project.approvals || [])].sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
  const [title, setTitle] = useState('Delivery sign-off');
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const request = async () => {
    setBusy(true); setErr('');
    try { await api.post(`/projects/${project._id}/approvals`, { title }); setFeedback(''); onChanged(); }
    catch (e) { setErr(errMsg(e)); } finally { setBusy(false); }
  };
  const decide = async (decision) => {
    setBusy(true); setErr('');
    try { await api.patch(`/projects/${project._id}/approvals/${pending._id}`, { decision, feedback }); onChanged(); }
    catch (e) { setErr(errMsg(e)); } finally { setBusy(false); }
  };

  const badge = { approved: { t: 'Approved', c: 'text-moss border-moss' }, changes: { t: 'Changes requested', c: 'text-accent border-accent' }, pending: { t: 'Pending', c: 'text-mute border-line' } };

  return (
    <div className="max-w-2xl space-y-8">
      {err && <p className="border-l-2 border-accent pl-3 text-sm text-accent">{err}</p>}

      {pending ? (
        <div className="border border-accent bg-white p-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent">Awaiting sign-off</p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight">{pending.title}</h3>
          <p className="mt-1 text-sm text-mute">Requested by {pending.requestedBy?.name || 'the team'} · {fmtDateLong(pending.requestedAt)}</p>
          {isClient ? (<>
            <textarea rows={2} value={feedback} onChange={(e) => setFeedback(e.target.value)}
              placeholder="Optional feedback — what works, what to change…" className={`${inputCls} mt-4 resize-y`} />
            <div className="mt-3 flex gap-2">
              <Btn variant="moss" disabled={busy} onClick={() => decide('approved')}><Icon name="check" className="h-3.5 w-3.5" />Approve</Btn>
              <Btn variant="warn" disabled={busy} onClick={() => decide('changes')}>Request changes</Btn>
            </div>
          </>) : (
            <p className="mt-4 font-mono text-xs uppercase tracking-widest text-mute">Waiting on {project.client?.company}</p>
          )}
        </div>
      ) : !isClient ? (
        <div className="border border-line bg-white p-6">
          <Label>Request client approval</Label>
          <div className="flex gap-2">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="e.g. Design sign-off, Beta delivery" />
            <Btn onClick={request} disabled={busy}><Icon name="check" className="h-3.5 w-3.5" />Send for approval</Btn>
          </div>
        </div>
      ) : (
        <Empty>Nothing awaiting your sign-off right now — the team will send deliverables here for approval.</Empty>
      )}

      {history.length > 0 && (
        <div>
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.25em]">History</p>
          <ul className="divide-y divide-line border-t border-line">
            {history.map((a) => (
              <li key={a._id} className="py-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${badge[a.status].c}`}>{badge[a.status].t}</span>
                  <span className="text-sm font-medium">{a.title}</span>
                  <span className="ml-auto font-mono text-[10px] uppercase tracking-widest text-mute">{fmtDateLong(a.requestedAt)}</span>
                </div>
                {a.feedback && <p className="mt-2 border-l-2 border-line pl-3 text-sm italic text-mute">“{a.feedback}” — {a.decidedBy?.name || 'client'}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ----------------------------- project activity ---------------------------- */
export function ProjectActivity({ id }) {
  const [items, setItems] = useState(null);
  useEffect(() => {
    api.get('/dashboard/activity', { params: { project: id, limit: 50 } })
      .then(({ data }) => setItems(data)).catch(() => setItems([]));
  }, [id]);
  return <div className="max-w-2xl border border-line bg-white px-4 py-1"><ActivityFeed items={items || []} /></div>;
}