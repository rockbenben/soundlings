import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { catalog } from './catalog';
import App from './App';
import './styles.css';

await catalog.load();

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('#root not found');

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
