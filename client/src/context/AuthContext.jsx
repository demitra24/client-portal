import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api';
import { connectSocket, disconnectSocket } from '../lib/socket';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('portal_token');
    if (!token) return setLoading(false);
    api.get('/auth/me')
      .then(({ data }) => { setUser(data); connectSocket(token); })
      .catch(() => localStorage.removeItem('portal_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('portal_token', data.token);
    setUser(data.user);
    connectSocket(data.token);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('portal_token');
    disconnectSocket();
    setUser(null);
  };

  return <Ctx.Provider value={{ user, loading, login, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);