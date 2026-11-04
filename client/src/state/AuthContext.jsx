import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api.js';

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    try { localStorage.removeItem('matribhasha-token'); } catch { /* Session cookies work even when browser storage is unavailable. */ }
    const expire = () => setUser(null);
    window.addEventListener('matribhasha:session-expired', expire);
    api.get('/auth/me').then(({ data }) => setUser(data.user)).catch(() => setUser(null)).finally(() => setLoading(false));
    return () => window.removeEventListener('matribhasha:session-expired', expire);
  }, []);
  const value = useMemo(() => ({
    user, loading,
    async login(email, password) { const { data } = await api.post('/auth/login', { email, password }); setUser(data.user); return data.user; },
    async register(details) { const { data } = await api.post('/auth/register', details); setUser(data.user); return data.user; },
    async logout() { try { await api.post('/auth/logout'); } finally { setUser(null); } },
    async updatePreferences(preferences) { const { data } = await api.put('/users/preferences', preferences); setUser(data.user); return data.user; },
    async updateLanguagePreferences(preferences) { const { data } = await api.put('/users/languages', preferences); setUser(data.user); return data.user; },
  }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
