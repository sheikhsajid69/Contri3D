const WAKA_API = 'https://wakatime.com/api/v1';
const CHUNK_DAYS = 30;

export async function fetchWakaTime(username) {
  if (!username) return {};
  try {
    const result = {};
    const endDate = new Date();
    const startDate = new Date(Date.now() - 364 * 86400000);

    let chunkStart = new Date(startDate);
    while (chunkStart < endDate) {
      const chunkEnd = new Date(Math.min(chunkStart.getTime() + CHUNK_DAYS * 86400000, endDate.getTime()));
      const s = chunkStart.toISOString().slice(0, 10);
      const e = chunkEnd.toISOString().slice(0, 10);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      const res = await fetch(
        `${WAKA_API}/users/${username}/summaries?start=${s}&end=${e}`,
        { signal: controller.signal }
      );
      clearTimeout(timeout);

      if (!res.ok) {
        if (Object.keys(result).length === 0) return {};
        break;
      }

      const json = await res.json();
      if (json.data) {
        json.data.forEach(entry => {
          if (entry.range?.date && entry.grand_total?.decimal !== undefined) {
            const val = parseFloat(entry.grand_total.decimal);
            result[entry.range.date] = (result[entry.range.date] || 0) + val;
          }
        });
      }

      chunkStart.setDate(chunkStart.getDate() + CHUNK_DAYS);
    }

    return result;
  } catch {
    return {};
  }
}
