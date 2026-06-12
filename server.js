import 'dotenv/config';
import { serve } from '@hono/node-server';
import { readFileSync } from 'node:fs';
import { Hono } from 'hono';
import { fetchGitHub } from './lib/github.js';
import { fetchLeetCode } from './lib/leetcode.js';
import { fetchWakaTime } from './lib/wakatime.js';
import { normalize } from './lib/normalize.js';
import { renderSVG } from './lib/renderer.js';
import { getTheme } from './lib/themes.js';
import { get, set } from './lib/cache.js';

const app = new Hono();

app.get('/api/contributions', async (c) => {
  const user = c.req.query('user') || c.req.query('github') || '';
  const lc = c.req.query('lc') || '';
  const waka = c.req.query('waka') || '';
  const theme = c.req.query('theme') || 'green';
  const color = c.req.query('color') || '';
  const type = c.req.query('type') || 'iso';
  const size = c.req.query('size') || 'md';
  const labelsRaw = c.req.query('labels');
  const animateRaw = c.req.query('animate');

  const labels = labelsRaw === '0' ? false : true;
  const animate = animateRaw === '1' ? true : false;

  if (!user && !lc) {
    return c.text('Missing ?user= or ?github= param', 400);
  }

  const cacheKey = `${user}:${lc}:${waka}:${theme}:${color}:${type}:${size}:${labelsRaw}:${animateRaw}`;
  const cached = await get(cacheKey);
  if (cached) {
    return new Response(cached, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'X-Cache': 'HIT',
      },
    });
  }

  const start = Date.now();

  try {
    const ramp = getTheme(theme, color);
    const [ghResult, lcResult, wakaResult] = await Promise.allSettled([
      user ? fetchGitHub(user) : Promise.resolve({}),
      lc ? fetchLeetCode(lc) : Promise.resolve({}),
      waka ? fetchWakaTime(waka) : Promise.resolve({}),
    ]);

    const githubMap = ghResult.status === 'fulfilled' ? ghResult.value : (() => { throw new Error(ghResult.reason); })();
    const lcMap = lcResult.status === 'fulfilled' ? lcResult.value : {};
    const wakaMap = wakaResult.status === 'fulfilled' ? wakaResult.value : {};

    const { days, maxTotal } = normalize(githubMap, lcMap, wakaMap);
    const svg = renderSVG(days, maxTotal, {
      theme,
      color,
      type,
      size,
      labels,
      animate,
      ramp,
    });

    await set(cacheKey, svg);

    const ms = Date.now() - start;

    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'Access-Control-Allow-Origin': '*',
        'X-Render-Time': `${ms}ms`,
      },
    });
  } catch (err) {
    const msg = err.message;
    let errorColor = '#f85149';
    if (msg.includes('not found') || msg.includes('Could not resolve')) errorColor = '#f85149';
    else if (msg.includes('rate limit') || msg.includes('Rate limited')) errorColor = '#d29922';
    else if (msg.includes('token') || msg.includes('GITHUB_TOKEN')) errorColor = '#f85149';

    const errorSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 100">
  <rect width="520" height="100" fill="#0d1117" rx="12"/>
  <text x="260" y="42" text-anchor="middle" fill="${errorColor}" font-family="monospace" font-size="13" font-weight="600">${msg}</text>
  <text x="260" y="64" text-anchor="middle" fill="#8b949e" font-family="monospace" font-size="11">contrib3d — ${
    msg.includes('token') ? 'Set GITHUB_TOKEN in environment'
    : msg.includes('not found') || msg.includes('Could not resolve') ? 'Check username and try again'
    : 'Something went wrong'
  }</text>
</svg>`;
    return new Response(errorSvg, {
      headers: { 'Content-Type': 'image/svg+xml', 'Access-Control-Allow-Origin': '*' },
    });
  }
});

app.get('/', (c) => {
  const html = readFileSync('./public/index.html', 'utf-8');
  return c.html(html);
});

// Mirror vercel.json rewrite: /api -> /api/contributions for local dev
app.get('/api', async (c) => {
  const url = new URL(c.req.url, `http://${c.req.header('host')}`);
  const newUrl = new URL(`/api/contributions${url.search}`, url.origin);
  return app.fetch(new Request(newUrl.toString(), c.req.raw));
});

const PORT = 3000;
console.log(`Server running at http://localhost:${PORT}`);
serve({ fetch: app.fetch, port: PORT });
