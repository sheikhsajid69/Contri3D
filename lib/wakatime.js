const WAKA_API = 'https://wakatime.com/api/v1';
const CHUNK_DAYS = 30;

export async function fetchWakaTime(username) {
  if (!username) return {};
  try {
    const endDate = new Date();
    const startDate = new Date(Date.now() - 364 * 86400000);

    // Build all chunk date ranges upfront
    const chunks = [];
    let chunkStart = new Date(startDate);
    while (chunkStart < endDate) {
      const chunkEnd = new Date(Math.min(chunkStart.getTime() + CHUNK_DAYS * 86400000, endDate.getTime()));
      chunks.push({
        s: chunkStart.toISOString().slice(0, 10),
        e: chunkEnd.toISOString().slice(0, 10),
      });
      chunkStart = new Date(chunkStart.getTime() + CHUNK_DAYS * 86400000);
    }

    // Fire all chunk requests in parallel, each with a 3-second abort
    const chunkResults = await Promise.allSettled(
      chunks.map(({ s, e }) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        return fetch(
          `${WAKA_API}/users/${username}/summaries?start=${s}&end=${e}`,
          { signal: controller.signal }
        )
          .then(async (res) => {
            clearTimeout(timeout);
            if (!res.ok) return null;
            return res.json();
          })
          .catch(() => {
            clearTimeout(timeout);
            return null;
          });
      })
    );

    // Merge all fulfilled chunk data into a single result map
    const result = {};
    for (const settled of chunkResults) {
      const json = settled.status === 'fulfilled' ? settled.value : null;
      if (json?.data) {
        json.data.forEach(entry => {
          if (entry.range?.date && entry.grand_total?.decimal !== undefined) {
            const val = parseFloat(entry.grand_total.decimal);
            result[entry.range.date] = (result[entry.range.date] || 0) + val;
          }
        });
      }
    }

    return result;
  } catch (err) {
    console.warn(`WakaTime fetch failed for "${username}":`, err?.message || err);
    return {};
  }
}
