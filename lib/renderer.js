const SIZES = {
  sm: { tileW: 11, tileH: 6, MAX_H: 40, MIN_H: 2, viewW: 380, PAD: 14 },
  md: { tileW: 16, tileH: 9, MAX_H: 60, MIN_H: 3, viewW: 520, PAD: 20 },
  lg: { tileW: 22, tileH: 12, MAX_H: 80, MIN_H: 4, viewW: 720, PAD: 26 },
};

function barHeight(total, maxTotal, MIN_H, MAX_H) {
  if (total === 0) return MIN_H;
  return MIN_H + ((total / maxTotal) * (MAX_H - MIN_H));
}

function computeStreak(days) {
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].total === 0) break;
    streak++;
  }
  return streak;
}

export function renderSVG(days, maxTotal, options = {}) {
  const sizeName = options.size || 'md';
  const type = options.type || 'iso';
  const showLabels = options.labels !== false;
  const animate = options.animate === true;
  const ramp = options.ramp || [
    ['#161b22', '#0d1117', '#0d1117'],
    ['#0e4429', '#033a20', '#022b18'],
    ['#006d32', '#005626', '#00421d'],
    ['#26a641', '#1a8a32', '#126825'],
    ['#39d353', '#28b340', '#1e9130'],
  ];

  const s = SIZES[sizeName] || SIZES.md;
  const { tileW, tileH, MAX_H, MIN_H, viewW, PAD } = s;
  const HALF_W = tileW / 2;
  const HALF_H = tileH / 2;

  if (days.length === 0) {
    const labelExtra = showLabels ? 60 : 0;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewW} ${130 + labelExtra}" width="100%">
  <rect width="${viewW}" height="${130 + labelExtra}" fill="#0d1117" rx="12"/>
  <text x="${viewW / 2}" y="60" text-anchor="middle" fill="#8b949e" font-family="monospace" font-size="13">No contribution data available</text>
</svg>`;
  }

  let totalContributions = 0;
  let lcTotal = 0;
  let ghTotal = 0;
  let wakaTotal = 0;
  const dayMap = {};
  days.forEach(d => {
    dayMap[d.date] = d;
    totalContributions += d.total;
    if (d.leetcode) lcTotal += d.leetcode;
    if (d.github) ghTotal += d.github;
    if (d.waka) wakaTotal += d.waka;
  });

  const firstDate = new Date(days[0].date);
  const firstDay = firstDate.getDay();
  const startDate = new Date(firstDate);
  startDate.setDate(startDate.getDate() - firstDay);

  const grid = [];
  for (let w = 0; w < 53; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + w * 7 + d);
      const dateStr = date.toISOString().slice(0, 10);
      if (dayMap[dateStr]) {
        week.push(dayMap[dateStr]);
      } else {
        week.push({ date: dateStr, total: 0, colorIndex: 0, github: 0, leetcode: 0, waka: 0 });
      }
    }
    grid.push(week);
  }

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

  function checkBounds(sx, sy, h) {
    const pts = [
      [sx, sy - h],
      [sx + HALF_W, sy - h + HALF_H],
      [sx, sy - h + tileH],
      [sx - HALF_W, sy - h + HALF_H],
      [sx - HALF_W, sy - h + HALF_H],
      [sx - HALF_W, sy + HALF_H],
      [sx, sy + tileH],
      [sx, sy - h + tileH],
      [sx, sy - h + tileH],
      [sx, sy + tileH],
      [sx + HALF_W, sy + HALF_H],
      [sx + HALF_W, sy - h + HALF_H],
    ];
    pts.forEach(([x, y]) => {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    });
  }

  for (let col = 0; col < grid.length; col++) {
    for (let row = 0; row < 7; row++) {
      const sx = (col - row) * HALF_W;
      const sy = (col + row) * HALF_H;
      const h = type === 'grid' ? MIN_H : barHeight(grid[col][row].total, maxTotal, MIN_H, MAX_H);
      checkBounds(sx, sy, h);
    }
  }

  const labelExtra = showLabels ? 60 : 0;
  const viewX = Math.floor(minX) - PAD;
  const viewY = Math.floor(minY) - PAD;
  const viewWCalc = Math.ceil(maxX - minX) + PAD * 2;
  const viewHCalc = Math.ceil(maxY - minY) + PAD * 2 + labelExtra;

  const centerX = (viewX + viewX + viewWCalc) / 2;

  let bars = '';

  const animateStyles = animate ? `
    .bar { animation: rise 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
    @keyframes rise {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .glow { animation: pulse 2s ease-in-out infinite; }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.75; }
    }` : '';

  for (let col = grid.length - 1; col >= 0; col--) {
    for (let row = 6; row >= 0; row--) {
      const day = grid[col][row];
      const h = type === 'grid' ? MIN_H : barHeight(day.total, maxTotal, MIN_H, MAX_H);
      const colors = ramp[day.colorIndex] || ramp[0];
      const sx = (col - row) * HALF_W;
      const sy = (col + row) * HALF_H;
      const isMaxTier = day.colorIndex === 4;

      if (type === 'grid') {
        const rhombus = `${sx},${sy} ${sx + HALF_W},${sy + HALF_H} ${sx},${sy + tileH} ${sx - HALF_W},${sy + HALF_H}`;
        const delay = animate ? ` style="animation-delay:${(col * 0.008).toFixed(3)}s"` : '';
        const cls = `bar${isMaxTier && animate ? ' glow' : ''}`;
        bars += `<polygon points="${rhombus}" fill="${colors[0]}" class="${cls}"${delay}/>`;
      } else if (h > 0) {
        const top = `${sx},${sy - h} ${sx + HALF_W},${sy - h + HALF_H} ${sx},${sy - h + tileH} ${sx - HALF_W},${sy - h + HALF_H}`;
        const left = `${sx - HALF_W},${sy - h + HALF_H} ${sx - HALF_W},${sy + HALF_H} ${sx},${sy + tileH} ${sx},${sy - h + tileH}`;
        const right = `${sx},${sy - h + tileH} ${sx},${sy + tileH} ${sx + HALF_W},${sy + HALF_H} ${sx + HALF_W},${sy - h + HALF_H}`;
        const delay = animate ? ` style="animation-delay:${(col * 0.008).toFixed(3)}s"` : '';
        const cls = `bar${isMaxTier && animate ? ' glow' : ''}`;
        bars += `<g class="${cls}"${delay}><polygon points="${top}" fill="${colors[0]}"/><polygon points="${left}" fill="${colors[1]}"/><polygon points="${right}" fill="${colors[2]}"/></g>`;
      }
    }
  }

  const labelY = maxY + PAD + 20;

  let labels = '';
  if (showLabels) {
    const streak = computeStreak(days);
    const parts = [`↗ ${totalContributions.toLocaleString()} contributions`];
    if (streak > 0) parts.push(`🔥 ${streak}-day streak`);
    if (lcTotal > 0) parts.push(`⚡ ${lcTotal} LeetCode`);
    if (wakaTotal > 0) parts.push(`⌚ ${Math.round(wakaTotal)}h WakaTime`);
    labels = `\n  <text x="${centerX}" y="${labelY}" class="label">${parts.join(' · ')}</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewX} ${viewY} ${viewWCalc} ${viewHCalc}" width="100%">
  <defs>
    <style>
      .label { fill: #8b949e; font-family: monospace; font-size: 11px; text-anchor: middle; }${animateStyles}
    </style>
  </defs>
  <rect x="${viewX}" y="${viewY}" width="${viewWCalc}" height="${viewHCalc}" fill="#0d1117" rx="12"/>
  ${bars}${labels}
</svg>`;
}
