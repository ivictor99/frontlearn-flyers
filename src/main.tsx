import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import '@fontsource-variable/inter';
import '@fontsource-variable/plus-jakarta-sans';
import '@fontsource/dm-serif-display';
import './styles.css';

import { App } from './App';
import { AppProvider } from './ui/store';

const container = document.getElementById('root');
if (!container) throw new Error('Root container is missing.');

createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <AppProvider>
        <App />
      </AppProvider>
    </BrowserRouter>
  </StrictMode>,
);
