export const config = { runtime: 'nodejs' };

export default async function handler(req) {
  const url = new URL(req.url);
  const user = url.searchParams.get('user') || url.searchParams.get('github') || '';
  const lc = url.searchParams.get('lc') || '';
  const waka = url.searchParams.get('waka') || '';
  const theme = url.searchParams.get('theme') || 'green';
  const color = url.searchParams.get('color') || '';
  const type = url.searchParams.get('type') || 'iso';
  const size = url.searchParams.get('size') || 'md';
  const labels = url.searchParams.get('labels') !== '0';
  const animate = url.searchParams.get('animate') === '1';

  if (!user && !lc) {
    return new Response('Missing ?user= or ?github= param', { status: 400 });
  }

  const start = Date.now();

  try {
    const { fetchGitHub } = await import('../lib/github.js');
    const { fetchLeetCode } = await import('../lib/leetcode.js');
    const { fetchWakaTime } = await import('../lib/wakatime.js');
    const { normalize } = await import('../lib/normalize.js');
    const { renderSVG } = await import('../lib/renderer.js');
    const { getTheme } = await import('../lib/themes.js');
    const { get, set } = await import('../lib/cache.js');

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
    const svg = renderSVG(days, maxTotal, { theme, color, type, size, labels, animate, ramp });

    await set(`${user}:${lc}:${waka}:${theme}:${color}:${type}:${size}:${labels}:${animate}`, svg);

    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'Access-Control-Allow-Origin': '*',
        'X-Render-Time': `${Date.now() - start}ms`,
      },
    });
  } catch (err) {
    const msg = err.message;
    const errorColor = msg.includes('rate limit') ? '#d29922' : '#f85149';
    const hint = msg.includes('token') ? 'Set GITHUB_TOKEN in environment'
      : msg.includes('not found') || msg.includes('Could not resolve') ? 'Check username and try again'
      : 'Something went wrong';
    const errorSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 100">
  <rect width="520" height="100" fill="#0d1117" rx="12"/>
  <text x="260" y="42" text-anchor="middle" fill="${errorColor}" font-family="monospace" font-size="13" font-weight="600">${msg}</text>
  <text x="260" y="64" text-anchor="middle" fill="#8b949e" font-family="monospace" font-size="11">${hint}</text>
</svg>`;
    return new Response(errorSvg, {
      headers: { 'Content-Type': 'image/svg+xml', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
