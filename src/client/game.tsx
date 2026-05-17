import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ModQueueDashboard } from './Dashboard';

export const App = () => {
  return <ModQueueDashboard />;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
