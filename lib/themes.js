const BG_TIER_0 = ['#161b22', '#0d1117', '#0d1117'];

export const THEMES = {
  green: [
    BG_TIER_0,
    ['#0e4429', '#033a20', '#022b18'],
    ['#006d32', '#005626', '#00421d'],
    ['#26a641', '#1a8a32', '#126825'],
    ['#39d353', '#28b340', '#1e9130'],
  ],
  nike: [
    ['#f5f5f5', '#e5e5e5', '#cacacb'],
    ['#9e9ea0', '#707072', '#4b4b4d'],
    ['#4b4b4d', '#39393b', '#111111'],
    ['#39393b', '#111111', '#000000'],
    ['#111111', '#000000', '#000000'],
  ],
  blue: [
    BG_TIER_0,
    ['#0a2a4a', '#07203a', '#05172b'],
    ['#1c6fb5', '#145994', '#0e4370'],
    ['#3b8fd4', '#2e78be', '#1f60a0'],
    ['#58a6ff', '#468de0', '#3575c0'],
  ],
  purple: [
    BG_TIER_0,
    ['#1c0a3a', '#15072b', '#0e051f'],
    ['#5a2ca0', '#482385', '#361b68'],
    ['#8551d6', '#6e3dbe', '#582da0'],
    ['#a371f7', '#8b5ddf', '#7348c5'],
  ],
  orange: [
    BG_TIER_0,
    ['#3a1c0a', '#2b1507', '#1f0e05'],
    ['#a05a2c', '#854823', '#68361b'],
    ['#d68551', '#be6e3d', '#a0582d'],
    ['#f78166', '#df6b4e', '#c55538'],
  ],
  red: [
    BG_TIER_0,
    ['#3a0a0a', '#2b0707', '#1f0505'],
    ['#a02c2c', '#852323', '#681b1b'],
    ['#d65151', '#be3d3d', '#a02d2d'],
    ['#ff7b72', '#e0645c', '#c04d46'],
  ],
  pink: [
    BG_TIER_0,
    ['#3a0a25', '#2b071c', '#1f0514'],
    ['#a02c78', '#852361', '#681b4b'],
    ['#d651a0', '#be3d8b', '#a02d73'],
    ['#f778ba', '#e060a2', '#c0488a'],
  ],
  mono: [
    BG_TIER_0,
    ['#30363d', '#21262d', '#161b22'],
    ['#6e7681', '#585e66', '#42484f'],
    ['#afb6c2', '#959da8', '#7c8490'],
    ['#e6edf3', '#d0d7e2', '#b8bfcb'],
  ],
  dracula: [
    BG_TIER_0,
    ['#2d1f3d', '#22172e', '#1a1022'],
    ['#5a3780', '#472966', '#371e50'],
    ['#8b5cf0', '#7545d8', '#5f32be'],
    ['#50fa7b', '#3dd466', '#2aad50'],
  ],
};

function hexToHsl(hex) {
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  };
  const toHex = x => Math.round(Math.max(0, Math.min(255, x * 255))).toString(16).padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

function deriveRamp(hex) {
  const clean = hex.replace('#', '');
  const { h, s, l } = hexToHsl(clean);
  const ramp = [BG_TIER_0];
  for (let tier = 1; tier <= 4; tier++) {
    const factor = tier / 4;
    const topL = 12 + (l - 12) * factor;
    const leftL = topL * 0.7;
    const rightL = topL * 0.5;
    ramp.push([
      hslToHex(h, s, topL),
      hslToHex(h, s, leftL),
      hslToHex(h, s, rightL),
    ]);
  }
  return ramp;
}

export function getTheme(name, customColor) {
  if (name === 'custom' && customColor) {
    return deriveRamp(customColor);
  }
  return THEMES[name] || THEMES.green;
}
