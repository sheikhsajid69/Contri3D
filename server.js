import 'dotenv/config';
import { serve } from '@hono/node-server';
import { readFileSync } from 'node:fs';
import { Hono } from 'hono';
import { fetchGitHub } from './lib/github.js';
import { fetchLeetCode } from './lib/leetcode.js';
import { normalize } from './lib/normalize.js';
import { renderSVG } from './lib/renderer.js';
import { get, set } from './lib/cache.js';

const app = new Hono();

app.get('/api/contributions', async (c) => {
  const github = c.req.query('github');
  const lc = c.req.query('lc') || '';
  const theme = c.req.query('theme') || 'green';
  const source = c.req.query('source') || 'all';

  if (!github && !lc) {
    return c.text('Missing ?github= or ?lc= param', 400);
  }

  const cacheKey = `${github}:${lc}:${theme}:${source}`;
  const cached = get(cacheKey);
  if (cached) {
    return new Response(cached, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
        'X-Cache': 'HIT',
      },
    });
  }

  try {
    const [ghResult, lcResult] = await Promise.allSettled([
      github ? fetchGitHub(github) : Promise.resolve({}),
      lc ? fetchLeetCode(lc) : Promise.resolve({}),
    ]);

    const githubMap = ghResult.status === 'fulfilled' ? ghResult.value : (() => { throw new Error(ghResult.reason); })();
    const lcMap = lcResult.status === 'fulfilled' ? lcResult.value : {};

    const ghData = source === 'leetcode' ? {} : githubMap;
    const lcData = source === 'github' ? {} : lcMap;

    const { days, maxTotal } = normalize(ghData, lcData);
    const svg = renderSVG(days, maxTotal, { theme, source });

    set(cacheKey, svg);

    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    const errorSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 80">
  <rect width="400" height="80" fill="#0d1117" rx="8"/>
  <text x="200" y="44" text-anchor="middle" fill="#f85149" font-family="monospace" font-size="13">Error: ${err.message}</text>
</svg>`;
    return new Response(errorSvg, {
      headers: { 'Content-Type': 'image/svg+xml' },
    });
  }
});

app.get('/', (c) => {
  const html = readFileSync('./public/index.html', 'utf-8');
  return c.html(html);
});

const PORT = 3000;
console.log(`Server running at http://localhost:${PORT}`);
serve({ fetch: app.fetch, port: PORT });
