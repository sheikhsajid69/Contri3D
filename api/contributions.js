import 'dotenv/config';
import { fetchGitHub } from '../lib/github.js';
import { fetchLeetCode } from '../lib/leetcode.js';
import { fetchWakaTime } from '../lib/wakatime.js';
import { normalize } from '../lib/normalize.js';
import { renderSVG } from '../lib/renderer.js';
import { getTheme } from '../lib/themes.js';
import { get, set } from '../lib/cache.js';

export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const user = url.searchParams.get('user') || url.searchParams.get('github') || '';
  const lc = url.searchParams.get('lc') || '';
  const waka = url.searchParams.get('waka') || '';
  const theme = url.searchParams.get('theme') || 'green';
  const color = url.searchParams.get('color') || '';
  const type = url.searchParams.get('type') || 'iso';
  const size = url.searchParams.get('size') || 'md';
  const showLabels = url.searchParams.get('labels') !== '0';
  const animate = url.searchParams.get('animate') === '1';

  if (!user && !lc) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Missing ?user= or ?github= param');
    return;
  }

  const start = Date.now();
  const cacheKey = `${user}:${lc}:${waka}:${theme}:${color}:${type}:${size}:${showLabels}:${animate}`;

  try {
    const cached = await get(cacheKey);
    if (cached) {
      res.writeHead(200, {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'X-Cache': 'HIT',
      });
      res.end(cached);
      return;
    }

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
    const svg = renderSVG(days, maxTotal, { theme, color, type, size, labels: showLabels, animate, ramp });

    await set(cacheKey, svg);

    res.writeHead(200, {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'Access-Control-Allow-Origin': '*',
      'X-Render-Time': `${Date.now() - start}ms`,
    });
    res.end(svg);
  } catch (err) {
    const msg = err.message;
    const lower = msg.toLowerCase();
    const errorColor = lower.includes('rate limit') ? '#d29922' : '#f85149';
    const hint = lower.includes('token') ? 'Set GITHUB_TOKEN in Vercel env'
      : lower.includes('not found') || lower.includes('could not resolve') ? 'Check username and try again'
      : 'Something went wrong';
    const errorSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 100">
  <rect width="520" height="100" fill="#0d1117" rx="12"/>
  <text x="260" y="42" text-anchor="middle" fill="${errorColor}" font-family="monospace" font-size="13" font-weight="600">${msg}</text>
  <text x="260" y="64" text-anchor="middle" fill="#8b949e" font-family="monospace" font-size="11">${hint}</text>
</svg>`;
    res.writeHead(200, { 'Content-Type': 'image/svg+xml', 'Access-Control-Allow-Origin': '*' });
    res.end(errorSvg);
  }
}
