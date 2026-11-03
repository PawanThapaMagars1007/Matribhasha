import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './state/AuthContext.jsx';
import { Shell } from './components/Shell.jsx';
import { Landing } from './pages/Landing.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { AuthPage } from './pages/AuthPage.jsx';
import { Languages } from './pages/Languages.jsx';
import { Settings } from './pages/Settings.jsx';
import { LanguageDetails } from './pages/LanguageDetails.jsx';

function Guard({ children }) { const { user, loading } = useAuth(); if (loading) return <div className="screen-loading">Opening your learning space…</div>; return user ? children : <Navigate to="/login" replace />; }
export default function App() {
  return <Routes><Route path="/" element={<Landing />} /><Route path="/login" element={<AuthPage mode="login" />} /><Route path="/register" element={<AuthPage mode="register" />} /><Route element={<Guard><Shell /></Guard>}><Route path="/home" element={<Dashboard />} /><Route path="/languages" element={<Languages />} /><Route path="/languages/:id" element={<LanguageDetails />} /><Route path="/learn" element={<Languages />} /><Route path="/settings" element={<Settings />} /></Route><Route path="*" element={<Navigate to="/" replace />} /></Routes>;
}
