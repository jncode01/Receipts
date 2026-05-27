import type { Theme } from '../lib/theme';

// ── Icons (1.5px outlined) ──────────────────────────────────────────────────
type I = { size?: number; dir?: number };
export const Icon = {
  search:   (p: I = {}) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="7" cy="7" r="5"/><path d="m11 11 3 3"/></svg>,
  plus:     (p: I = {}) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 3v10M3 8h10"/></svg>,
  camera:   (p: I = {}) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7h3l2-3h8l2 3h3v13H3z"/><circle cx="12" cy="13" r="4"/></svg>,
  upload:   (p: I = {}) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4M7 9l5-5 5 5M4 20h16"/></svg>,
  filter:   (p: I = {}) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 4h12M4 8h8M6 12h4"/></svg>,
  cal:      (p: I = {}) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3.5" width="12" height="11" rx="1.5"/><path d="M2 6.5h12M5 2v3M11 2v3"/></svg>,
  download: (p: I = {}) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 2v8m-3-3 3 3 3-3M3 13h10"/></svg>,
  chevron:  (p: I = {}) => <svg width={p.size||10} height={p.size||10} viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ transform: `rotate(${p.dir||0}deg)` }}><path d="M3 2l4 3-4 3"/></svg>,
  dots:     (p: I = {}) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 16 16" fill="currentColor"><circle cx="3" cy="8" r="1.3"/><circle cx="8" cy="8" r="1.3"/><circle cx="13" cy="8" r="1.3"/></svg>,
  check:    (p: I = {}) => <svg width={p.size||12} height={p.size||12} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 6 3 3 5-6"/></svg>,
  close:    (p: I = {}) => <svg width={p.size||12} height={p.size||12} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 3l6 6M9 3l-6 6"/></svg>,
  folder:   (p: I = {}) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"><path d="M2 5a1 1 0 0 1 1-1h3l1.5 1.5H13a1 1 0 0 1 1 1V12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z"/></svg>,
  tag:      (p: I = {}) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2H3a1 1 0 0 0-1 1v5l6 6 6-6-6-6z"/><circle cx="5" cy="5" r=".8" fill="currentColor"/></svg>,
  spark:    (p: I = {}) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 16 16" fill="currentColor"><path d="M8 1l1.4 4.6L14 7l-4.6 1.4L8 13l-1.4-4.6L2 7l4.6-1.4z"/></svg>,
  trash:    (p: I = {}) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 4h10M6 4V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1M4.5 4l.5 9a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1l.5-9"/></svg>,
  edit:     (p: I = {}) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 13v-2l8-8 2 2-8 8H3zM10 4l2 2"/></svg>,
  pin:      (p: I = {}) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2c-2.5 0-4 1.8-4 4 0 3 4 8 4 8s4-5 4-8c0-2.2-1.5-4-4-4z"/><circle cx="8" cy="6" r="1.5"/></svg>,
  sort:     (p: I = {}) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M5 3v10M3 11l2 2 2-2M11 3v10M9 5l2-2 2 2"/></svg>,
  note:     (p: I = {}) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h7l3 3v7a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M5 7h5M5 10h4"/></svg>,
  expand:   (p: I = {}) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h4M3 3v4M13 13H9M13 13V9M3 13v-4M3 13h4M13 3v4M13 3H9"/></svg>,
  pdf:      (p: I = {}) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"><path d="M4 2h6l3 3v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z"/><path d="M10 2v3h3"/></svg>,
};

// ── Atoms ───────────────────────────────────────────────────────────────────
export function Dot({ color, size = 8 }: { color: string; size?: number }) {
  return <span style={{ display: 'inline-block', width: size, height: size, borderRadius: size, background: color, flexShrink: 0 }} />;
}

export function Mono({ children, weight = 500, size, color }: { children: React.ReactNode; weight?: number; size?: number; color?: string }) {
  return <span style={{
    fontFamily: '"Geist Mono", ui-monospace, monospace',
    fontVariantNumeric: 'tabular-nums',
    fontWeight: weight, fontSize: size, color,
    letterSpacing: '-0.01em',
  }}>{children}</span>;
}

export function Tag({ name, color, theme, size = 'sm' }: { name: string; color?: string; theme: Theme; size?: 'xs' | 'sm' | 'md' }) {
  const fs = size === 'xs' ? 10 : size === 'sm' ? 11 : 12;
  const pad = size === 'xs' ? '2px 6px' : size === 'sm' ? '3px 7px' : '4px 9px';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: pad, borderRadius: 999, background: theme.tag,
      fontSize: fs, color: theme.ink, fontWeight: 500, lineHeight: 1.2,
      whiteSpace: 'nowrap',
    }}>
      {color && <Dot color={color} size={6} />}
      {name}
    </span>
  );
}

export function Money({ amount, size = 28, theme, color }: { amount: number; size?: number; theme?: Theme; color?: string }) {
  const value = Math.abs(amount);
  return (
    <span style={{
      fontFamily: '"Geist Mono", monospace', fontVariantNumeric: 'tabular-nums',
      letterSpacing: '-0.02em', color: color || (theme && theme.ink), fontSize: size, fontWeight: 500,
    }}>
      <span style={{ fontSize: size * 0.65, opacity: 0.6, marginRight: 2 }}>$</span>
      {value.toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  );
}

// ── Buttons ─────────────────────────────────────────────────────────────────
export function ButtonPrimary(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { theme: Theme; icon?: (p: I) => JSX.Element }) {
  const { theme, icon: Ic, children, ...rest } = props;
  return (
    <button {...rest} style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
      background: theme.accent, color: '#fff',
      fontSize: 12, fontWeight: 600, fontFamily: theme.fontSans,
      ...(rest.style || {}),
    }}>
      {Ic && <Ic size={13} />}
      {children}
    </button>
  );
}

export function ButtonGhost(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { theme: Theme; icon?: (p: I) => JSX.Element }) {
  const { theme, icon: Ic, children, ...rest } = props;
  return (
    <button {...rest} style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      padding: '7px 12px', borderRadius: 8,
      border: `1px solid ${theme.line}`, background: theme.panel,
      color: theme.ink, cursor: 'pointer',
      fontSize: 12, fontWeight: 500, fontFamily: theme.fontSans,
      ...(rest.style || {}),
    }}>
      {Ic && <Ic size={13} />}
      {children}
    </button>
  );
}

// ── Charts ──────────────────────────────────────────────────────────────────
export function Donut({ data, size = 140, thickness = 18, gap = 0.012 }:
  { data: { value: number; color: string }[]; size?: number; thickness?: number; gap?: number }) {
  const total = data.reduce((a, d) => a + d.value, 0) || 1;
  const R = size / 2 - thickness / 2;
  const C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      <g transform={`rotate(-90 ${size/2} ${size/2})`}>
        {data.map((d, i) => {
          const frac = d.value / total;
          const len = Math.max(0, frac - gap) * C;
          const off = acc * C;
          acc += frac;
          return (
            <circle key={i} cx={size/2} cy={size/2} r={R}
              fill="none" stroke={d.color} strokeWidth={thickness}
              strokeDasharray={`${len} ${C - len}`}
              strokeDashoffset={-off}
              strokeLinecap="butt" />
          );
        })}
      </g>
    </svg>
  );
}

export function HBars({ rows, theme, valueFmt }:
  { rows: { label: string; value: number; color: string; cap?: number | null }[]; theme: Theme; valueFmt?: (v: number) => string }) {
  const fmt = valueFmt ?? ((v: number) => '$' + v.toFixed(0));
  const M = Math.max(...rows.map((r) => Math.max(r.value, r.cap ?? 0)), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 80px', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: theme.ink }}>
            <Dot color={r.color} size={7} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.label}</span>
          </div>
          <div style={{ height: 10, background: theme.tag, borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, width: `${(r.value / M) * 100}%`, background: r.color, borderRadius: 6 }} />
            {r.cap != null && (
              <div style={{ position: 'absolute', left: `${Math.min(100, (r.cap / M) * 100)}%`, top: -3, bottom: -3, width: 1.5, background: theme.lineStrong }} />
            )}
          </div>
          <div style={{ textAlign: 'right' }}><Mono size={12} color={theme.ink}>{fmt(r.value)}</Mono></div>
        </div>
      ))}
    </div>
  );
}

export function AreaChart({ data, w = 540, h = 140, color = '#3F6E5A', theme }:
  { data: { month: string; total: number }[]; w?: number; h?: number; color?: string; theme: Theme }) {
  if (!data.length) return null;
  const pad = { l: 4, r: 4, t: 6, b: 18 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const max = Math.max(...data.map((d) => d.total)) * 1.1 || 1;
  const x = (i: number) => pad.l + (data.length === 1 ? innerW/2 : (i / (data.length - 1)) * innerW);
  const y = (v: number) => pad.t + innerH - (v / max) * innerH;
  const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(d.total)}`).join(' ');
  const area = `${line} L${x(data.length-1)},${pad.t + innerH} L${x(0)},${pad.t + innerH} Z`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', width: '100%' }}>
      <defs>
        <linearGradient id="ag" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f, i) => (
        <line key={i} x1={pad.l} x2={w - pad.r} y1={pad.t + innerH * f} y2={pad.t + innerH * f} stroke={theme.line} strokeDasharray="2 4"/>
      ))}
      <path d={area} fill="url(#ag)" />
      <path d={line} fill="none" stroke={color} strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round"/>
      {data.map((d, i) => (
        <circle key={i} cx={x(i)} cy={y(d.total)} r="2.5" fill={theme.panel} stroke={color} strokeWidth="1.5"/>
      ))}
      {data.map((d, i) => {
        const dt = new Date(d.month + '-01');
        const lbl = dt.toLocaleDateString('en-NZ', { month: 'short' });
        return (
          <text key={'l'+i} x={x(i)} y={h - 4} textAnchor="middle"
            fontFamily='"Geist Mono", monospace' fontSize="9"
            fill={theme.mute}>{lbl}</text>
        );
      })}
    </svg>
  );
}

// ── Panel wrapper ──────────────────────────────────────────────────────────
export function Panel({ theme, children, style, label, action }:
  { theme: Theme; children: React.ReactNode; style?: React.CSSProperties; label?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section style={{
      background: theme.panel, border: `1px solid ${theme.line}`,
      borderRadius: 12, padding: 18, ...style,
    }}>
      {(label || action) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          {label && <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: theme.mute }}>{label}</div>}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
