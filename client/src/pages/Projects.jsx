import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useLiveRefresh } from '../lib/hooks';
import { PageHeader, Btn, Icon, ListSkeleton } from '../components/ui';
import { ProjectLedger } from '../components/ledger';
import { ProjectModal } from '../components/modals';

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const load = useCallback(() => api.get('/projects').then(({ data }) => setProjects(data)).catch(() => setProjects([])), []);
  useEffect(() => { load(); }, [load]);
  useLiveRefresh(load);

  return (
    <div>
      <PageHeader title="Projects" meta={projects ? `${projects.length} in the workspace` : ''}>
        {user.role === 'admin' && <Btn onClick={() => setShowNew(true)}><Icon name="plus" className="h-3.5 w-3.5" />New project</Btn>}
      </PageHeader>
      {!projects ? <ListSkeleton /> : <ProjectLedger projects={projects} />}
      <ProjectModal open={showNew} onClose={() => setShowNew(false)} onSaved={() => { setShowNew(false); load(); }} />
    </div>
  );
}