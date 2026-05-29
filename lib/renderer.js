const RAMP = [
  ['#161b22', '#0d1117', '#0d1117'],
  ['#0e4429', '#033a20', '#022b18'],
  ['#006d32', '#005626', '#00421d'],
  ['#26a641', '#1a8a32', '#126825'],
  ['#39d353', '#28b340', '#1e9130'],
];

const TILE_W = 16;
const TILE_H = 9;
const HALF_W = TILE_W / 2;
const HALF_H = TILE_H / 2;
const MAX_BAR_H = 60;
const MIN_BAR_H = 3;
const PAD = 20;

function barHeight(total, maxTotal) {
  if (total === 0) return MIN_BAR_H;
  return MIN_BAR_H + ((total / maxTotal) * (MAX_BAR_H - MIN_BAR_H));
}

export function renderSVG(days, maxTotal, options = {}) {
  const theme = options.theme || 'green';
  const source = options.source || 'all';

  let totalContributions = 0;
  let lcTotal = 0;
  let ghTotal = 0;
  const dayMap = {};
  days.forEach(d => {
    dayMap[d.date] = d;
    totalContributions += d.total;
    if (d.leetcode) lcTotal += d.leetcode;
    if (d.github) ghTotal += d.github;
  });

  const firstDate = new Date(days[0].date);
  const firstDay = firstDate.getDay();
  const startDate = new Date(firstDate);
  startDate.setDate(startDate.getDate() - firstDay);

  const grid = [];
  for (let w = 0; w < 52; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + w * 7 + d);
      const dateStr = date.toISOString().slice(0, 10);
      if (dayMap[dateStr]) {
        week.push(dayMap[dateStr]);
      } else {
        week.push({ date: dateStr, total: 0, colorIndex: 0, github: 0, leetcode: 0 });
      }
    }
    grid.push(week);
  }

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

  function checkBounds(sx, sy, h) {
    const pts = [
      [sx, sy - h],
      [sx + HALF_W, sy - h + HALF_H],
      [sx, sy - h + TILE_H],
      [sx - HALF_W, sy - h + HALF_H],
      [sx - HALF_W, sy - h + HALF_H],
      [sx - HALF_W, sy + HALF_H],
      [sx, sy + TILE_H],
      [sx, sy - h + TILE_H],
      [sx, sy - h + TILE_H],
      [sx, sy + TILE_H],
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

  for (let col = 0; col < 52; col++) {
    for (let row = 0; row < 7; row++) {
      const sx = (col - row) * HALF_W;
      const sy = (col + row) * HALF_H;
      const h = barHeight(grid[col][row].total, maxTotal);
      checkBounds(sx, sy, h);
    }
  }

  const viewX = Math.floor(minX) - PAD;
  const viewY = Math.floor(minY) - PAD;
  const viewW = Math.ceil(maxX - minX) + PAD * 2;
  const viewH = Math.ceil(maxY - minY) + PAD * 2;
  const centerX = (viewX + viewX + viewW) / 2;
  const labelY = maxY + PAD;

  let polygons = '';

  for (let col = 51; col >= 0; col--) {
    for (let row = 6; row >= 0; row--) {
      const day = grid[col][row];
      const h = barHeight(day.total, maxTotal);
      const colors = RAMP[day.colorIndex] || RAMP[0];
      const sx = (col - row) * HALF_W;
      const sy = (col + row) * HALF_H;

      if (h > 0) {
        const top = `${sx},${sy - h} ${sx + HALF_W},${sy - h + HALF_H} ${sx},${sy - h + TILE_H} ${sx - HALF_W},${sy - h + HALF_H}`;
        const left = `${sx - HALF_W},${sy - h + HALF_H} ${sx - HALF_W},${sy + HALF_H} ${sx},${sy + TILE_H} ${sx},${sy - h + TILE_H}`;
        const right = `${sx},${sy - h + TILE_H} ${sx},${sy + TILE_H} ${sx + HALF_W},${sy + HALF_H} ${sx + HALF_W},${sy - h + HALF_H}`;
        polygons += `<polygon points="${top}" fill="${colors[0]}"/><polygon points="${left}" fill="${colors[1]}"/><polygon points="${right}" fill="${colors[2]}"/>`;
      }
    }
  }

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewX} ${viewY} ${viewW} ${viewH}" width="100%">
  <defs>
    <style>
      .label { fill: #8b949e; font-family: monospace; font-size: 11px; text-anchor: middle; }
    </style>
  </defs>
  <rect x="${viewX}" y="${viewY}" width="${viewW}" height="${viewH}" fill="#0d1117" rx="12"/>
  ${polygons}`;

  if (source === 'leetcode') {
    svg += `\n  <text x="${centerX}" y="${labelY}" class="label">${lcTotal} LeetCode submissions in the last year</text>`;
  } else if (source === 'github') {
    svg += `\n  <text x="${centerX}" y="${labelY}" class="label">${ghTotal} contributions in the last year</text>`;
  } else {
    svg += `\n  <text x="${centerX}" y="${labelY}" class="label">${totalContributions} contributions in the last year</text>`;
    if (lcTotal > 0) {
      svg += `\n  <text x="${centerX}" y="${labelY + 16}" class="label">+ ${lcTotal} LeetCode submissions</text>`;
    }
  }

  svg += `\n</svg>`;
  return svg;
}
