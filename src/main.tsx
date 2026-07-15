import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { I18nProvider } from './i18n/I18nContext';
import { GlobalStyles } from './styles/GlobalStyles';

const root = document.getElementById('root');
if (!root) throw new Error('React root element was not found');

createRoot(root).render(
  <StrictMode>
    <I18nProvider>
      <GlobalStyles />
      <App />
    </I18nProvider>
  </StrictMode>,
);
