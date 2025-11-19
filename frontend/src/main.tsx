import { Buffer } from 'buffer';

// Make Buffer available globally BEFORE any other imports
(window as any).Buffer = Buffer;
(window as any).global = window;

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);