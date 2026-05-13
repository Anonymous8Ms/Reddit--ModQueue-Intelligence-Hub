// ============================================================================
// TRIGGER HANDLERS
// ============================================================================

import { Hono } from 'hono';

export const triggers = new Hono();

// Health check for trigger endpoint - Devvit posts to this exact path
triggers.get('/', async (c) => {
  return c.json({ status: 'ok' });
});

// On App Install Trigger - MUST work without subreddit context
// Devvit expects POST to /internal/triggers/on-app-install
triggers.post('/on-app-install', async (c) => {
  try {
    console.log('OnAppInstall trigger called');
    return c.json({
      status: 'success',
      message: 'App installed successfully',
    });
  } catch (error) {
    console.error('OnAppInstall trigger error:', error);
    return c.json(
      { status: 'error', message: 'Failed to install app' },
      400
    );
  }
});