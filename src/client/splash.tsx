import './index.css';
import { Devvit } from '@devvit/public-api';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ModQueueDashboard } from './Dashboard';

// Register AppInstall trigger
Devvit.addTrigger({
  event: 'AppInstall',
  async onEvent(event, context) {
    console.log('App installed successfully', event);
  },
});

export const Splash = () => {
  return <ModQueueDashboard />;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Splash />
  </StrictMode>
);