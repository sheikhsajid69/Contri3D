export const config = { runtime: 'nodejs' };

export default async function handler(req) {
  return new Response('ok', {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  });
}
