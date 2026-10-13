import { useEffect, useState } from 'react';
import { api, errMsg } from '../api';
import { Modal, Btn, Field, Label, inputCls, Icon, TASK_COLUMNS, PRIORITY, PROJECT_STATUS } from './ui';

/* ------------------------------- task modal ------------------------------- */
export function TaskModal({ state, onClose, onSaved, project }) {
  const isNew = state && !state.task;
  const [f, setF] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!state) return;
    const t = state.task;
    setF(t
      ? { title: t.title, description: t.description || '', status: t.status, priority: t.priority, dueDate: t.dueDate ? t.dueDate.slice(0, 10) : '', assignee: t.assignee?._id || '' }
      : { title: '', description: '', status: state.status || 'todo', priority: 'medium', dueDate: '', assignee: '' });
  }, [state]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    const payload = { ...f, assignee: f.assignee || null, dueDate: f.dueDate || null };
    try {
      if (isNew) {
        const { data } = await api.post('/tasks', { ...payload, project: project._id });
        onSaved(data, true);
      } else {
        const { data } = await api.patch(`/tasks/${state.task._id}`, payload);
        onSaved(data, false);
      }
    } catch (ex) { setErr(errMsg(ex)); } finally { setBusy(false); }
  };
  const remove = async () => {
    try { await api.delete(`/tasks/${state.task._id}`); onSaved(null, false); }
    catch (ex) { setErr(errMsg(ex)); }
  };

  return (
    <Modal open={!!state} onClose={onClose} title={isNew ? 'New task' : 'Edit task'}>
      {f && (
        <form onSubmit={submit} className="space-y-4">
          <Field label="Title"><input required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className={inputCls} placeholder="What needs to happen?" /></Field>
          <Field label="Description"><textarea rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className={`${inputCls} resize-y`} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Status">
              <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} className={inputCls}>
                {TASK_COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="Priority">
              <select value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })} className={inputCls}>
                {Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </Field>
            <Field label="Due date"><input type="date" value={f.dueDate} onChange={(e) => setF({ ...f, dueDate: e.target.value })} className={inputCls} /></Field>
            <Field label="Assignee">
              <select value={f.assignee} onChange={(e) => setF({ ...f, assignee: e.target.value })} className={inputCls}>
                <option value="">Unassigned</option>
                {project.team.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
              </select>
            </Field>
          </div>
          {err && <p className="border-l-2 border-accent pl-3 text-sm text-accent">{err}</p>}
          <div className="flex items-center justify-between pt-2">
            {!isNew ? (
              <button type="button" onClick={remove} className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"><Icon name="trash" className="h-3.5 w-3.5" />Delete task</button>
            ) : <span />}
            <div className="flex gap-2">
              <Btn type="button" variant="ghost" onClick={onClose}>Cancel</Btn>
              <Btn type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save task'}</Btn>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
}

/* ------------------------------ project modal ------------------------------ */
export function ProjectModal({ open, onClose, onSaved, onDeleted, project }) {
  const editing = !!project;
  const [clients, setClients] = useState([]);
  const [members, setMembers] = useState([]);
  const [f, setF] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setF(editing
      ? { name: project.name, code: project.code, client: project.client?._id, description: project.description || '', status: project.status, deadline: project.deadline ? project.deadline.slice(0, 10) : '', budget: String(project.budget || ''), team: project.team.map((t) => t._id) }
      : { name: '', code: '', client: '', description: '', status: 'planning', deadline: '', budget: '', team: [] });
    api.get('/clients').then(({ data }) => setClients(data)).catch(() => {});
    api.get('/users').then(({ data }) => setMembers(data.filter((u) => u.role !== 'client'))).catch(() => {});
  }, [open, project, editing]);

  const toggleMember = (id) => setF((s) => ({ ...s, team: s.team.includes(id) ? s.team.filter((x) => x !== id) : [...s.team, id] }));

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    const payload = { ...f, budget: Number(f.budget) || 0, deadline: f.deadline || null };
    try {
      if (editing) await api.patch(`/projects/${project._id}`, payload);
      else await api.post('/projects', payload);
      onSaved();
    } catch (ex) { setErr(errMsg(ex)); } finally { setBusy(false); }
  };
  const remove = async () => {
    setBusy(true);
    try { await api.delete(`/projects/${project._id}`); onDeleted?.(); }
    catch (ex) { setErr(errMsg(ex)); } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit project' : 'New project'} wide>
      {f && (
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_9rem]">
            <Field label="Project name"><input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={inputCls} placeholder="e.g. Halstead Brand System" /></Field>
            <Field label="Code"><input value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} className={`${inputCls} font-mono`} placeholder="HLD-01" /></Field>
          </div>
          <Field label="Client">
            <select required value={f.client} onChange={(e) => setF({ ...f, client: e.target.value })} className={inputCls}>
              <option value="">Select a client…</option>
              {clients.map((c) => <option key={c._id} value={c._id}>{c.company}</option>)}
            </select>
          </Field>
          <Field label="Description"><textarea rows={2} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className={`${inputCls} resize-y`} /></Field>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Deadline"><input type="date" value={f.deadline} onChange={(e) => setF({ ...f, deadline: e.target.value })} className={inputCls} /></Field>
            <Field label="Budget (USD)"><input type="number" min="0" value={f.budget} onChange={(e) => setF({ ...f, budget: e.target.value })} className={`${inputCls} font-mono`} /></Field>
            <Field label="Status">
              <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} className={inputCls}>
                {Object.entries(PROJECT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Team">
            <div className="flex flex-wrap gap-2">
              {members.map((m) => {
                const on = f.team.includes(m._id);
                return (
                  <button type="button" key={m._id} onClick={() => toggleMember(m._id)}
                    className={`flex items-center gap-1.5 border px-2.5 py-1.5 text-xs transition-colors ${on ? 'border-ink bg-ink text-cream' : 'border-line bg-white hover:border-ink'}`}>
                    {on && <Icon name="check" className="h-3 w-3" />}{m.name}
                  </button>
                );
              })}
              {!members.length && <span className="text-xs text-mute">Add team members from the Team page first.</span>}
            </div>
          </Field>
          {err && <p className="border-l-2 border-accent pl-3 text-sm text-accent">{err}</p>}
          <div className="flex items-center justify-between pt-2">
            {editing ? (
              <button type="button" onClick={remove} className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"><Icon name="trash" className="h-3.5 w-3.5" />Delete project</button>
            ) : <span />}
            <div className="flex gap-2">
              <Btn type="button" variant="ghost" onClick={onClose}>Cancel</Btn>
              <Btn type="submit" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Create project'}</Btn>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
}

/* ------------------------------- client modal ------------------------------ */
export function ClientModal({ open, onClose, onSaved, client }) {
  const editing = !!client;
  const [f, setF] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!open) return;
    setF(editing
      ? { company: client.company, contactName: client.contactName, email: client.email, phone: client.phone || '', address: client.address || '', createLogin: !client.portalUser, loginEmail: '', loginPassword: '' }
      : { company: '', contactName: '', email: '', phone: '', address: '', createLogin: true, loginEmail: '', loginPassword: '' });
  }, [open, client, editing]);

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      if (editing) await api.patch(`/clients/${client._id}`, f);
      else await api.post('/clients', f);
      onSaved();
    } catch (ex) { setErr(errMsg(ex)); } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit client' : 'New client'}>
      {f && (
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Company"><input required value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} className={inputCls} /></Field>
            <Field label="Contact name"><input required value={f.contactName} onChange={(e) => setF({ ...f, contactName: e.target.value })} className={inputCls} /></Field>
            <Field label="Email"><input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className={inputCls} /></Field>
            <Field label="Phone"><input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} className={inputCls} /></Field>
          </div>
          <Field label="Address"><input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} className={inputCls} /></Field>
          {(!editing || !client.portalUser) && (
            <div className="border border-line bg-cream p-4">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" checked={f.createLogin} onChange={(e) => setF({ ...f, createLogin: e.target.checked })} className="accent-[#FF4D00]" />
                Create a client portal login
              </label>
              {f.createLogin && (
                <div className="mt-3 grid grid-cols-2 gap-4">
                  <Field label="Login email"><input type="email" required={f.createLogin} value={f.loginEmail} onChange={(e) => setF({ ...f, loginEmail: e.target.value })} className={inputCls} /></Field>
                  <Field label="Login password"><input required={f.createLogin} minLength={6} value={f.loginPassword} onChange={(e) => setF({ ...f, loginPassword: e.target.value })} className={inputCls} placeholder="min. 6 characters" /></Field>
                </div>
              )}
            </div>
          )}
          {err && <p className="border-l-2 border-accent pl-3 text-sm text-accent">{err}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Btn type="button" variant="ghost" onClick={onClose}>Cancel</Btn>
            <Btn type="submit" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Add client'}</Btn>
          </div>
        </form>
      )}
    </Modal>
  );
}

/* -------------------------------- user modal ------------------------------- */
export function UserModal({ open, onClose, onSaved, user: editingUser, selfId }) {
  const editing = !!editingUser;
  const [f, setF] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!open) return;
    setF(editing
      ? { name: editingUser.name, title: editingUser.title || '', email: editingUser.email, role: editingUser.role, password: '' }
      : { name: '', title: '', email: '', role: 'member', password: '' });
  }, [open, editingUser, editing]);

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      if (editing) await api.patch(`/users/${editingUser._id}`, { name: f.name, title: f.title, role: f.role, ...(f.password ? { password: f.password } : {}) });
      else await api.post('/users', f);
      onSaved();
    } catch (ex) { setErr(errMsg(ex)); } finally { setBusy(false); }
  };

  const isSelf = editing && String(editingUser._id) === String(selfId);
  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit member' : 'Add team member'}>
      {f && (
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Full name"><input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={inputCls} /></Field>
            <Field label="Job title"><input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className={inputCls} placeholder="e.g. Design Lead" /></Field>
            <Field label="Email"><input type="email" required value={f.email} disabled={editing} className={`${inputCls} disabled:text-mute`} /></Field>
            <Field label="Role">
              <select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} disabled={isSelf} className={`${inputCls} disabled:text-mute`}>
                <option value="member">Team member</option>
                <option value="admin">Administrator</option>
              </select>
            </Field>
          </div>
          <Field label={editing ? 'New password (leave blank to keep current)' : 'Password'}>
            <input required={!editing} minLength={editing ? 0 : 6} type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} className={inputCls} placeholder="min. 6 characters" />
          </Field>
          {err && <p className="border-l-2 border-accent pl-3 text-sm text-accent">{err}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Btn type="button" variant="ghost" onClick={onClose}>Cancel</Btn>
            <Btn type="submit" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Add member'}</Btn>
          </div>
        </form>
      )}
    </Modal>
  );
}