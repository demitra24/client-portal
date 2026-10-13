import { useEffect } from 'react';
import { getSocket } from './socket';

// re-runs `handler` (debounced) whenever live activity arrives from the server
export function useLiveRefresh(handler, deps = []) {
  useEffect(() => {
    const s = getSocket();
    if (!s || !handler) return;
    let t;
    const kick = () => { clearTimeout(t); t = setTimeout(handler, 500); };
    s.on('activity:new', kick);
    s.on('project:refresh', kick);
    return () => { s.off('activity:new', kick); s.off('project:refresh', kick); clearTimeout(t); };
  }, deps); // eslint-disable-line
}