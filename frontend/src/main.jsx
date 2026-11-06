import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { initGA } from './analytics';
import { registerServiceWorker } from './lib/push';

initGA();
registerServiceWorker();   // phone notifications only — the worker caches nothing

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
