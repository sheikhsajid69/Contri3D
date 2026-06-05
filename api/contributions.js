import { Hono } from 'hono';
import { handle } from 'hono/vercel';

export const config = { runtime: 'nodejs' };

const app = new Hono().basePath('/api');

app.get('/contributions', async (c) => {
  return new Response(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="100%">
      <rect width="200" height="60" fill="#0d1117" rx="8"/>
      <text x="100" y="36" text-anchor="middle" fill="#39d353" font-family="monospace" font-size="14">API is alive</text>
    </svg>`,
    {
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-cache' },
    }
  );
});

export default handle(app);
