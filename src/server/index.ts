// ============================================================================
// SERVER INDEX - Main entry point
// ============================================================================

import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { createServer, getServerPort } from '@devvit/web/server';
import { api } from './routes/api';
import { forms } from './routes/forms';
import { menu } from './routes/menu';
import { triggers } from './routes/triggers';
import { queueApi } from './routes/queue';

const app = new Hono();
const internal = new Hono();

internal.route('/menu', menu);
internal.route('/form', forms);
internal.route('/triggers', triggers);

// Original API routes
app.route('/api', api);

// ModQueue Hub API routes
app.route('/modqueue', queueApi);

serve({
  fetch: app.fetch,
  createServer,
  port: getServerPort(),
});