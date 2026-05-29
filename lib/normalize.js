export function normalize(githubMap, lcMap) {
  const allDates = [...new Set([...Object.keys(githubMap), ...Object.keys(lcMap)])].sort();
  let maxTotal = 1;

  const days = allDates.map(date => {
    const github = githubMap[date] || 0;
    const leetcode = lcMap[date] || 0;
    const total = github + Math.ceil(leetcode * 1.5);
    maxTotal = Math.max(maxTotal, total);
    return { date, github, leetcode, total };
  });

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
