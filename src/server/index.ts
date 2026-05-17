import { getRequestListener } from '@hono/node-server';
import { createServer, getServerPort } from '@devvit/web/server';
import { Hono } from 'hono';
import { api } from './routes/api';
import { forms } from './routes/forms';
import { menu } from './routes/menu';
import { queueApi } from './routes/queue';
import { triggers } from './routes/triggers';

const app = new Hono();

app.route('/internal/triggers', triggers);
app.route('/internal/menu', menu);
app.route('/internal/form', forms);
app.route('/api', api);
app.route('/api/modqueue', queueApi);
app.route('/modqueue', queueApi);

app.get('/health', (c) => {
  return c.json({ status: 'healthy' });
});

app.notFound((c) => {
  return c.text('Not Found', 404);
});

const server = createServer(getRequestListener(app.fetch));

server.on('error', (error) => {
  console.error(`server error: ${error.stack ?? error.message}`);
});

server.listen(getServerPort());
