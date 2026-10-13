import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useLiveRefresh } from '../lib/hooks';
import { PageHeader, Btn, Icon, Avatar, ListSkeleton, Empty } from '../components/ui';
import { UserModal } from '../components/modals';
import { fmtDate } from '../lib/format';

export default function Team() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [users, setUsers] = useState(null);
  const [modal, setModal] = useState(null);   // 'new' | user doc | null
  const [confirmId, setConfirmId] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => { if (user.role !== 'admin') nav('/', { replace: true }); }, [user, nav]);
  const load = useCallback(() => api.get('/users').then(({ data }) => setUsers(data.filter((u) => u.role !== 'client'))).catch(() => setUsers([])), []);
  useEffect(() => { load(); }, [load]);
  useLiveRefresh(load);

  const remove = async (id) => {
    setErr('');
    try { await api.delete(`/users/${id}`); setConfirmId(null); load(); }
    catch (e) { setErr(e.response?.data?.message || 'Could not remove user'); setConfirmId(null); }
  };

  return (
    <div>
      <PageHeader title="Team" meta={users ? `${users.length} members` : ''}>
        <Btn onClick={() => setModal('new')}><Icon name="plus" className="h-3.5 w-3.5" />Add member</Btn>
      </PageHeader>
      {err && <p className="mb-4 border-l-2 border-accent pl-3 text-sm text-accent">{err}</p>}
      {!users ? <ListSkeleton /> : users.length === 0 ? (
        <Empty>No team members yet.</Empty>
      ) : (
        <ul className="divide-y divide-line border-t border-line">
          {users.map((u) => (
            <li key={u._id} className="flex flex-wrap items-center gap-x-6 gap-y-2 py-4">
              <div className="flex min-w-[10rem] flex-1 items-center gap-3">
                <Avatar name={u.name} />
                <div>
                  <p className="font-medium">{u.name}{u._id === user.id && <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-mute">you</span>}</p>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-mute">{u.title || '—'}</p>
                </div>
              </div>
              <span className="font-mono text-xs text-ink/70">{u.email}</span>
              <span className="border border-line px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-mute">{u.role}</span>
              <span className="hidden font-mono text-xs text-mute lg:block">joined {fmtDate(u.createdAt)}</span>
              {confirmId === u._id ? (
                <span className="flex items-center gap-2 text-sm">
                  <span className="text-accent">Remove?</span>
                  <button onClick={() => remove(u._id)} className="font-medium text-accent underline underline-offset-4">Yes</button>
                  <button onClick={() => setConfirmId(null)} className="text-mute underline underline-offset-4">Cancel</button>
                </span>
              ) : (
                <span className="ml-auto flex items-center gap-4 text-sm">
                  <button onClick={() => setModal(u)} className="underline decoration-line underline-offset-4 hover:decoration-accent">Edit</button>
                  {u._id !== user.id && <button onClick={() => setConfirmId(u._id)} className="text-mute hover:text-accent"><Icon name="trash" className="h-4 w-4" /></button>}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      <UserModal open={!!modal} user={modal === 'new' ? null : modal} selfId={user.id} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />
    </div>
  );
}