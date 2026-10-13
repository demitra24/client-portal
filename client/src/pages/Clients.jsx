import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import { useLiveRefresh } from '../lib/hooks';
import { PageHeader, Btn, Icon, ListSkeleton, Empty } from '../components/ui';
import { ClientModal } from '../components/modals';
import { fmtDate } from '../lib/format';

export default function Clients() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [clients, setClients] = useState(null);
  const [modal, setModal] = useState(null);   // 'new' | client doc | null
  const [confirmId, setConfirmId] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => { if (user.role !== 'admin') nav('/', { replace: true }); }, [user, nav]);
  const load = useCallback(() => api.get('/clients').then(({ data }) => setClients(data)).catch(() => setClients([])), []);
  useEffect(() => { load(); }, [load]);
  useLiveRefresh(load);

  const remove = async (id) => {
    setErr('');
    try { await api.delete(`/clients/${id}`); setConfirmId(null); load(); }
    catch (e) { setErr(errMsg(e)); setConfirmId(null); }
  };

  return (
    <div>
      <PageHeader title="Clients" meta={clients ? `${clients.length} companies` : ''}>
        <Btn onClick={() => setModal('new')}><Icon name="plus" className="h-3.5 w-3.5" />New client</Btn>
      </PageHeader>
      {err && <p className="mb-4 border-l-2 border-accent pl-3 text-sm text-accent">{err}</p>}
      {!clients ? <ListSkeleton /> : clients.length === 0 ? (
        <Empty>No clients yet. Add your first one to start creating projects.</Empty>
      ) : (
        <ul className="divide-y divide-line border-t border-line">
          {clients.map((c) => (
            <li key={c._id} className="flex flex-wrap items-center gap-x-6 gap-y-2 py-4">
              <div className="min-w-[10rem] flex-1">
                <p className="font-medium">{c.company}</p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-mute">{c.contactName}</p>
              </div>
              <span className="font-mono text-xs text-ink/70">{c.email}</span>
              <span className={`inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${c.portalUser ? 'border-moss/40 text-moss' : 'border-line text-mute'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${c.portalUser ? 'bg-moss' : 'bg-line'}`} />
                {c.portalUser ? 'Portal active' : 'No login'}
              </span>
              <span className="font-mono text-xs text-mute">{String(c.projectCount || 0).padStart(2, '0')} projects</span>
              <span className="hidden font-mono text-xs text-mute lg:block">since {fmtDate(c.createdAt)}</span>
              {confirmId === c._id ? (
                <span className="flex items-center gap-2 text-sm">
                  <span className="text-accent">Remove?</span>
                  <button onClick={() => remove(c._id)} className="font-medium text-accent underline underline-offset-4">Yes</button>
                  <button onClick={() => setConfirmId(null)} className="text-mute underline underline-offset-4">Cancel</button>
                </span>
              ) : (
                <span className="ml-auto flex items-center gap-4 text-sm">
                  <button onClick={() => setModal(c)} className="underline decoration-line underline-offset-4 hover:decoration-accent">Edit</button>
                  <button onClick={() => setConfirmId(c._id)} className="text-mute hover:text-accent"><Icon name="trash" className="h-4 w-4" /></button>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      <ClientModal open={!!modal} client={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />
    </div>
  );
}