export const config = { runtime: 'nodejs' };

export default async function handler(req) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="100%">
  <rect width="200" height="60" fill="#0d1117" rx="8"/>
  <text x="100" y="36" text-anchor="middle" fill="#39d353" font-family="monospace" font-size="14">API alive</text>
</svg>`;

  return new Response(svg, {
    status: 200,
    headers: { 'Content-Type': 'image/svg+xml' },
  });
}
