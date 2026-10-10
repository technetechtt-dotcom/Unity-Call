import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Unity Call could not find the root element.');
}

createRoot(root).render(
  <StrictMode>
    <div id="unity-live-region" className="sr-only" aria-live="polite" aria-atomic="true" />
    <App />
  </StrictMode>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js');
  });
}
