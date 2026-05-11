import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Dashboard } from './components/Dashboard';

export const App = () => {
  return <Dashboard />;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);