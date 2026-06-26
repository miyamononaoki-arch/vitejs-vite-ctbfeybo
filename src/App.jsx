import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';

const T = {
  ink: '#42382B',
  inkSoft: '#8A7A62',
  line: '#DCCDA8',
  red: '#CF5240',
  blue: '#4C6E8C',
  coral: '#D67259',
  gold: '#E3A53A',
  leaf: '#7D9E5C',
  pink: '#D98BA0',
};
const MEMBER_PALETTE = [
  { key: 'red', label: '赤', color: '#CF5240' },
  { key: 'orange', label: 'オレンジ', color: '#E08A3C' },
  { key: 'yellow', label: '黄', color: '#E0B330' },
  { key: 'green', label: '緑', color: '#7D9E5C' },
  { key: 'teal', label: '水色', color: '#4FA3A0' },
  { key: 'blue', label: '青', color: '#4C6E8C' },
  { key: 'purple', label: '紫', color: '#8E72B0' },
  { key: 'pink', label: 'ピンク', color: '#D87298' },
  { key: 'brown', label: '茶', color: '#9A7B53' },
];
const F_HAND =
  "'Klee One','Hiragino Maru Gothic ProN','ヒラギノ丸ゴ ProN','Yu Gothic',sans-serif";
const F_TITLE = "'Klee One','Hiragino Maru Gothic ProN','Yu Gothic',sans-serif";
const F_PEN = "'Caveat','Dancing Script','Klee One',cursive";
const SR = '230px 14px 200px 18px / 16px 210px 14px 240px';
const SR2 = '14px 220px 16px 230px / 220px 14px 200px 16px';
const SR3 = '120px 12px 110px 14px / 12px 120px 14px 110px';
const h2r = (h) => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const r2h = (a) =>
  '#' +
  a
    .map((x) =>
      Math.max(0, Math.min(255, Math.round(x)))
        .toString(16)
        .padStart(2, '0')
    )
    .join('');
const mix = (a, b, t) => {
  const A = h2r(a),
    B = h2r(b);
  return r2h([0, 1, 2].map((i) => A[i] + (B[i] - A[i]) * t));
};
const lum = (hex) => {
  const [r, g, b] = h2r(hex).map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const onColor = (hex) => (lum(hex) > 0.62 ? T.ink : '#fff');
const onColor2 = onColor;
const inkOf = (hex) => (lum(hex) > 0.62 ? mix(hex, '#3a2f22', 0.42) : hex);
const PAPER_TYPES = {
  whiteRough: {
    label: '白いザラザラ',
    card: '#FAF6EC',
    grain: true,
    sheen: false,
  },
  mutedRough: {
    label: 'くすんだザラザラ',
    card: '#ECE2C7',
    grain: true,
    sheen: false,
  },
  smoothWhite: {
    label: 'ツルツルの白',
    card: '#FCFBF7',
    grain: false,
    sheen: true,
  },
  mutedWhite: {
    label: 'くすんだ白',
    card: '#F0E9D8',
    grain: false,
    sheen: false,
  },
};
const TINTS = {
  none: { label: 'なし', color: null, swatch: '#FBF7EF' },
  red: { label: '赤', color: '#DF9A8B', swatch: '#EBB7AB' },
  orange: { label: 'オレンジ', color: '#E5BA84', swatch: '#EFCC9E' },
  yellow: { label: '黄', color: '#E4D086', swatch: '#EFE2AE' },
  green: { label: '緑', color: '#AEC795', swatch: '#C4D6AE' },
  mint: { label: 'ミント', color: '#9FD3C2', swatch: '#BFE2D6' },
  blue: { label: '青', color: '#9FBBD3', swatch: '#B7CEDF' },
  purple: { label: '紫', color: '#C2A8D6', swatch: '#D6C2E6' },
  pink: { label: 'ピンク', color: '#E2A6BE', swatch: '#EFC4D4' },
};
function buildPaper(p) {
  const pt = PAPER_TYPES[p?.type] || PAPER_TYPES.whiteRough;
  const tint = TINTS[p?.tint]?.color;
  const card = tint ? mix(pt.card, tint, 0.17) : pt.card;
  return {
    card,
    deep: mix(card, '#000', 0.08),
    line: mix(card, '#7a6a4a', 0.3),
    grain: pt.grain,
    sheen: pt.sheen,
  };
}
const paperOf = (m) => buildPaper(m?.paper);
const GRAIN =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='160' height='160' filter='url(#n)' opacity='0.55'/></svg>`
  );
function surface(color, { grain = true, sheen = false } = {}) {
  const imgs = [
    'radial-gradient(130% 120% at 50% -10%, #ffffff99, #00000000 55%)',
  ];
  const blends = ['soft-light'];
  const sizes = ['auto'];
  if (sheen) {
    imgs.push('linear-gradient(115deg,#ffffff66,#ffffff00 42%)');
    blends.push('soft-light');
    sizes.push('auto');
  }
  if (grain) {
    imgs.push(`url("${GRAIN}")`);
    blends.push('multiply');
    sizes.push('160px 160px');
  }
  return {
    backgroundColor: color,
    backgroundImage: imgs.join(','),
    backgroundBlendMode: blends.join(','),
    backgroundSize: sizes.join(','),
  };
}
const surfP = (pp) => surface(pp.card, { grain: pp.grain, sheen: pp.sheen });
const ruledP = (pp) =>
  `repeating-linear-gradient(${pp.line}99 0 1.4px, transparent 1.4px 2.15em)`;
const THEMES = {
  simpleWhite: {
    label: 'シンプルな白',
    bg: { background: '#F3F1EA' },
    text: '#3A3329',
    textSoft: '#8A7E6B',
    line: '#E1DAC9',
    chrome: 'rgba(243,241,234,.86)',
    dark: false,
    ambient: 'none',
  },
  drawingPaper: {
    label: 'ザラザラ画用紙',
    bg: surface('#E7DCC4', { grain: true }),
    text: '#43382A',
    textSoft: '#8C7B62',
    line: '#D7C7A2',
    chrome: 'rgba(231,220,196,.85)',
    dark: false,
    ambient: 'none',
  },
  sky: {
    label: '空',
    bg: {
      background: 'linear-gradient(180deg,#A9D5EF 0%,#D5ECF7 55%,#EEF7FB 100%)',
    },
    text: '#2C4A5C',
    textSoft: '#5C7B8D',
    line: '#BBDAEA',
    chrome: 'rgba(206,235,249,.8)',
    dark: false,
    ambient: 'sky',
  },
  sea: {
    label: '海',
    bg: {
      background: 'linear-gradient(180deg,#BDE6E1 0%,#7FC0C4 45%,#3E8BA6 100%)',
    },
    text: '#14414B',
    textSoft: '#3A6D77',
    line: '#9AD0CF',
    chrome: 'rgba(150,205,205,.82)',
    dark: false,
    ambient: 'sea',
  },
  space: {
    label: '宇宙',
    bg: {
      background:
        'radial-gradient(120% 90% at 50% -5%,#2C2B57 0%,#1B1B38 45%,#0E0E22 100%)',
    },
    text: '#E9E6F7',
    textSoft: '#A9A4CE',
    line: '#3A3868',
    chrome: 'rgba(20,20,42,.62)',
    dark: true,
    ambient: 'space',
  },
  future: {
    label: '未来',
    bg: {
      background: 'linear-gradient(160deg,#0E1626 0%,#142338 55%,#0C1A26 100%)',
    },
    text: '#DCEFF6',
    textSoft: '#7FA9C2',
    line: '#1F3A52',
    accent: '#39D5E0',
    chrome: 'rgba(12,22,38,.62)',
    dark: true,
    ambient: 'future',
  },
  meadow: {
    label: '草原',
    bg: {
      background:
        'linear-gradient(180deg,#CDE8F4 0%,#DCEFC6 38%,#A8D183 70%,#8CC069 100%)',
    },
    text: '#33502E',
    textSoft: '#5C7C4E',
    line: '#B6D49A',
    chrome: 'rgba(196,224,176,.82)',
    dark: false,
    ambient: 'meadow',
  },
};
let THM = THEMES.drawingPaper;
const PANEL_C = '#FBF8F1',
  PANEL_LINE = '#E3D8BF';
const PANEL = () => surface(PANEL_C, { grain: true });
const WD = ['日', '月', '火', '水', '木', '金', '土'];
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(d.getDate()).padStart(2, '0')}`;
};
const fmtDate = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  const wd = WD[new Date(y, m - 1, d).getDay()];
  return { full: `${m}月${d}日（${wd}）`, my: `${y}年 ${m}月`, m, d, wd };
};
const uid = () =>
  Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
const circled = (n) =>
  n >= 1 && n <= 20 ? String.fromCharCode(0x245f + n) : `${n}`;
function fileToDataURL(file, maxDim = 820, q = 0.74) {
  return new Promise((res, rej) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let { width: w, height: h } = img;
      const s = Math.min(1, maxDim / Math.max(w, h));
      w = Math.round(w * s);
      h = Math.round(h * s);
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      res(c.toDataURL('image/jpeg', q));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      rej(new Error('no'));
    };
    img.src = url;
  });
}
function useInView() {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      (es) => {
        es.forEach((e) => {
          if (e.isIntersecting) {
            setSeen(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -7% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, seen];
}
function Doodle({ name, size = 30, color, rot = 0, style }) {
  const s = {
    width: size,
    height: size,
    display: 'block',
    transform: `rotate(${rot}deg)`,
    ...style,
  };
  const sw = 2.3,
    lc = 'round',
    lj = 'round';
  switch (name) {
    case 'sun': {
      const c = color || T.gold;
      return (
        <svg viewBox="0 0 40 40" style={s}>
          <circle
            cx="20"
            cy="20"
            r="7.5"
            fill="#F4D783"
            stroke={c}
            strokeWidth={sw}
          />
          {[...Array(8)].map((_, i) => {
            const a = (i * Math.PI) / 4;
            return (
              <line
                key={i}
                x1={20 + Math.cos(a) * 11}
                y1={20 + Math.sin(a) * 11}
                x2={20 + Math.cos(a) * 16.5}
                y2={20 + Math.sin(a) * 16.5}
                stroke={c}
                strokeWidth={sw}
                strokeLinecap={lc}
              />
            );
          })}
        </svg>
      );
    }
    case 'cloud':
      return (
        <svg viewBox="0 0 40 40" style={s}>
          <path
            d="M11 27 a6 6 0 0 1 1-12 a8 8 0 0 1 16 1 a6 6 0 0 1 1 11 z"
            fill="#EFF3F6"
            stroke={color || '#9CB1BF'}
            strokeWidth={sw}
            strokeLinejoin={lj}
          />
        </svg>
      );
    case 'rain':
      return (
        <svg viewBox="0 0 40 40" style={s}>
          <path
            d="M11 22 a6 6 0 0 1 1-12 a8 8 0 0 1 16 1 a6 6 0 0 1 1 11 z"
            fill="#E8EFF4"
            stroke="#8AA6BE"
            strokeWidth={sw}
            strokeLinejoin={lj}
          />
          {[13, 20, 27].map((x, i) => (
            <line
              key={i}
              x1={x}
              y1="27"
              x2={x - 2}
              y2="34"
              stroke="#6C92C0"
              strokeWidth={sw}
              strokeLinecap={lc}
            />
          ))}
        </svg>
      );
    case 'snow':
      return (
        <svg viewBox="0 0 40 40" style={s}>
          <path
            d="M11 22 a6 6 0 0 1 1-12 a8 8 0 0 1 16 1 a6 6 0 0 1 1 11 z"
            fill="#F1F6F9"
            stroke="#A9BCC9"
            strokeWidth={sw}
            strokeLinejoin={lj}
          />
          {[
            [13, 32],
            [20, 34],
            [27, 32],
          ].map(([x, y], i) => (
            <text
              key={i}
              x={x}
              y={y}
              fontSize="9"
              fill="#86A6C2"
              textAnchor="middle"
            >
              ✻
            </text>
          ))}
        </svg>
      );
    case 'star': {
      const c = color || T.gold;
      return (
        <svg viewBox="0 0 40 40" style={s}>
          <path
            d="M20 5 L24 15 L35 16 L26.5 23 L29.5 34 L20 28 L10.5 34 L13.5 23 L5 16 L16 15 Z"
            fill={style?.fill || 'none'}
            stroke={c}
            strokeWidth={sw}
            strokeLinejoin={lj}
            strokeLinecap={lc}
          />
        </svg>
      );
    }
    case 'heart': {
      const c = color || T.coral;
      return (
        <svg viewBox="0 0 40 40" style={s}>
          <path
            d="M20 33 C5 23 7 11 14 11 C18 11 20 14.5 20 16.5 C20 14.5 22 11 26 11 C33 11 35 23 20 33 Z"
            fill={style?.fill || 'none'}
            stroke={c}
            strokeWidth={sw}
            strokeLinejoin={lj}
          />
        </svg>
      );
    }
    case 'flower': {
      const c = color || T.pink;
      return (
        <svg viewBox="0 0 40 40" style={s}>
          {[...Array(5)].map((_, i) => {
            const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
            return (
              <ellipse
                key={i}
                cx={20 + Math.cos(a) * 8}
                cy={20 + Math.sin(a) * 8}
                rx="5.5"
                ry="7"
                fill="none"
                stroke={c}
                strokeWidth={sw}
                transform={`rotate(${(a * 180) / Math.PI + 90} ${
                  20 + Math.cos(a) * 8
                } ${20 + Math.sin(a) * 8})`}
              />
            );
          })}
          <circle
            cx="20"
            cy="20"
            r="3.6"
            fill={T.gold}
            stroke={c}
            strokeWidth="1.6"
          />
        </svg>
      );
    }
    case 'note': {
      const c = color || T.blue;
      return (
        <svg viewBox="0 0 40 40" style={s}>
          <path
            d="M16 28 V12 l11 -3 V25"
            fill="none"
            stroke={c}
            strokeWidth={sw}
            strokeLinecap={lc}
            strokeLinejoin={lj}
          />
          <ellipse cx="13" cy="28" rx="4" ry="3" fill={c} />
          <ellipse cx="24" cy="25" rx="4" ry="3" fill={c} />
        </svg>
      );
    }
    case 'sparkle': {
      const c = color || T.gold;
      return (
        <svg viewBox="0 0 40 40" style={s}>
          <path
            d="M20 6 C21 15 25 19 34 20 C25 21 21 25 20 34 C19 25 15 21 6 20 C15 19 19 15 20 6 Z"
            fill={c}
            opacity="0.85"
          />
        </svg>
      );
    }
    case 'leaf': {
      const c = color || T.leaf;
      return (
        <svg viewBox="0 0 40 40" style={s}>
          <path
            d="M10 30 C10 14 26 10 30 10 C30 14 26 30 10 30 Z M14 26 L26 14"
            fill="none"
            stroke={c}
            strokeWidth={sw}
            strokeLinejoin={lj}
            strokeLinecap={lc}
          />
        </svg>
      );
    }
    case 'palette':
      return (
        <svg viewBox="0 0 40 40" style={s}>
          <path
            d="M20 7 C30 7 35 14 35 21 C35 27 30 28 27 28 C24 28 24 31 25 33 C26 35 24 35 21 35 C12 35 5 29 5 20 C5 12 11 7 20 7 Z"
            fill="none"
            stroke={color || T.ink}
            strokeWidth="2"
          />
          <circle cx="14" cy="16" r="2.4" fill={T.coral} />
          <circle cx="21" cy="13" r="2.4" fill={T.gold} />
          <circle cx="27" cy="17" r="2.4" fill={T.blue} />
          <circle cx="14" cy="24" r="2.4" fill={T.leaf} />
        </svg>
      );
    case 'people':
      return (
        <svg viewBox="0 0 40 40" style={s}>
          <circle
            cx="14"
            cy="15"
            r="5"
            fill="none"
            stroke={color || T.ink}
            strokeWidth="2"
          />
          <circle
            cx="27"
            cy="17"
            r="4"
            fill="none"
            stroke={color || T.ink}
            strokeWidth="2"
          />
          <path
            d="M6 32 c0-6 5-9 8-9 c3 0 8 3 8 9"
            fill="none"
            stroke={color || T.ink}
            strokeWidth="2"
            strokeLinecap={lc}
          />
          <path
            d="M22 32 c0-5 4-8 5-8 c3 0 7 3 7 8"
            fill="none"
            stroke={color || T.ink}
            strokeWidth="2"
            strokeLinecap={lc}
          />
        </svg>
      );
    case 'book':
      return (
        <svg viewBox="0 0 40 40" style={s}>
          <path
            d="M20 11 C16 8 9 8 7 9 V31 C9 30 16 30 20 33 C24 30 31 30 33 31 V9 C31 8 24 8 20 11 Z M20 11 V33"
            fill="none"
            stroke={color || T.ink}
            strokeWidth="2"
            strokeLinejoin={lj}
          />
        </svg>
      );
    case 'check': {
      const c = color || T.leaf;
      return (
        <svg viewBox="0 0 40 40" style={s}>
          <circle
            cx="20"
            cy="20"
            r="15"
            fill="none"
            stroke={c}
            strokeWidth="2"
            strokeDasharray="2 3"
          />
          <path
            d="M13 21 l5 5 l9 -12"
            fill="none"
            stroke={c}
            strokeWidth="3"
            strokeLinecap={lc}
            strokeLinejoin={lj}
          />
        </svg>
      );
    }
    default:
      return null;
  }
}
const WEATHERS = [
  ['晴れ', 'sun'],
  ['曇り', 'cloud'],
  ['雨', 'rain'],
  ['雪', 'snow'],
];
const weatherDoodle = (w) =>
  ({ 晴れ: 'sun', 曇り: 'cloud', 雨: 'rain', 雪: 'snow' }[w] || 'sun');
function Squiggle({ color = T.coral, h = 10 }) {
  return (
    <svg
      viewBox="0 0 300 12"
      preserveAspectRatio="none"
      style={{ width: '100%', height: h, display: 'block' }}
    >
      <path
        d="M2 7 q12 -7 24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0"
        fill="none"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
function Corners() {
  const tri = (pos) => (
    <span
      style={{
        position: 'absolute',
        width: 16,
        height: 16,
        background: `linear-gradient(135deg,${T.ink}cc 0 50%,transparent 50%)`,
        opacity: 0.55,
        ...pos,
      }}
    />
  );
  return (
    <>
      {tri({ top: -1, left: -1 })}
      {tri({ top: -1, right: -1, transform: 'rotate(90deg)' })}
      {tri({ bottom: -1, right: -1, transform: 'rotate(180deg)' })}
      {tri({ bottom: -1, left: -1, transform: 'rotate(270deg)' })}
    </>
  );
}
function Tape({ color = T.coral, w = 58, rot = -4, style }) {
  return (
    <span
      style={{
        position: 'absolute',
        width: w,
        height: 18,
        background: `repeating-linear-gradient(45deg,${color}55 0 5px,${color}2e 5px 10px)`,
        boxShadow: '0 1px 2px #0001',
        transform: `rotate(${rot}deg)`,
        borderRadius: 1,
        ...style,
      }}
    />
  );
}
function CloudWhite({ size = 100, style }) {
  return (
    <svg
      viewBox="0 0 120 60"
      style={{ width: size, height: size * 0.5, ...style }}
    >
      <path
        d="M18 50 a16 16 0 0 1 2-30 a22 22 0 0 1 42 2 a16 16 0 0 1 4 28 z"
        fill="#fff"
        opacity="0.85"
      />
    </svg>
  );
}
function Moon() {
  return (
    <svg viewBox="0 0 60 60" style={{ width: 52, height: 52 }}>
      <path
        d="M40 8 a24 24 0 1 0 12 40 a20 20 0 0 1-12-40 z"
        fill="#F3EFC4"
        opacity="0.9"
      />
    </svg>
  );
}
const STARS = [...Array(48)].map((_, i) => ({
  x: (i * 97 + 13) % 100,
  y: (i * 61 + 7) % 96,
  r: i % 4 ? 1 : 2,
  o: 0.35 + (i % 5) * 0.12,
}));
function ThemeBackdrop({ theme }) {
  const a = THEMES[theme]?.ambient || 'none';
  const wrap = {
    position: 'fixed',
    inset: 0,
    zIndex: 0,
    pointerEvents: 'none',
    overflow: 'hidden',
  };
  if (a === 'none') return null;
  if (a === 'sky')
    return (
      <div style={wrap}>
        <span style={{ position: 'absolute', top: 28, right: 32 }}>
          <Doodle name="sun" size={62} color="#F2C657" />
        </span>
        {[
          [4, 14, 150, 0.85],
          [58, 30, 190, 0.8],
          [26, 58, 120, 0.75],
          [72, 66, 130, 0.7],
        ].map(([l, t, s, o], i) => (
          <CloudWhite
            key={i}
            size={s}
            style={{
              position: 'absolute',
              left: `${l}%`,
              top: `${t}%`,
              opacity: o,
            }}
          />
        ))}
      </div>
    );
  if (a === 'sea')
    return (
      <div style={wrap}>
        {[...Array(7)].map((_, i) => (
          <span
            key={i}
            style={{
              position: 'absolute',
              left: `${(i * 61 + 12) % 92}%`,
              top: `${(i * 43 + 30) % 70}%`,
              width: 6 + (i % 3) * 4,
              height: 6 + (i % 3) * 4,
              border: '2px solid #ffffff55',
              borderRadius: '50%',
            }}
          />
        ))}
        <svg
          viewBox="0 0 400 120"
          preserveAspectRatio="none"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: 170,
            opacity: 0.55,
          }}
        >
          <path
            d="M0 60 q50-28 100 0 t100 0 t100 0 t100 0 V120 H0Z"
            fill="#ffffff35"
          />
          <path
            d="M0 82 q50-24 100 0 t100 0 t100 0 t100 0 V120 H0Z"
            fill="#ffffff4d"
          />
        </svg>
      </div>
    );
  if (a === 'space')
    return (
      <div style={wrap}>
        {STARS.map((s, i) => (
          <span
            key={i}
            style={{
              position: 'absolute',
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.r * 2,
              height: s.r * 2,
              borderRadius: '50%',
              background: '#fff',
              opacity: s.o,
              boxShadow: '0 0 5px #ffffffaa',
            }}
          />
        ))}
        <span style={{ position: 'absolute', top: 30, right: 34 }}>
          <Moon />
        </span>
      </div>
    );
  if (a === 'future')
    return (
      <div style={wrap}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(#39D5E01f 1px,transparent 1px),linear-gradient(90deg,#39D5E01f 1px,transparent 1px)',
            backgroundSize: '44px 44px',
            WebkitMaskImage: 'linear-gradient(180deg,transparent,#000 55%)',
            maskImage: 'linear-gradient(180deg,transparent,#000 55%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '28%',
            left: 0,
            right: 0,
            height: 1,
            background: '#39D5E0',
            boxShadow: '0 0 18px #39D5E0',
          }}
        />
      </div>
    );
  if (a === 'meadow')
    return (
      <div style={wrap}>
        <span style={{ position: 'absolute', top: 26, left: 30 }}>
          <Doodle name="sun" size={54} color="#F2C657" />
        </span>
        <svg
          viewBox="0 0 400 80"
          preserveAspectRatio="none"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: 96,
            opacity: 0.7,
          }}
        >
          {[...Array(26)].map((_, i) => {
            const x = i * 16 + 4;
            return (
              <path
                key={i}
                d={`M${x} 80 Q${x + (i % 2 ? 6 : -6)} 50 ${
                  x + (i % 2 ? 2 : -2)
                } 28`}
                fill="none"
                stroke="#5E9B45"
                strokeWidth="3"
                strokeLinecap="round"
              />
            );
          })}
        </svg>
      </div>
    );
  return null;
}

export default function App() {
  const [authLoading, setAuthLoading] = useState(true);
  const [authUser, setAuthUser] = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [members, setMembers] = useState([]);
  const [entries, setEntries] = useState([]);
  const [photos, setPhotos] = useState({});
  const [theme, setThemeState] = useState('drawingPaper');
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState('all');
  const [view, setView] = useState('timeline');
  const [openId, setOpenId] = useState(null);
  const [composing, setComposing] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [comments, setComments] = useState([]);
  const [notice, setNotice] = useState('');
  THM = THEMES[theme] || THEMES.drawingPaper;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthUser(session?.user || null);
      setAuthLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setAuthUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!authUser) return;
    try {
      const th = localStorage.getItem('diary:theme');
      if (th && THEMES[th]) setThemeState(th);
    } catch {}
    try {
      const gs = localStorage.getItem('diary:groups');
      if (gs) setGroups(JSON.parse(gs));
    } catch {}
    loadAll();
    const ch = supabase
      .channel('rt')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'entries' },
        loadEntries
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => loadProfiles()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments' },
        loadComments
      )
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [authUser]);

  const loadAll = async () => {
    await Promise.all([loadProfiles(), loadEntries(), loadComments()]);
  };

  async function loadComments() {
    const { data } = await supabase
      .from('comments')
      .select('*')
      .order('created_at', { ascending: true });
    if (data) setComments(data);
  }

  async function addComment({ entryId, text }) {
    if (!currentProfile) return;
    const { error } = await supabase.from('comments').insert([
      {
        id: uid(),
        entry_id: entryId,
        author_id: authUser.id,
        author_name: currentProfile.name,
        text: text.trim().slice(0, 100),
        created_at: Date.now(),
      },
    ]);
    if (error) {
      setNotice('コメントエラー: ' + error.message);
      return;
    }
    await loadComments();
  }

  async function updateComment(id, text) {
    await supabase
      .from('comments')
      .update({ text: text.trim().slice(0, 100) })
      .eq('id', id);
    await loadComments();
  }

  async function deleteComment(id) {
    await supabase.from('comments').delete().eq('id', id);
    await loadComments();
  }

  async function loadProfiles() {
    const { data } = await supabase.from('profiles').select('*');
    if (!data) return;
    const mems = data.map((p) => ({
      id: p.id,
      name: p.name,
      color: p.color,
      paper: { type: p.paper_type, tint: p.paper_tint },
    }));
    setMembers(mems);
    setCurrentProfile(mems.find((m) => m.id === authUser?.id) || null);
  }

  async function loadEntries() {
    const { data } = await supabase
      .from('entries')
      .select('*')
      .order('created_at', { ascending: false });
    if (!data) return;
    setEntries(
      data.map((e) => ({ ...e, authorId: e.author_id, hasPhoto: !!e.photo }))
    );
    const pm = {};
    data.forEach((e) => {
      if (e.photo) pm[e.id] = e.photo;
    });
    setPhotos(pm);
  }

  async function addEntry({ authorId, weather, title, text, photoData }) {
    const id = uid();
    const { error } = await supabase.from('entries').insert([
      {
        id,
        author_id: authorId,
        author_name: currentProfile.name,
        date: todayStr(),
        weather,
        title: title.trim() || '無題',
        text,
        photo: photoData || null,
        created_at: Date.now(),
      },
    ]);
    if (error) {
      setNotice('保存エラー: ' + error.message);
      return;
    }
    await loadEntries();
    setComposing(false);
    setOpenId(id);
  }

  async function removeEntry(id) {
    await supabase.from('entries').delete().eq('id', id);
    await loadEntries();
    setOpenId(null);
  }

  async function updateEntry({ id, weather, title, text, photoData }) {
    const { error } = await supabase
      .from('entries')
      .update({
        weather,
        title: title.trim() || '無題',
        text,
        photo: photoData || null,
      })
      .eq('id', id);
    if (error) {
      setNotice('保存エラー: ' + error.message);
      return;
    }
    await loadEntries();
    setComposing(false);
    setEditTarget(null);
    setOpenId(id);
  }

  async function updateMemberPaper(id, patch) {
    if (id !== authUser?.id) return;
    const u = {};
    if (patch.type !== undefined) u.paper_type = patch.type;
    if (patch.tint !== undefined) u.paper_tint = patch.tint;
    await supabase.from('profiles').update(u).eq('id', id);
    await loadProfiles();
  }

  async function updateMemberColor(id, color) {
    if (id !== authUser?.id) return;
    await supabase.from('profiles').update({ color }).eq('id', id);
    await loadProfiles();
  }

  const setTheme = (t) => {
    setThemeState(t);
    try {
      localStorage.setItem('diary:theme', t);
    } catch {}
  };
  const logout = () => supabase.auth.signOut();
  const saveGroups = (gs) => {
    setGroups(gs);
    try {
      localStorage.setItem('diary:groups', JSON.stringify(gs));
    } catch {}
  };
  const addGroup = () =>
    saveGroups([
      ...groups,
      {
        id: uid(),
        name: `グループ${circled(groups.length + 1)}`,
        memberIds: [],
      },
    ]);
  const renameGroup = (id, name) =>
    saveGroups(groups.map((g) => (g.id === id ? { ...g, name } : g)));
  const removeGroup = (id) => {
    saveGroups(groups.filter((g) => g.id !== id));
    if (activeGroup === id) setActiveGroup('all');
  };
  const toggleGroupMember = (gid, mid) =>
    saveGroups(
      groups.map((g) =>
        g.id !== gid
          ? g
          : {
              ...g,
              memberIds: g.memberIds.includes(mid)
                ? g.memberIds.filter((x) => x !== mid)
                : [...g.memberIds, mid],
            }
      )
    );
  async function requestNotify() {
    if (!('Notification' in window)) {
      setNotice('この環境では通知を使えません。');
      return;
    }
    const p = await Notification.requestPermission();
    setNotice(
      p === 'granted' ? '通知をオンにしました。' : '通知はオフのままです。'
    );
  }

  const memberById = (id) =>
    members.find((m) => m.id === id) || { name: '？', color: '#999' };
  const sideOf = (authorId) =>
    members.findIndex((m) => m.id === authorId) % 2 === 0 ? 'left' : 'right';
  const openEntry = entries.find((e) => e.id === openId);
  const activeG = groups.find((g) => g.id === activeGroup);
  const visibleEntries = activeG
    ? entries.filter((e) => activeG.memberIds.includes(e.authorId))
    : entries;
  const pendingMembers = members.filter(
    (m) => !entries.some((e) => e.date === todayStr() && e.authorId === m.id)
  );
  const someoneWroteToday = entries.some((e) => e.date === todayStr());

  if (authLoading)
    return (
      <div
        style={{
          minHeight: '100vh',
          ...THEMES.drawingPaper.bg,
          display: 'grid',
          placeItems: 'center',
          fontFamily: F_HAND,
          color: T.inkSoft,
        }}
      >
        開いています…
      </div>
    );
  if (!authUser) return <AuthScreen theme={theme} />;
  if (!currentProfile)
    return (
      <ProfileSetup authUser={authUser} onComplete={loadAll} theme={theme} />
    );

  return (
    <div
      style={{
        minHeight: '100vh',
        position: 'relative',
        ...THM.bg,
        color: THM.text,
        fontFamily: F_HAND,
      }}
    >
      <style>{css}</style>
      <ThemeBackdrop theme={theme} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 20,
            background: THM.chrome,
            backdropFilter: 'blur(6px)',
            borderBottom: `1.5px solid ${THM.line}`,
          }}
        >
          <div
            style={{
              maxWidth: 640,
              margin: '0 auto',
              padding: '12px 18px 8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Doodle
                name="star"
                size={24}
                rot={-8}
                color={THM.dark ? '#F2D27A' : T.gold}
                style={{ marginBottom: 8 }}
              />
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    fontFamily: F_PEN,
                    fontSize: 42,
                    fontWeight: 700,
                    lineHeight: 0.8,
                    letterSpacing: 0.5,
                    color: THM.text,
                    transform: 'rotate(-2.5deg)',
                  }}
                >
                  our memory
                </div>
                <div
                  style={{
                    position: 'absolute',
                    left: 4,
                    right: -10,
                    bottom: -3,
                  }}
                >
                  <Squiggle color={THM.accent || T.coral} h={9} />
                </div>
              </div>
              <span
                style={{ fontSize: 11, color: THM.textSoft, marginTop: 16 }}
              >
                交換日記
              </span>
              <div style={{ marginLeft: 'auto' }}>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: PANEL_C,
                    border: `1.5px solid ${PANEL_LINE}`,
                    borderRadius: 999,
                    padding: '3px 5px 3px 4px',
                    boxShadow: '0 1px 4px #0002',
                  }}
                >
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: currentProfile.color,
                      color: onColor(currentProfile.color),
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 11,
                      fontFamily: F_TITLE,
                      fontWeight: 600,
                    }}
                  >
                    {currentProfile.name.slice(0, 1)}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: T.ink,
                      fontFamily: F_TITLE,
                      fontWeight: 600,
                    }}
                  >
                    {currentProfile.name}
                  </span>
                  <button
                    onClick={logout}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: T.inkSoft,
                      fontSize: 11,
                      cursor: 'pointer',
                      padding: '0 4px',
                    }}
                  >
                    ログアウト
                  </button>
                </span>
              </div>
            </div>
          </div>
          <div
            style={{
              maxWidth: 640,
              margin: '0 auto',
              padding: '4px 18px 10px',
            }}
          >
            <div
              style={{
                fontSize: 13,
                ...PANEL(),
                border: `1.5px solid ${PANEL_LINE}`,
                borderRadius: SR3,
                padding: '9px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                color: T.ink,
                boxShadow: '0 2px 8px #0000001a',
              }}
            >
              <Doodle
                name={someoneWroteToday ? 'sun' : 'cloud'}
                size={24}
                rot={-4}
              />
              <span style={{ color: T.inkSoft, flex: 1 }}>
                {pendingMembers.length === 0 ? (
                  '今日は全員ぶん揃いました。'
                ) : someoneWroteToday ? (
                  <>
                    届いています。
                    <b style={{ color: T.ink }}>
                      {pendingMembers.map((m) => m.name).join('・')}
                    </b>{' '}
                    の番。
                  </>
                ) : (
                  <>
                    <b style={{ color: T.ink }}>
                      {pendingMembers.map((m) => m.name).join('・')}
                    </b>{' '}
                    の番です。
                  </>
                )}
              </span>
              <button onClick={requestNotify} style={miniBtn}>
                22時通知
              </button>
            </div>
          </div>
        </header>
        <main
          style={{
            maxWidth: 640,
            margin: '0 auto',
            padding: '18px 14px 122px',
            position: 'relative',
          }}
        >
          {(view === 'timeline' || view === 'list') && groups.length > 0 && (
            <div
              style={{
                display: 'flex',
                gap: 8,
                overflowX: 'auto',
                paddingBottom: 12,
                marginBottom: 4,
              }}
            >
              {[{ id: 'all', name: 'すべて' }, ...groups].map((g) => {
                const sel = activeGroup === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => setActiveGroup(g.id)}
                    style={{
                      flexShrink: 0,
                      fontSize: 13,
                      padding: '6px 14px',
                      borderRadius: 999,
                      cursor: 'pointer',
                      border: `1.5px solid ${sel ? 'transparent' : THM.line}`,
                      fontFamily: F_TITLE,
                      background: sel ? THM.accent || T.leaf : THM.chrome,
                      color: sel
                        ? THM.dark
                          ? '#0E1626'
                          : '#fff'
                        : THM.textSoft,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {g.name}
                  </button>
                );
              })}
            </div>
          )}
          {view === 'timeline' && (
            <Timeline
              {...{
                entries: visibleEntries,
                photos,
                memberById,
                sideOf,
                onOpen: setOpenId,
              }}
            />
          )}
          {view === 'list' && (
            <ListView
              {...{
                entries: visibleEntries,
                photos,
                memberById,
                onOpen: setOpenId,
              }}
            />
          )}
          {view === 'members' && (
            <Members
              {...{
                members,
                entries,
                groups,
                addGroup,
                renameGroup,
                removeGroup,
                toggleGroupMember,
              }}
            />
          )}
          {view === 'design' && (
            <Design
              {...{
                theme,
                setTheme,
                members,
                updateMemberPaper,
                updateMemberColor,
                currentUserId: authUser?.id,
              }}
            />
          )}
        </main>
      </div>
      {notice && (
        <div
          onClick={() => setNotice('')}
          style={{
            position: 'fixed',
            bottom: 96,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            zIndex: 60,
            padding: '0 16px',
          }}
        >
          <div
            style={{
              maxWidth: 520,
              background: '#2a2117',
              color: '#fff',
              padding: '11px 16px',
              borderRadius: SR3,
              fontSize: 13,
              boxShadow: '0 8px 24px #0005',
              cursor: 'pointer',
            }}
          >
            {notice}
          </div>
        </div>
      )}
      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 30,
          background: THM.chrome,
          borderTop: `1.5px solid ${THM.line}`,
          backdropFilter: 'blur(6px)',
        }}
      >
        <div
          style={{
            maxWidth: 640,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1.15fr 1fr 1fr',
            alignItems: 'center',
            padding: '8px 12px 13px',
          }}
        >
          <NavBtn
            label="日記"
            active={view === 'timeline'}
            onClick={() => setView('timeline')}
            d="book"
          />
          <NavBtn
            label="一覧"
            active={view === 'list'}
            onClick={() => setView('list')}
            d="check"
          />
          <button
            onClick={() => {
              setEditTarget(null);
              setComposing(true);
            }}
            className="fab"
            style={{
              justifySelf: 'center',
              background: THM.accent || T.leaf,
              color: THM.dark ? '#0E1626' : '#fff',
              border: '3px solid #ffffffcc',
              width: 60,
              height: 60,
              borderRadius: '50%',
              fontFamily: F_TITLE,
              fontSize: 14,
              fontWeight: 600,
              boxShadow: '0 5px 16px #0004',
              marginTop: -22,
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            書く
          </button>
          <NavBtn
            label="メンバー"
            active={view === 'members'}
            onClick={() => setView('members')}
            d="people"
          />
          <NavBtn
            label="デザイン"
            active={view === 'design'}
            onClick={() => setView('design')}
            d="palette"
          />
        </div>
      </nav>
      {openEntry && (
        <DiaryModal
          entry={openEntry}
          photo={photos[openEntry.id]}
          member={memberById(openEntry.authorId)}
          canEdit={openEntry.author_id === authUser?.id}
          comments={comments.filter((c) => c.entry_id === openEntry.id)}
          currentUserId={authUser?.id}
          currentName={currentProfile?.name}
          memberById={memberById}
          onAddComment={(text) => addComment({ entryId: openEntry.id, text })}
          onUpdateComment={updateComment}
          onDeleteComment={deleteComment}
          onEdit={() => {
            setEditTarget({ ...openEntry, photo: photos[openEntry.id] });
            setOpenId(null);
            setComposing(true);
          }}
          onClose={() => setOpenId(null)}
          onDelete={() => removeEntry(openEntry.id)}
        />
      )}
      {composing && (
        <Compose
          author={currentProfile}
          editEntry={editTarget}
          prevEntryFor={(authorId) => {
            const prev = entries.find((e) => e.authorId !== authorId);
            return prev
              ? {
                  ...prev,
                  photo: photos[prev.id],
                  member: memberById(prev.authorId),
                }
              : null;
          }}
          onCancel={() => {
            setComposing(false);
            setEditTarget(null);
          }}
          onSubmit={addEntry}
          onUpdate={updateEntry}
          processImage={fileToDataURL}
        />
      )}
    </div>
  );
}

function AuthScreen({ theme }) {
  const th = THEMES[theme] || THEMES.drawingPaper;
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  async function handleSubmit() {
    if (!email || !password) {
      setMsg('メールアドレスとパスワードを入力してください。');
      return;
    }
    setLoading(true);
    setMsg('');
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error)
        setMsg(
          'ログインできませんでした。メールアドレスまたはパスワードが違います。'
        );
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setMsg('登録できませんでした: ' + error.message);
    }
    setLoading(false);
  }
  return (
    <div
      style={{
        minHeight: '100vh',
        position: 'relative',
        ...th.bg,
        color: th.text,
        fontFamily: F_HAND,
      }}
    >
      <style>{css}</style>
      <ThemeBackdrop theme={theme} />
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 20px',
        }}
      >
        <div style={{ position: 'relative', marginBottom: 28 }}>
          <div
            style={{
              fontFamily: F_PEN,
              fontSize: 52,
              fontWeight: 700,
              lineHeight: 0.8,
              color: th.text,
              transform: 'rotate(-2.5deg)',
            }}
          >
            our memory
          </div>
          <div style={{ position: 'absolute', left: 6, right: -6, bottom: -6 }}>
            <Squiggle color={th.accent || T.coral} h={10} />
          </div>
        </div>
        <div
          style={{
            width: 'min(380px,100%)',
            ...PANEL(),
            border: `1.5px solid ${PANEL_LINE}`,
            borderRadius: SR3,
            padding: 22,
            boxShadow: '0 8px 24px #0003',
          }}
        >
          <div
            style={{
              fontFamily: F_TITLE,
              fontWeight: 600,
              fontSize: 17,
              color: T.ink,
              marginBottom: 14,
            }}
          >
            {mode === 'login' ? 'ログイン' : 'アカウントを作る'}
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="メールアドレス"
            style={{
              border: `1.5px solid ${PANEL_LINE}`,
              borderRadius: SR3,
              padding: '12px 14px',
              fontSize: 15,
              fontFamily: F_HAND,
              outline: 'none',
              background: '#fff',
              width: '100%',
              boxSizing: 'border-box',
              marginBottom: 10,
            }}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="パスワード（6文字以上）"
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            style={{
              border: `1.5px solid ${PANEL_LINE}`,
              borderRadius: SR3,
              padding: '12px 14px',
              fontSize: 15,
              fontFamily: F_HAND,
              outline: 'none',
              background: '#fff',
              width: '100%',
              boxSizing: 'border-box',
              marginBottom: 12,
            }}
          />
          {msg && (
            <div
              style={{
                fontSize: 12.5,
                color: T.red,
                padding: '8px 10px',
                background: '#FDE8E8',
                borderRadius: 8,
                marginBottom: 10,
              }}
            >
              {msg}
            </div>
          )}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%',
              background: T.leaf,
              color: '#fff',
              border: 'none',
              borderRadius: SR3,
              padding: '14px',
              fontFamily: F_TITLE,
              fontWeight: 600,
              fontSize: 17,
              cursor: 'pointer',
              marginBottom: 10,
            }}
          >
            {loading ? '処理中…' : mode === 'login' ? 'ログイン' : '登録する'}
          </button>
          <button
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login');
              setMsg('');
            }}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              color: T.inkSoft,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {mode === 'login'
              ? 'アカウントをお持ちでない方はこちら →'
              : 'ログインはこちら →'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileSetup({ authUser, onComplete, theme }) {
  const th = THEMES[theme] || THEMES.drawingPaper;
  const [name, setName] = useState('');
  const [color, setColor] = useState(MEMBER_PALETTE[0].color);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  async function handleSubmit() {
    if (!name.trim()) {
      setError('名前を入力してください。');
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('profiles').insert([
      {
        id: authUser.id,
        name: name.trim(),
        color,
        paper_type: 'whiteRough',
        paper_tint: 'none',
      },
    ]);
    if (error) {
      setError('エラー: ' + error.message);
      setLoading(false);
      return;
    }
    await onComplete();
  }
  return (
    <div
      style={{
        minHeight: '100vh',
        position: 'relative',
        ...th.bg,
        color: th.text,
        fontFamily: F_HAND,
      }}
    >
      <style>{css}</style>
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 20px',
        }}
      >
        <div
          style={{
            fontFamily: F_PEN,
            fontSize: 46,
            fontWeight: 700,
            color: th.text,
            marginBottom: 24,
            transform: 'rotate(-2deg)',
          }}
        >
          はじめまして
        </div>
        <div
          style={{
            width: 'min(380px,100%)',
            ...PANEL(),
            border: `1.5px solid ${PANEL_LINE}`,
            borderRadius: SR3,
            padding: 22,
            boxShadow: '0 8px 24px #0003',
          }}
        >
          <div style={{ fontSize: 14, color: T.inkSoft, marginBottom: 14 }}>
            日記に表示される名前と色を決めましょう。
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="名前（例：あや）"
            maxLength={12}
            style={{
              border: `1.5px solid ${PANEL_LINE}`,
              borderRadius: SR3,
              padding: '12px 14px',
              fontSize: 16,
              fontFamily: F_HAND,
              outline: 'none',
              background: '#fff',
              width: '100%',
              boxSizing: 'border-box',
              marginBottom: 14,
            }}
          />
          <div style={{ fontSize: 12, color: T.inkSoft, marginBottom: 8 }}>
            色を選ぶ
          </div>
          <div
            style={{
              display: 'flex',
              gap: 9,
              flexWrap: 'wrap',
              marginBottom: 18,
            }}
          >
            {MEMBER_PALETTE.map((c) => {
              const sel = color === c.color;
              return (
                <button
                  key={c.key}
                  onClick={() => setColor(c.color)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  <span
                    style={{
                      display: 'grid',
                      placeItems: 'center',
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      background: c.color,
                      boxShadow: sel
                        ? `0 0 0 3px #fff,0 0 0 5px ${T.ink}`
                        : '0 1px 4px #0002',
                    }}
                  >
                    {sel && (
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: onColor(c.color),
                        }}
                      />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
          {error && (
            <div style={{ fontSize: 12.5, color: T.red, marginBottom: 10 }}>
              {error}
            </div>
          )}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%',
              background: color,
              color: onColor(color),
              border: 'none',
              borderRadius: SR3,
              padding: '14px',
              fontFamily: F_TITLE,
              fontWeight: 600,
              fontSize: 17,
              cursor: 'pointer',
            }}
          >
            {loading ? '設定中…' : 'はじめる →'}
          </button>
        </div>
      </div>
    </div>
  );
}

const DECOR = [
  {
    name: 'star',
    top: 60,
    left: -6,
    size: 30,
    rot: -12,
    op: 0.5,
    color: T.gold,
  },
  {
    name: 'heart',
    top: 300,
    right: -8,
    size: 26,
    rot: 14,
    op: 0.45,
    color: T.coral,
  },
  {
    name: 'sparkle',
    top: 560,
    left: -4,
    size: 24,
    rot: 8,
    op: 0.5,
    color: T.gold,
  },
  {
    name: 'leaf',
    top: 820,
    right: 0,
    size: 28,
    rot: 0,
    op: 0.45,
    color: T.leaf,
  },
  {
    name: 'star',
    top: 1060,
    left: -6,
    size: 26,
    rot: -18,
    op: 0.4,
    color: T.pink,
  },
];
function Timeline({ entries, photos, memberById, sideOf, onOpen }) {
  if (!entries.length) return <Empty />;
  return (
    <div style={{ position: 'relative' }}>
      {DECOR.map((d, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            top: d.top,
            left: d.left,
            right: d.right,
            opacity: d.op,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        >
          <Doodle name={d.name} size={d.size} rot={d.rot} color={d.color} />
        </span>
      ))}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          paddingTop: 8,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {entries.map((e, i) => (
          <LeafRow
            key={e.id}
            entry={e}
            idx={i}
            total={entries.length}
            m={memberById(e.authorId)}
            right={sideOf(e.authorId) === 'right'}
            photo={photos[e.id]}
            onOpen={onOpen}
          />
        ))}
        <div
          style={{
            textAlign: 'center',
            color: THM.textSoft,
            fontSize: 12,
            marginTop: 24,
          }}
        >
          ― ここまで ―
        </div>
      </div>
    </div>
  );
}
function LeafRow({ entry: e, idx: i, total, m, right, photo, onOpen }) {
  const [ref, seen] = useInView();
  const pp = paperOf(m);
  const rot = (right ? 1 : -1) * (1.4 + (i % 3) * 0.5);
  const stamp = ['star', 'heart', 'sparkle', 'leaf', 'flower'][i % 5];
  return (
    <div
      ref={ref}
      className={`reveal ${right ? 'r' : 'l'} ${seen ? 'in' : ''}`}
      style={{
        display: 'flex',
        justifyContent: right ? 'flex-end' : 'flex-start',
        marginTop: i ? -16 : 0,
        zIndex: total - i,
      }}
    >
      <button
        onClick={() => onOpen(e.id)}
        className="leaf"
        style={{
          width: '90%',
          textAlign: 'left',
          cursor: 'pointer',
          position: 'relative',
          transform: `rotate(${rot}deg)`,
          ...surfP(pp),
          border: `1.5px solid ${pp.line}`,
          borderRadius: right ? SR2 : SR,
          padding: '16px 18px 15px',
          boxShadow: '0 1px 0 #fff8 inset,0 10px 22px #00000022',
          borderTop: `5px solid ${m.color}`,
        }}
      >
        <Tape
          color={m.color}
          rot={right ? 5 : -5}
          style={{ top: -9, [right ? 'right' : 'left']: 22 }}
        />
        <span
          style={{
            position: 'absolute',
            top: 8,
            [right ? 'left' : 'right']: 10,
            opacity: 0.85,
            transform: `rotate(${right ? -10 : 10}deg)`,
          }}
        >
          <Doodle name={stamp} size={28} />
        </span>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            marginBottom: 6,
            flexDirection: right ? 'row-reverse' : 'row',
            paddingTop: 6,
          }}
        >
          <span
            style={{
              fontSize: 12,
              color: onColor(m.color),
              background: m.color,
              padding: '2px 11px',
              borderRadius: 999,
              fontFamily: F_TITLE,
              transform: `rotate(${right ? 2 : -2}deg)`,
            }}
          >
            {m.name}
          </span>
          <span style={{ fontSize: 12.5, color: T.inkSoft }}>
            {fmtDate(e.date).full}
          </span>
          <Doodle name={weatherDoodle(e.weather)} size={22} />
        </div>
        <div
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
            flexDirection: right ? 'row-reverse' : 'row',
          }}
        >
          {e.hasPhoto && photo && (
            <div
              style={{
                position: 'relative',
                flexShrink: 0,
                padding: 5,
                paddingBottom: 14,
                background: '#fff',
                boxShadow: '0 3px 8px #0003',
                transform: `rotate(${right ? 3 : -3}deg)`,
                borderRadius: 3,
              }}
            >
              <img
                src={photo}
                alt=""
                style={{
                  width: 78,
                  height: 64,
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
              <Corners />
            </div>
          )}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              textAlign: right ? 'right' : 'left',
            }}
          >
            <div
              style={{
                fontFamily: F_TITLE,
                fontWeight: 600,
                fontSize: 23,
                color: T.ink,
                lineHeight: 1.4,
              }}
            >
              {e.title}
            </div>
            <div
              style={{
                marginTop: 2,
                maxWidth: 230,
                marginLeft: right ? 'auto' : 0,
              }}
            >
              <Squiggle color={`${m.color}aa`} h={7} />
            </div>
            <div style={{ fontSize: 13, color: T.inkSoft, marginTop: 7 }}>
              {e.text?.slice(0, 28)}
              {(e.text?.length || 0) > 28 ? '…' : ''}
            </div>
            <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 4 }}>
              開いて読む →
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}
function DiaryModal({
  entry,
  photo,
  member,
  canEdit,
  comments = [],
  currentUserId,
  currentName,
  memberById,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  onEdit,
  onClose,
  onDelete,
}) {
  const [confirm, setConfirm] = useState(false);
  const pp = paperOf(member);
  return (
    <div onClick={onClose} style={overlay}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="popIn"
        style={{
          width: 'min(560px,94vw)',
          maxHeight: '90vh',
          overflowY: 'auto',
          ...surfP(pp),
          borderRadius: SR,
          border: `1.5px solid ${pp.line}`,
          boxShadow: '0 24px 70px #0006',
          position: 'relative',
          borderTop: `6px solid ${member.color}`,
        }}
      >
        <Tape
          color={member.color}
          w={80}
          rot={-4}
          style={{ top: -11, left: '50%', marginLeft: -40 }}
        />
        <DiaryPage entry={entry} photo={photo} member={member} stamp />
        <CommentSection
          comments={comments}
          canComment={!canEdit}
          currentUserId={currentUserId}
          currentName={currentName}
          memberById={memberById}
          onAdd={onAddComment}
          onUpdate={onUpdateComment}
          onDelete={onDeleteComment}
        />
        <div
          style={{
            display: 'flex',
            gap: 10,
            padding: '4px 22px 20px',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          {canEdit ? (
            !confirm ? (
              <span style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={onEdit}
                  style={{ ...ghostBtn, color: T.blue, borderColor: '#B7CEDF' }}
                >
                  編集
                </button>
                <button
                  onClick={() => setConfirm(true)}
                  style={{ ...ghostBtn, color: T.red, borderColor: '#E3B6AE' }}
                >
                  削除
                </button>
              </span>
            ) : (
              <span style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={onDelete}
                  style={{
                    ...ghostBtn,
                    background: T.red,
                    color: '#fff',
                    border: 'none',
                  }}
                >
                  削除する
                </button>
                <button onClick={() => setConfirm(false)} style={ghostBtn}>
                  やめる
                </button>
              </span>
            )
          ) : (
            <span style={{ fontSize: 12, color: T.inkSoft }}>
              🔒 {member.name} のページ（読むだけ）
            </span>
          )}
          <button
            onClick={onClose}
            style={{
              ...ghostBtn,
              background: T.ink,
              color: '#fff',
              border: 'none',
            }}
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
function CommentSection({
  comments,
  canComment,
  currentUserId,
  currentName,
  memberById,
  onAdd,
  onUpdate,
  onDelete,
}) {
  const [draft, setDraft] = useState('');
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState('');
  const myComment = comments.find((c) => c.author_id === currentUserId);
  const colorOf = (id) => (memberById && memberById(id)?.color) || T.inkSoft;
  return (
    <div style={{ padding: '0 22px 8px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          margin: '2px 0 10px',
        }}
      >
        <Doodle name="heart" size={18} color={T.coral} />
        <span style={{ fontFamily: F_TITLE, fontSize: 14, color: T.ink }}>
          ひとことコメント
        </span>
        <span style={{ fontSize: 11, color: T.inkSoft }}>
          {comments.length ? `${comments.length}件` : ''}
        </span>
      </div>
      {comments.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            marginBottom: canComment ? 12 : 4,
          }}
        >
          {comments.map((c) => {
            const mine = c.author_id === currentUserId;
            const col = colorOf(c.author_id);
            return (
              <div
                key={c.id}
                style={{
                  background: '#ffffffcc',
                  border: `1.5px solid ${PANEL_LINE}`,
                  borderLeft: `4px solid ${col}`,
                  borderRadius: 12,
                  padding: '8px 11px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    marginBottom: 3,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11.5,
                      fontFamily: F_TITLE,
                      color: inkOf(col),
                    }}
                  >
                    {c.author_name || '？'}
                  </span>
                  {mine && editId !== c.id && (
                    <span
                      style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}
                    >
                      <button
                        onClick={() => {
                          setEditId(c.id);
                          setEditText(c.text || '');
                        }}
                        style={linkBtn}
                      >
                        なおす
                      </button>
                      <button
                        onClick={() => onDelete(c.id)}
                        style={{ ...linkBtn, color: T.red }}
                      >
                        消す
                      </button>
                    </span>
                  )}
                </div>
                {editId === c.id ? (
                  <div>
                    <textarea
                      value={editText}
                      onChange={(e) =>
                        setEditText(e.target.value.slice(0, 100))
                      }
                      rows={2}
                      style={commentBox}
                    />
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: 5,
                      }}
                    >
                      <span style={{ fontSize: 11, color: T.inkSoft }}>
                        {editText.length}/100
                      </span>
                      <span style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => setEditId(null)}
                          style={ghostBtn}
                        >
                          やめる
                        </button>
                        <button
                          onClick={() => {
                            if (editText.trim()) onUpdate(c.id, editText);
                            setEditId(null);
                          }}
                          style={{
                            ...ghostBtn,
                            background: T.leaf,
                            color: '#fff',
                            border: 'none',
                          }}
                        >
                          保存
                        </button>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      fontSize: 14,
                      color: T.ink,
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {c.text}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {canComment && !myComment && (
        <div style={{ marginBottom: 6 }}>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, 100))}
            rows={2}
            placeholder="相手の日記にひとこと（100文字まで）"
            style={commentBox}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 5,
            }}
          >
            <span style={{ fontSize: 11, color: T.inkSoft }}>
              {draft.length}/100
            </span>
            <button
              disabled={!draft.trim()}
              onClick={() => {
                if (draft.trim()) {
                  onAdd(draft);
                  setDraft('');
                }
              }}
              style={{
                ...ghostBtn,
                background: draft.trim() ? T.coral : PANEL_LINE,
                color: '#fff',
                border: 'none',
                cursor: draft.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              おくる
            </button>
          </div>
        </div>
      )}
      {canComment && myComment && (
        <div style={{ fontSize: 11.5, color: T.inkSoft, marginBottom: 6 }}>
          コメント済み。上の「なおす」から直せます。
        </div>
      )}
    </div>
  );
}
function DiaryPage({ entry, photo, member, compact, stamp }) {
  const pp = paperOf(member);
  return (
    <div
      style={{
        padding: compact ? '16px' : '26px 24px 14px',
        position: 'relative',
      }}
    >
      {stamp && (
        <span
          style={{
            position: 'absolute',
            top: 16,
            right: 20,
            transform: 'rotate(-12deg)',
            opacity: 0.9,
          }}
        >
          <Doodle name="star" size={34} />
        </span>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
        }}
      >
        <div style={{ fontFamily: F_TITLE, fontSize: 16, color: T.inkSoft }}>
          {fmtDate(entry.date).full}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              fontSize: 12.5,
              color: onColor(member.color),
              background: member.color,
              padding: '3px 12px',
              borderRadius: 999,
              fontFamily: F_TITLE,
            }}
          >
            {member.name}
          </span>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Doodle name={weatherDoodle(entry.weather)} size={32} />
            <span style={{ fontSize: 10, color: T.inkSoft }}>
              {entry.weather}
            </span>
          </div>
        </div>
      </div>
      <div
        style={{
          position: 'relative',
          margin: '4px auto 18px',
          width: '94%',
          padding: '10px 10px 30px',
          background: '#fff',
          boxShadow: '0 6px 16px #00000026',
          transform: 'rotate(-1deg)',
          borderRadius: 3,
        }}
      >
        <div
          style={{
            position: 'relative',
            aspectRatio: '4/3',
            background: pp.deep,
            overflow: 'hidden',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          {photo ? (
            <img
              src={photo}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ textAlign: 'center', color: T.inkSoft }}>
              <Doodle
                name={weatherDoodle(entry.weather)}
                size={46}
                style={{ margin: '0 auto' }}
              />
              <div style={{ fontSize: 12, marginTop: 6 }}>写真のない日</div>
            </div>
          )}
        </div>
        <Corners />
        <div
          style={{
            position: 'absolute',
            bottom: 7,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: F_TITLE,
            fontSize: 12,
            color: T.inkSoft,
          }}
        >
          {fmtDate(entry.date).m}/{fmtDate(entry.date).d}
        </div>
      </div>
      <div style={{ fontSize: 11, color: T.inkSoft, marginBottom: 2 }}>
        タイトル
      </div>
      <div
        style={{
          fontFamily: F_TITLE,
          fontWeight: 600,
          fontSize: 25,
          color: T.ink,
          lineHeight: 1.4,
          padding: '2px 4px',
        }}
      >
        {entry.title}
      </div>
      <div style={{ margin: '0 0 16px' }}>
        <Squiggle color={T.coral} h={11} />
      </div>
      <div
        style={{
          background: ruledP(pp),
          backgroundPositionY: '0.42em',
          padding: '0.42em 6px 10px',
          fontSize: 16,
          lineHeight: '2.15em',
          color: T.ink,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {entry.text || '　'}
      </div>
      <div
        style={{
          textAlign: 'right',
          fontSize: 11,
          color: T.inkSoft,
          marginTop: 6,
        }}
      >
        {(entry.text || '').length} 文字
      </div>
    </div>
  );
}
function Compose({
  author,
  editEntry,
  prevEntryFor,
  onCancel,
  onSubmit,
  onUpdate,
  processImage,
}) {
  const isEdit = !!editEntry;
  const [weather, setWeather] = useState(editEntry?.weather || '晴れ');
  const [title, setTitle] = useState(editEntry?.title || '');
  const [text, setText] = useState(editEntry?.text || '');
  const [photo, setPhoto] = useState(editEntry?.photo || null);
  const [busy, setBusy] = useState(false);
  const [showPrev, setShowPrev] = useState(true);
  const fileRef = useRef(null);
  const prev = isEdit ? null : prevEntryFor(author.id);
  const pp = paperOf(author);
  const len = text.length;
  const tooLong = len > 1000;
  const ok = len >= 1 && !tooLong;
  async function pickPhoto(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    try {
      setPhoto(await processImage(f));
    } catch {
      setPhoto(null);
    }
    setBusy(false);
  }
  return (
    <div style={overlay}>
      <div
        className="popIn"
        style={{
          width: 'min(560px,96vw)',
          maxHeight: '94vh',
          overflowY: 'auto',
          ...surfP(pp),
          borderRadius: SR,
          border: `1.5px solid ${pp.line}`,
          boxShadow: '0 24px 70px #0006',
          position: 'relative',
        }}
      >
        <Tape
          color={author.color}
          w={84}
          rot={3}
          style={{ top: -11, left: '50%', marginLeft: -42 }}
        />
        <div
          style={{
            position: 'sticky',
            top: 0,
            ...surfP(pp),
            padding: '18px 20px 12px',
            borderBottom: `1.5px solid ${pp.line}`,
            zIndex: 2,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span
              style={{
                fontFamily: F_TITLE,
                fontWeight: 600,
                fontSize: 21,
                color: T.ink,
              }}
            >
              {isEdit ? 'ページを編集' : '今日のページ'}
            </span>
            <button onClick={onCancel} style={ghostBtn}>
              閉じる
            </button>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 7,
              marginTop: 10,
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 12, color: T.inkSoft }}>書く人</span>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                padding: '4px 13px 4px 5px',
                borderRadius: 999,
                border: `2px solid ${author.color}`,
                fontFamily: F_TITLE,
                background: author.color,
                color: onColor(author.color),
              }}
            >
              <span
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: '#ffffff44',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 11,
                }}
              >
                {author.name.slice(0, 1)}
              </span>
              {author.name}（あなた）
            </span>
          </div>
        </div>
        <div style={{ padding: '16px 20px 20px' }}>
          {prev && (
            <div style={{ marginBottom: 18 }}>
              <button
                onClick={() => setShowPrev((s) => !s)}
                style={{
                  ...ghostBtn,
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 13,
                }}
              >
                <span>前回 ― {prev.member.name} からのページ</span>
                <span>{showPrev ? '▲' : '▼'}</span>
              </button>
              {showPrev && (
                <div
                  style={{
                    border: `1.5px solid ${paperOf(prev.member).line}`,
                    borderLeft: `5px solid ${prev.member.color}`,
                    borderRadius: SR3,
                    marginTop: 8,
                    ...surfP(paperOf(prev.member)),
                    maxHeight: 240,
                    overflowY: 'auto',
                    transform: 'rotate(-0.4deg)',
                  }}
                >
                  <DiaryPage
                    entry={prev}
                    photo={prev.photo}
                    member={prev.member}
                    compact
                  />
                </div>
              )}
            </div>
          )}
          <div
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              marginBottom: 14,
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: 12, color: T.inkSoft }}>今日の天気</span>
            {WEATHERS.map(([w]) => (
              <button
                key={w}
                onClick={() => setWeather(w)}
                style={{
                  padding: 4,
                  borderRadius: 10,
                  cursor: 'pointer',
                  lineHeight: 0,
                  border:
                    weather === w
                      ? `2px solid ${T.leaf}`
                      : '2px solid transparent',
                  background: weather === w ? '#fff' : 'transparent',
                }}
              >
                <Doodle name={weatherDoodle(w)} size={28} />
              </button>
            ))}
          </div>
          <div
            style={{
              margin: '0 auto 16px',
              width: '86%',
              padding: '10px 10px 26px',
              background: '#fff',
              boxShadow: '0 6px 16px #0003',
              transform: 'rotate(-1deg)',
              borderRadius: 3,
              position: 'relative',
            }}
          >
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                width: '100%',
                aspectRatio: '4/3',
                border: 'none',
                background: photo ? '#000' : pp.deep,
                display: 'grid',
                placeItems: 'center',
                overflow: 'hidden',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              {photo ? (
                <img
                  src={photo}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ color: T.inkSoft, fontSize: 13 }}>
                  {busy ? '読み込み中…' : '写真を選ぶ'}
                </span>
              )}
            </button>
            <Corners />
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={pickPhoto}
            style={{ display: 'none' }}
          />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="タイトルを入れる"
            maxLength={40}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              fontFamily: F_TITLE,
              fontWeight: 600,
              fontSize: 22,
              color: T.ink,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              padding: '6px 4px 2px',
            }}
          />
          <div style={{ marginBottom: 14 }}>
            <Squiggle color={T.coral} h={11} />
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            placeholder="今日の出来事や気持ちを書いてみよう"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              resize: 'vertical',
              border: `1.5px solid ${pp.line}`,
              borderRadius: SR3,
              padding: '0.42em 14px',
              fontSize: 16,
              lineHeight: '2.15em',
              color: T.ink,
              fontFamily: F_HAND,
              background: ruledP(pp),
              backgroundPositionY: '0.42em',
              outline: 'none',
            }}
          />
          <div style={{ marginTop: 8 }}>
            <span
              style={{
                fontSize: 12.5,
                color: tooLong ? T.red : len === 0 ? T.inkSoft : T.leaf,
              }}
            >
              {len}/1000文字{' '}
              {len === 0 ? '（1文字から）' : tooLong ? '少し削りましょう' : '◎'}
            </span>
          </div>
          <button
            disabled={!ok || busy}
            onClick={() =>
              isEdit
                ? onUpdate({
                    id: editEntry.id,
                    weather,
                    title,
                    text,
                    photoData: photo,
                  })
                : onSubmit({
                    authorId: author.id,
                    weather,
                    title,
                    text,
                    photoData: photo,
                  })
            }
            style={{
              width: '100%',
              marginTop: 16,
              padding: '15px',
              borderRadius: SR3,
              border: 'none',
              fontFamily: F_TITLE,
              fontWeight: 600,
              fontSize: 18,
              cursor: ok ? 'pointer' : 'not-allowed',
              background: ok ? author.color : pp.line,
              color: '#fff',
              boxShadow: ok ? '0 5px 14px #0003' : 'none',
            }}
          >
            {isEdit ? '保存する' : '送る'}
          </button>
        </div>
      </div>
    </div>
  );
}
function ListView({ entries, photos, memberById, onOpen }) {
  if (!entries.length) return <Empty />;
  const groups = {};
  [...entries]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .forEach((e) => {
      (groups[fmtDate(e.date).my] ||= []).push(e);
    });
  return (
    <div style={{ paddingTop: 4 }}>
      <div style={{ fontSize: 13, color: THM.textSoft, marginBottom: 12 }}>
        全 {entries.length} ページ ／ 新しい順
      </div>
      {Object.entries(groups).map(([month, list]) => (
        <div key={month} style={{ marginBottom: 20 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 6,
            }}
          >
            <Doodle
              name="leaf"
              size={20}
              color={THM.dark ? THM.textSoft : T.leaf}
            />
            <span
              style={{
                fontFamily: F_TITLE,
                fontWeight: 600,
                fontSize: 17,
                color: THM.text,
              }}
            >
              {month}
            </span>
          </div>
          <div
            style={{
              ...PANEL(),
              border: `1.5px solid ${PANEL_LINE}`,
              borderRadius: SR3,
              overflow: 'hidden',
              boxShadow: '0 4px 14px #00000014',
            }}
          >
            {list.map((e, idx) => {
              const m = memberById(e.authorId);
              const { d, wd } = fmtDate(e.date);
              return (
                <button
                  key={e.id}
                  onClick={() => onOpen(e.id)}
                  style={{
                    width: '100%',
                    display: 'grid',
                    gridTemplateColumns: '46px 48px 1fr auto',
                    gap: 11,
                    alignItems: 'center',
                    textAlign: 'left',
                    padding: '11px 12px',
                    borderBottom:
                      idx < list.length - 1
                        ? `1px dotted ${PANEL_LINE}`
                        : 'none',
                    background: 'transparent',
                    border: 'none',
                    borderLeft: `5px solid ${m.color}`,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontFamily: F_TITLE,
                        fontWeight: 600,
                        fontSize: 20,
                        lineHeight: 1,
                        color: T.ink,
                      }}
                    >
                      {d}
                    </div>
                    <div style={{ fontSize: 10, color: T.inkSoft }}>{wd}</div>
                  </div>
                  <div
                    style={{
                      position: 'relative',
                      width: 48,
                      height: 40,
                      background: '#fff',
                      padding: 2,
                      boxShadow: '0 2px 5px #0002',
                      transform: 'rotate(-2deg)',
                      borderRadius: 2,
                      display: 'grid',
                      placeItems: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    {e.hasPhoto && photos[e.id] ? (
                      <img
                        src={photos[e.id]}
                        alt=""
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <Doodle name={weatherDoodle(e.weather)} size={24} />
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: F_TITLE,
                        fontWeight: 600,
                        fontSize: 16,
                        color: T.ink,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {e.title}
                    </div>
                    <div style={{ fontSize: 12, color: T.inkSoft }}>
                      <span style={{ color: inkOf(m.color) }}>{m.name}</span> ・{' '}
                      {(e.text || '').length}文字
                    </div>
                  </div>
                  <span style={{ color: T.inkSoft, fontSize: 18 }}>›</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
function Design({
  theme,
  setTheme,
  members,
  updateMemberPaper,
  updateMemberColor,
  currentUserId,
}) {
  const me = members.find((m) => m.id === currentUserId);
  const others = members.filter((m) => m.id !== currentUserId);
  const ordered = me ? [me, ...others] : members;
  return (
    <div style={{ paddingTop: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Doodle name="palette" size={24} color={THM.dark ? THM.text : T.ink} />
        <span
          style={{
            fontFamily: F_TITLE,
            fontWeight: 600,
            fontSize: 19,
            color: THM.text,
          }}
        >
          デザイン
        </span>
      </div>
      <div
        style={{ fontSize: 12.5, color: THM.textSoft, margin: '4px 0 18px' }}
      >
        テーマは全体の雰囲気。自分の分だけ色と紙を変えられます。
      </div>
      <div
        style={{
          fontFamily: F_TITLE,
          fontWeight: 600,
          fontSize: 15,
          color: THM.text,
          marginBottom: 8,
        }}
      >
        全体のテーマ
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginBottom: 26,
        }}
      >
        {Object.entries(THEMES).map(([key, t]) => {
          const sel = theme === key;
          return (
            <button
              key={key}
              onClick={() => setTheme(key)}
              style={{
                cursor: 'pointer',
                border: `2.5px solid ${sel ? T.leaf : '#ffffff66'}`,
                borderRadius: SR3,
                padding: 0,
                overflow: 'hidden',
                textAlign: 'left',
                position: 'relative',
                boxShadow: sel ? '0 8px 18px #0003' : '0 3px 10px #00000022',
                transform: sel ? 'rotate(-0.6deg)' : 'none',
              }}
            >
              <div style={{ height: 62, ...t.bg, position: 'relative' }}>
                {sel && (
                  <span style={{ position: 'absolute', top: 6, right: 6 }}>
                    <Doodle name="check" size={20} />
                  </span>
                )}
                {t.dark && (
                  <span style={{ position: 'absolute', bottom: 6, left: 8 }}>
                    <Doodle name="sparkle" size={14} color="#FFE9A8" />
                  </span>
                )}
              </div>
              <div
                style={{
                  padding: '7px 10px',
                  background: '#ffffffcc',
                  fontFamily: F_TITLE,
                  fontWeight: 600,
                  fontSize: 13,
                  color: T.ink,
                }}
              >
                {t.label}
              </div>
            </button>
          );
        })}
      </div>
      <div
        style={{
          fontFamily: F_TITLE,
          fontWeight: 600,
          fontSize: 15,
          color: THM.text,
          marginBottom: 8,
        }}
      >
        自分の色と紙
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {ordered.map((m) => (
          <MemberEditor
            key={m.id}
            m={m}
            editable={m.id === currentUserId}
            onPaper={(patch) => updateMemberPaper(m.id, patch)}
            onColor={(c) => updateMemberColor(m.id, c)}
          />
        ))}
      </div>
    </div>
  );
}
function MemberEditor({ m, editable = true, onPaper, onColor }) {
  const pp = paperOf(m);
  const lock = !editable;
  return (
    <div
      style={{
        ...PANEL(),
        border: `1.5px solid ${lock ? '#E8E8E8' : PANEL_LINE}`,
        borderRadius: SR3,
        padding: 14,
        boxShadow: '0 4px 12px #00000014',
        opacity: lock ? 0.72 : 1,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 12,
        }}
      >
        <span
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: m.color,
            color: onColor2(m.color),
            display: 'grid',
            placeItems: 'center',
            fontFamily: F_TITLE,
            fontWeight: 600,
            border: '2px solid #fff',
          }}
        >
          {m.name.slice(0, 1)}
        </span>
        <span
          style={{
            fontFamily: F_TITLE,
            fontWeight: 600,
            fontSize: 16,
            color: T.ink,
          }}
        >
          {m.name}
          {editable ? '（あなた）' : ''}
        </span>
        {lock && (
          <span style={{ fontSize: 11.5, color: T.inkSoft }}>
            🔒 本人のみ編集できます
          </span>
        )}
        <div
          style={{
            marginLeft: 'auto',
            width: 54,
            height: 38,
            ...surfP(pp),
            border: `1.5px solid ${pp.line}`,
            borderRadius: 6,
            position: 'relative',
            overflow: 'hidden',
            transform: 'rotate(-2deg)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: '7px 8px',
              background: `repeating-linear-gradient(${pp.line} 0 1px,transparent 1px 7px)`,
            }}
          />
        </div>
      </div>
      <div style={{ pointerEvents: lock ? 'none' : 'auto' }}>
        <div style={{ fontSize: 12, color: T.inkSoft, marginBottom: 6 }}>
          名前の色
        </div>
        <div
          style={{
            display: 'flex',
            gap: 9,
            flexWrap: 'wrap',
            marginBottom: 14,
          }}
        >
          {MEMBER_PALETTE.map((c) => {
            const sel = m.color === c.color;
            return (
              <button
                key={c.key}
                onClick={() => onColor(c.color)}
                title={c.label}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <span
                  style={{
                    display: 'grid',
                    placeItems: 'center',
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    background: c.color,
                    boxShadow: sel
                      ? `0 0 0 2px #fff,0 0 0 4px ${T.ink}`
                      : '0 1px 4px #0002',
                  }}
                >
                  {sel && (
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: onColor2(c.color),
                      }}
                    />
                  )}
                </span>
              </button>
            );
          })}
        </div>
        <div style={{ fontSize: 12, color: T.inkSoft, marginBottom: 6 }}>
          紙の質感
        </div>
        <div
          style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            marginBottom: 12,
          }}
        >
          {Object.entries(PAPER_TYPES).map(([key, t]) => {
            const sel = (m.paper?.type || 'whiteRough') === key;
            return (
              <button
                key={key}
                onClick={() => onPaper({ type: key })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 9px 5px 5px',
                  borderRadius: 999,
                  cursor: 'pointer',
                  border: `2px solid ${sel ? T.leaf : PANEL_LINE}`,
                  background: sel ? '#fff' : 'transparent',
                }}
              >
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    ...surface(t.card, { grain: t.grain, sheen: t.sheen }),
                    border: `1px solid ${PANEL_LINE}`,
                  }}
                />
                <span style={{ fontSize: 12, color: T.ink }}>{t.label}</span>
              </button>
            );
          })}
        </div>
        <div style={{ fontSize: 12, color: T.inkSoft, marginBottom: 6 }}>
          紙の色
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {Object.entries(TINTS).map(([key, t]) => {
            const sel = (m.paper?.tint || 'none') === key;
            return (
              <button
                key={key}
                onClick={() => onPaper({ tint: key })}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: t.swatch,
                    border: `3px solid ${sel ? T.leaf : '#fff'}`,
                    boxShadow: sel
                      ? '0 0 0 1.5px ' + T.leaf
                      : '0 1px 4px #0002',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  {key === 'none' && (
                    <span
                      style={{
                        width: 22,
                        height: 2,
                        background: T.inkSoft,
                        transform: 'rotate(-45deg)',
                        borderRadius: 2,
                      }}
                    />
                  )}
                </span>
                <span
                  style={{ fontSize: 10.5, color: sel ? T.ink : T.inkSoft }}
                >
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
function Members({
  members,
  entries,
  groups,
  addGroup,
  renameGroup,
  removeGroup,
  toggleGroupMember,
}) {
  const count = (id) => entries.filter((e) => e.authorId === id).length;
  const groupsOf = (mid) => groups.filter((g) => g.memberIds.includes(mid));
  return (
    <div style={{ paddingTop: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Doodle name="people" size={22} color={THM.dark ? THM.text : T.ink} />
        <span
          style={{
            fontFamily: F_TITLE,
            fontWeight: 600,
            fontSize: 19,
            color: THM.text,
          }}
        >
          このノートのメンバー
        </span>
      </div>
      <div
        style={{ fontSize: 12.5, color: THM.textSoft, margin: '4px 0 16px' }}
      >
        新しい人はこのアプリでアカウントを作ると自動で参加できます。
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 11,
          marginBottom: 24,
        }}
      >
        {members.map((m, i) => {
          const pp = paperOf(m);
          const mg = groupsOf(m.id);
          return (
            <div
              key={m.id}
              style={{
                ...surfP(pp),
                border: `1.5px solid ${pp.line}`,
                borderRadius: SR3,
                padding: '13px 14px',
                borderLeft: `6px solid ${m.color}`,
                transform: `rotate(${i % 2 ? 0.4 : -0.4}deg)`,
                boxShadow: '0 5px 14px #00000018',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: m.color,
                    color: onColor(m.color),
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 17,
                    fontFamily: F_TITLE,
                    fontWeight: 600,
                    border: '2.5px solid #fff',
                  }}
                >
                  {m.name.slice(0, 1)}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: F_TITLE,
                      fontWeight: 600,
                      fontSize: 17,
                      color: T.ink,
                    }}
                  >
                    {m.name}
                  </div>
                  <div style={{ fontSize: 12, color: T.inkSoft }}>
                    {count(m.id)} ページ
                  </div>
                  {mg.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        gap: 5,
                        flexWrap: 'wrap',
                        marginTop: 5,
                      }}
                    >
                      {mg.map((g) => (
                        <span
                          key={g.id}
                          style={{
                            fontSize: 11,
                            color: T.ink,
                            background: '#00000010',
                            borderRadius: 999,
                            padding: '1px 9px',
                          }}
                        >
                          {g.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 4,
        }}
      >
        <Doodle name="people" size={20} color={THM.dark ? THM.text : T.leaf} />
        <span
          style={{
            fontFamily: F_TITLE,
            fontWeight: 600,
            fontSize: 18,
            color: THM.text,
          }}
        >
          グループ
        </span>
      </div>
      <div style={{ fontSize: 12.5, color: THM.textSoft, marginBottom: 12 }}>
        日記・一覧でメンバーを絞り込めます。
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {groups.map((g) => (
          <GroupCard
            key={g.id}
            g={g}
            members={members}
            onRename={(n) => renameGroup(g.id, n)}
            onRemove={() => removeGroup(g.id)}
            onToggle={(mid) => toggleGroupMember(g.id, mid)}
          />
        ))}
        <button
          onClick={addGroup}
          style={{
            ...PANEL(),
            border: `1.5px dashed ${PANEL_LINE}`,
            borderRadius: SR3,
            padding: '13px',
            fontFamily: F_TITLE,
            fontWeight: 600,
            fontSize: 15,
            color: T.ink,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 18 }}>＋</span> グループを追加
        </button>
      </div>
    </div>
  );
}
function GroupCard({ g, members, onRename, onRemove, onToggle }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(g.name);
  const [confirm, setConfirm] = useState(false);
  const inGroup = members.filter((m) => g.memberIds.includes(m.id));
  return (
    <div
      style={{
        ...PANEL(),
        border: `1.5px solid ${PANEL_LINE}`,
        borderRadius: SR3,
        padding: 14,
        boxShadow: '0 4px 12px #00000014',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 10,
        }}
      >
        {editing ? (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            maxLength={20}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onRename(name.trim() || g.name);
                setEditing(false);
              }
            }}
            style={{
              flex: 1,
              fontFamily: F_TITLE,
              fontWeight: 600,
              fontSize: 16,
              color: T.ink,
              border: `1.5px solid ${PANEL_LINE}`,
              borderRadius: 8,
              padding: '6px 10px',
              outline: 'none',
              background: '#fff',
            }}
          />
        ) : (
          <span
            style={{
              flex: 1,
              fontFamily: F_TITLE,
              fontWeight: 600,
              fontSize: 16,
              color: T.ink,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {g.name}
            <span
              style={{
                fontSize: 11,
                color: T.inkSoft,
                background: '#00000010',
                borderRadius: 999,
                padding: '1px 8px',
              }}
            >
              {inGroup.length}人
            </span>
          </span>
        )}
        {editing ? (
          <button
            onClick={() => {
              onRename(name.trim() || g.name);
              setEditing(false);
            }}
            style={{
              ...ghostBtn,
              background: T.leaf,
              color: '#fff',
              border: 'none',
            }}
          >
            保存
          </button>
        ) : (
          <button
            onClick={() => {
              setName(g.name);
              setEditing(true);
            }}
            style={ghostBtn}
          >
            名前を編集
          </button>
        )}
        {!confirm ? (
          <button
            onClick={() => setConfirm(true)}
            style={{ ...ghostBtn, color: T.red, borderColor: '#E3B6AE' }}
          >
            削除
          </button>
        ) : (
          <span style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={onRemove}
              style={{
                ...ghostBtn,
                background: T.red,
                color: '#fff',
                border: 'none',
              }}
            >
              削除する
            </button>
            <button onClick={() => setConfirm(false)} style={ghostBtn}>
              やめる
            </button>
          </span>
        )}
      </div>
      <div style={{ fontSize: 12, color: T.inkSoft, marginBottom: 7 }}>
        タップで出入り
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {members.map((m) => {
          const on = g.memberIds.includes(m.id);
          return (
            <button
              key={m.id}
              onClick={() => onToggle(m.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 11px 4px 4px',
                borderRadius: 999,
                cursor: 'pointer',
                border: `2px solid ${on ? m.color : PANEL_LINE}`,
                background: on ? m.color : 'transparent',
              }}
            >
              <span
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: on ? '#ffffff44' : m.color,
                  color: on ? onColor(m.color) : '#fff',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 11,
                  fontFamily: F_TITLE,
                  fontWeight: 600,
                }}
              >
                {m.name.slice(0, 1)}
              </span>
              <span
                style={{
                  fontSize: 12.5,
                  fontFamily: F_TITLE,
                  color: on ? onColor(m.color) : inkOf(m.color),
                }}
              >
                {m.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
function NavBtn({ label, active, onClick, d }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        color: active ? THM.text : THM.textSoft,
        fontFamily: F_TITLE,
        opacity: active ? 1 : 0.75,
      }}
    >
      <Doodle
        name={d}
        size={22}
        color={active ? THM.accent || T.ink : THM.textSoft}
      />
      <span style={{ fontSize: 11 }}>{label}</span>
    </button>
  );
}
function Empty() {
  return (
    <div
      style={{ textAlign: 'center', padding: '66px 20px', color: THM.textSoft }}
    >
      <Doodle
        name="book"
        size={54}
        color={THM.dark ? THM.text : T.ink}
        style={{ margin: '0 auto' }}
      />
      <div
        style={{
          fontFamily: F_TITLE,
          fontWeight: 600,
          fontSize: 19,
          marginTop: 12,
          color: THM.text,
        }}
      >
        まだ1ページもありません
      </div>
      <div style={{ fontSize: 13, marginTop: 6 }}>
        下の「書く」から、最初の日記を。
      </div>
    </div>
  );
}
const overlay = {
  position: 'fixed',
  inset: 0,
  zIndex: 50,
  background: '#181410cc',
  display: 'grid',
  placeItems: 'center',
  padding: 14,
  overflowY: 'auto',
};
const ghostBtn = {
  background: '#ffffffcc',
  border: `1.5px solid ${T.line}`,
  borderRadius: SR3,
  padding: '7px 15px',
  fontSize: 13,
  color: T.ink,
  fontFamily: F_HAND,
  cursor: 'pointer',
};
const miniBtn = {
  background: 'transparent',
  border: `1.5px solid ${T.line}`,
  borderRadius: 999,
  padding: '3px 11px',
  fontSize: 11.5,
  color: T.inkSoft,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};
const linkBtn = {
  background: 'transparent',
  border: 'none',
  color: T.inkSoft,
  fontSize: 11.5,
  cursor: 'pointer',
  padding: 0,
  fontFamily: F_HAND,
};
const commentBox = {
  width: '100%',
  boxSizing: 'border-box',
  resize: 'vertical',
  border: `1.5px solid ${PANEL_LINE}`,
  borderRadius: 10,
  padding: '8px 11px',
  fontSize: 14,
  lineHeight: 1.6,
  color: T.ink,
  fontFamily: F_HAND,
  background: '#fff',
  outline: 'none',
};
const css = `
@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Klee+One:wght@400;600&display=swap');
*{-webkit-tap-highlight-color:transparent;}
.reveal{opacity:0;transition:opacity .6s ease,transform .6s cubic-bezier(.2,.8,.25,1);will-change:opacity,transform;}
.reveal.l{transform:translate(-40px,20px) rotate(-2.5deg);}
.reveal.r{transform:translate(40px,20px) rotate(2.5deg);}
.reveal.in{opacity:1;transform:translate(0,0);}
.leaf{transition:transform .2s ease,box-shadow .2s ease;}
.leaf:hover{transform:translateY(-3px) rotate(0deg)!important;box-shadow:0 16px 30px #00000030!important;z-index:99;}
.fab:active{transform:scale(.94);}
.popIn{animation:pop .28s cubic-bezier(.2,.9,.3,1.1);}
@keyframes pop{from{opacity:0;transform:scale(.93) translateY(12px) rotate(-1deg);}to{opacity:1;transform:scale(1) rotate(0);}}
button:focus-visible,input:focus-visible,textarea:focus-visible{outline:3px solid #7D9E5C88;outline-offset:2px;}
::placeholder{color:#8A7A62;opacity:.6;}
::-webkit-scrollbar{width:10px;}
::-webkit-scrollbar-thumb{background:#0000002e;border-radius:9px;border:2px solid transparent;background-clip:content-box;}
@media(prefers-reduced-motion:reduce){.reveal{opacity:1!important;transform:none!important;transition:none!important;}.popIn{animation:none!important;}}
`;