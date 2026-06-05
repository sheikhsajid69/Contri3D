export function normalize(githubMap, lcMap, wakaMap) {
  const allDates = [...new Set([
    ...Object.keys(githubMap),
    ...Object.keys(lcMap),
    ...Object.keys(wakaMap || {}),
  ])].sort();
  let maxTotal = 1;

  const days = allDates.map(date => {
    const github = githubMap[date] || 0;
    const leetcode = lcMap[date] || 0;
    const waka = (wakaMap && wakaMap[date]) || 0;
    const total = github + Math.ceil(leetcode * 1.5) + Math.ceil(waka * 2.0);
    maxTotal = Math.max(maxTotal, total);
    return { date, github, leetcode, waka, total };
  });

  if (days.length === 0) {
    return { maxTotal: 1, days: [] };
  }

  return {
    maxTotal,
    days: days.map(d => ({
      ...d,
      colorIndex: d.total === 0 ? 0
        : d.total <= 3 ? 1
        : d.total <= 8 ? 2
        : d.total <= 15 ? 3
        : 4,
    })),
  };
}
