/* eslint-disable */
/* Shared visual primitives for FitPlus prototype.
   Exposed on window so mobile.jsx / web.jsx / app.jsx can use them. */

const { useState, useEffect, useRef, useMemo } = React;

// ── Icon set (stroke-based, line-art, matches Apple-like premium feel) ─────
function Icon({ name, size = 18, stroke = 1.6, color = 'currentColor', style }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: color, strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round', style };
  switch (name) {
    case 'home':     return <svg {...p}><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></svg>;
    case 'bowl':     return <svg {...p}><path d="M3 11h18l-2 8H5z"/><path d="M8 7c0-2 1-3 4-3s4 1 4 3"/></svg>;
    case 'spark':    return <svg {...p}><path d="M12 3l1.8 5L19 10l-5.2 2L12 17l-1.8-5L5 10l5.2-2z"/></svg>;
    case 'pin':      return <svg {...p}><path d="M12 21s7-7.5 7-12a7 7 0 10-14 0c0 4.5 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>;
    case 'user':     return <svg {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4.5 5-7 8-7s6.5 2.5 8 7"/></svg>;
    case 'plus':     return <svg {...p}><path d="M12 5v14M5 12h14"/></svg>;
    case 'arrow':    return <svg {...p}><path d="M5 12h14M13 5l7 7-7 7"/></svg>;
    case 'arrow-up': return <svg {...p}><path d="M12 19V5M5 12l7-7 7 7"/></svg>;
    case 'left':     return <svg {...p}><path d="M15 6l-6 6 6 6"/></svg>;
    case 'right':    return <svg {...p}><path d="M9 6l6 6-6 6"/></svg>;
    case 'flame':    return <svg {...p}><path d="M12 3c2 4 6 6 6 11a6 6 0 11-12 0c0-3 2-4 2-7 0 3 2 4 4 4 0-3-1-5 0-8z"/></svg>;
    case 'dumbbell':return <svg {...p}><path d="M3 9v6M21 9v6M6 7v10M18 7v10M6 12h12"/></svg>;
    case 'leaf':     return <svg {...p}><path d="M5 19c0-9 7-14 16-14-1 9-6 14-14 14a3 3 0 01-2-2z"/><path d="M5 19c4-4 8-7 12-9"/></svg>;
    case 'camera':   return <svg {...p}><path d="M4 8h3l2-2h6l2 2h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>;
    case 'mic':      return <svg {...p}><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3"/></svg>;
    case 'send':     return <svg {...p}><path d="M4 12l16-8-6 18-3-7z"/></svg>;
    case 'search':   return <svg {...p}><circle cx="11" cy="11" r="6"/><path d="M20 20l-4-4"/></svg>;
    case 'heart':    return <svg {...p}><path d="M12 21s-7-4.5-9-10a5 5 0 019-3 5 5 0 019 3c-2 5.5-9 10-9 10z"/></svg>;
    case 'check':    return <svg {...p}><path d="M5 12l5 5L20 7"/></svg>;
    case 'bell':     return <svg {...p}><path d="M6 16V11a6 6 0 1112 0v5l1.5 2H4.5z"/><path d="M10 21h4"/></svg>;
    case 'gear':     return <svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1-1.6 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3h0a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8v0a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/></svg>;
    case 'chart':    return <svg {...p}><path d="M3 20h18M7 16V9m5 7V5m5 11v-7"/></svg>;
    case 'play':     return <svg {...p}><path d="M7 4l13 8-13 8z"/></svg>;
    case 'pause':    return <svg {...p}><path d="M7 4v16M17 4v16"/></svg>;
    case 'close':    return <svg {...p}><path d="M6 6l12 12M18 6l-12 12"/></svg>;
    case 'menu':     return <svg {...p}><path d="M4 6h16M4 12h16M4 18h16"/></svg>;
    case 'star':     return <svg {...p}><path d="M12 3l2.7 6.3L21 10l-5 4.4L17.5 21 12 17.6 6.5 21 8 14.4 3 10l6.3-.7z"/></svg>;
    case 'water':    return <svg {...p}><path d="M12 3c4 5 7 8 7 12a7 7 0 11-14 0c0-4 3-7 7-12z"/></svg>;
    case 'key':      return <svg {...p}><circle cx="8" cy="14" r="4"/><path d="M11 14h10M17 14v4M21 14v3"/></svg>;
    default:         return <svg {...p}><circle cx="12" cy="12" r="9"/></svg>;
  }
}

// ── Calorie / progress ring ─────────────────────────────────────────────
function ProgressRing({ size = 180, stroke = 14, value = 0.62, label, sub, accent }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - value);
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r}
          fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r}
          fill="none"
          stroke={accent || 'var(--primary)'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 800ms cubic-bezier(.2,.8,.2,1)' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="serif-d" style={{ fontSize: size * 0.28, lineHeight: 1, color: 'var(--ink)', letterSpacing: '-0.03em' }}>{label}</div>
        {sub && <div className="eyebrow" style={{ marginTop: 6 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ── Triple ring (rings of "Activity" but for protein/carbs/fat) ──────────
function TripleRing({ size = 130, stroke = 8, values = [0.72, 0.5, 0.85] }) {
  const ring = (idx, color) => {
    const r = (size - stroke) / 2 - idx * (stroke + 2);
    const c = 2 * Math.PI * r;
    const v = Math.max(0, Math.min(1, values[idx]));
    return (
      <>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeOpacity="0.18" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v)}/>
      </>
    );
  };
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      {ring(0, 'var(--macro-protein)')}
      {ring(1, 'var(--macro-carbs)')}
      {ring(2, 'var(--macro-fat)')}
    </svg>
  );
}

// ── Sparkline ───────────────────────────────────────────────────────────
function Spark({ data = [4,6,5,8,7,9,11,10,13], width = 180, height = 50, color = 'var(--primary)' }) {
  const max = Math.max(...data), min = Math.min(...data);
  const span = Math.max(1, max - min);
  const step = width / (data.length - 1);
  const pts = data.map((v, i) => `${i*step},${height - ((v-min)/span)*(height-6) - 3}`).join(' ');
  return (
    <svg width={width} height={height}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={(data.length-1)*step} cy={height - ((data[data.length-1]-min)/span)*(height-6) - 3} r="3" fill={color}/>
    </svg>
  );
}

// ── Macro bar (horizontal) ──────────────────────────────────────────────
function MacroBar({ label, value, target, color }) {
  const pct = Math.min(100, Math.round((value/target) * 100));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500 }}>{label}</span>
        <span className="mono" style={{ fontSize: 12, color: 'var(--ink-2)' }}>{value}<span style={{ color: 'var(--muted)' }}>/{target}g</span></span>
      </div>
      <div style={{ height: 6, background: 'var(--line)', borderRadius: 999 }}>
        <div style={{ width: pct + '%', height: '100%', background: color, borderRadius: 999, transition: 'width .8s' }}/>
      </div>
    </div>
  );
}

// ── Streak chip ─────────────────────────────────────────────────────────
function StreakDot({ on }) {
  return <div style={{ width: 14, height: 14, borderRadius: 4,
    background: on ? 'var(--primary)' : 'var(--line-soft)',
    border: '1px solid ' + (on ? 'transparent' : 'var(--line)') }}/>;
}

// ── Ascii placeholder image ─────────────────────────────────────────────
function PlaceholderImg({ label, height = 120, radius = 16 }) {
  return <div className="placeholder" style={{ height, borderRadius: radius, width: '100%' }}>{label}</div>;
}

// ── Avatar ──────────────────────────────────────────────────────────────
function Avatar({ name = 'AM', size = 36, tint }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: tint || 'var(--primary-soft)',
      color: 'var(--primary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 600, fontSize: size * 0.36, letterSpacing: '0.02em',
      border: '1px solid var(--line)',
      fontFamily: 'Instrument Serif, serif',
    }}>{name}</div>
  );
}

Object.assign(window, {
  Icon, ProgressRing, TripleRing, Spark, MacroBar, StreakDot, PlaceholderImg, Avatar
});
