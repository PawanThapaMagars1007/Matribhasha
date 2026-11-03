import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api.js';

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const token = localStorage.getItem('matribhasha-token');
    if (!token) { setLoading(false); return; }
    api.get('/auth/me').then(({ data }) => setUser(data.user)).catch(() => localStorage.removeItem('matribhasha-token')).finally(() => setLoading(false));
  }, []);
  const value = useMemo(() => ({
    user, loading,
    async login(email, password) { const { data } = await api.post('/auth/login', { email, password }); localStorage.setItem('matribhasha-token', data.token); setUser(data.user); return data.user; },
    async register(details) { const { data } = await api.post('/auth/register', details); localStorage.setItem('matribhasha-token', data.token); setUser(data.user); return data.user; },
    async logout() { try { await api.post('/auth/logout'); } finally { localStorage.removeItem('matribhasha-token'); setUser(null); } },
    async updatePreferences(preferences) { const { data } = await api.put('/users/preferences', preferences); setUser(data.user); return data.user; },
    async updateLanguagePreferences(preferences) { const { data } = await api.put('/users/languages', preferences); setUser(data.user); return data.user; },
  }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
