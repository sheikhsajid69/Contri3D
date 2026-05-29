import 'dotenv/config';
import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { fetchGitHub } from '../lib/github.js';
import { fetchLeetCode } from '../lib/leetcode.js';
import { normalize } from '../lib/normalize.js';
import { renderSVG } from '../lib/renderer.js';
import { get, set } from '../lib/cache.js';

export const config = { runtime: 'nodejs20.x' };

const app = new Hono().basePath('/api');

app.get('/contributions', async (c) => {
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

export default handle(app);
