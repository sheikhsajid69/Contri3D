const LC_API = 'https://leetcode.com/graphql';

const QUERY = `
query($username: String!) {
  matchedUser(username: $username) {
    submissionCalendar
  }
}`;

export async function fetchLeetCode(username) {
  if (!username) return {};
  try {
    const res = await fetch(LC_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://leetcode.com',
      },
      body: JSON.stringify({ query: QUERY, variables: { username } }),
    });
    if (!res.ok) return {};
    const json = await res.json();
    const raw = json?.data?.matchedUser?.submissionCalendar;
    if (!raw) return {};

    const calendar = JSON.parse(raw);
    const result = {};
    Object.entries(calendar).forEach(([ts, count]) => {
      const date = new Date(Number(ts) * 1000).toISOString().slice(0, 10);
      result[date] = (result[date] || 0) + count;
    });
    return result;
  } catch (err) {
    console.warn(`LeetCode fetch failed for "${username}":`, err?.message || err);
    return {};
  }
}
