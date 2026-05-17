import './index.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ModQueueDashboard } from './Dashboard';

export const Splash = () => {
  return <ModQueueDashboard />;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Splash />
  </StrictMode>
);
