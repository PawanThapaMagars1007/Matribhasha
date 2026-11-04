import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './state/AuthContext.jsx';
import { AppErrorBoundary } from './components/AppErrorBoundary.jsx';
import { PwaUpdateNotice } from './components/PwaUpdateNotice.jsx';
import { registerPwa } from './services/pwa.js';
import App from './App.jsx';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><AppErrorBoundary><BrowserRouter><AuthProvider><App /></AuthProvider><PwaUpdateNotice /></BrowserRouter></AppErrorBoundary></React.StrictMode>,
);
registerPwa();
