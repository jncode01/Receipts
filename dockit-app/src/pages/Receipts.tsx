import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useReceipts, useCategories, useProjects, type ReceiptFilter } from '../hooks/useData';
import { fmtNZD, fmtDate, warrantyInfo } from '../lib/format';
import { theme } from '../lib/theme';
import { Icon, Mono, Dot, Tag, ButtonGhost, ButtonPrimary } from '../components/ui';
import { PageHeader } from '../components/AppShell';

const PRESETS: [string, { from: string; to: string } | null][] = [
  ['All', null],
  ['30d', { from: iso(-30), to: iso(0) }],
  ['90d', { from: iso(-90), to: iso(0) }],
  ['YTD', { from: new Date().getFullYear() + '-01-01', to: iso(0) }],
];

function iso(deltaDays: number) {
  const d = new Date();
  d.setDate(d.getDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

export function ReceiptsPage() {
  const [search, setSearch] = useState('');
  const [preset, setPreset] = useState<string>('All');
  const [cats, setCats] = useState<string[]>([]);
  const [projs, setProjs] = useState<string[]>([]);

  const { data: categories = [] } = useCategories();
  const { data: projects = [] }   = useProjects();

  const filter: ReceiptFilter = useMemo(() => {
    const p = PRESETS.find(([k]) => k === preset)?.[1] || null;
    return {
      search: search || undefined,
      from: p?.from, to: p?.to,
      categoryIds: cats.length ? cats : undefined,
      projectIds: projs.length ? projs : undefined,
    };
  }, [search, preset, cats, projs]);

  const { data: receipts = [], isLoading } = useReceipts(filter);
  const catMap  = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c])), [categories]);
  const projMap = useMemo(() => Object.fromEntries(projects.map(p => [p.id, p])), [projects]);

  const total = receipts.reduce((a, r) => a + Number(r.total), 0);
  const gst   = receipts.reduce((a, r) => a + (Number(r.gst) || 0), 0);

  const toggle = (arr: string[], setArr: (v: string[]) => void, id: string) =>
    setArr(arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id]);

  return (
    <div>
      <div style={{ padding: '22px 28px 16px', borderBottom: `1px solid ${theme.line}` }}>
        <PageHeader sub="All receipts" title={`${receipts.length} · ${fmtNZD(total)} · GST ${fmtNZD(gst)}`}
          right={
            <div style={{ display: 'flex', gap: 8 }}>
              <Link to="/export"><ButtonGhost theme={theme} icon={Icon.download}>Export</ButtonGhost></Link>
              <Link to="/capture"><ButtonPrimary theme={theme} icon={Icon.camera}>Add</ButtonPrimary></Link>
            </div>
          }
        />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative', minWidth: 220, flex: '1 1 200px', maxWidth: 360 }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: theme.mute, display: 'flex' }}>
              <Icon.search size={13}/>
            </span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search merchant…"
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '8px 10px 8px 30px', borderRadius: 8,
                border: `1px solid ${theme.line}`, background: theme.panel,
                color: theme.ink, fontSize: 12, fontFamily: theme.fontSans, outline: 'none',
              }}/>
          </div>
          <div style={{ display: 'inline-flex', padding: 2, background: theme.tag, borderRadius: 8 }}>
            {PRESETS.map(([k]) => {
              const on = preset === k;
              return <button key={k} onClick={() => setPreset(k)} style={{
                padding: '4px 10px', borderRadius: 6, border: 'none',
                background: on ? theme.panel : 'transparent', color: on ? theme.ink : theme.mute,
                fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: theme.fontSans,
                boxShadow: on ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
              }}>{k}</button>;
            })}
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12, alignItems: 'center' }}>
          {categories.map((c) => {
            const on = cats.includes(c.id);
            return (
              <button key={c.id} onClick={() => toggle(cats, setCats, c.id)} style={chipStyle(on, c.color)}>
                <Dot color={c.color} size={6}/>{c.name}
              </button>
            );
          })}
          {projects.length > 0 && <span style={{ width: 1, height: 14, background: theme.line, margin: '0 6px' }}/>}
          {projects.map((p) => {
            const on = projs.includes(p.id);
            return (
              <button key={p.id} onClick={() => toggle(projs, setProjs, p.id)} style={chipStyle(on, p.color)}>
                <Icon.folder size={10}/>{p.name}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ color: theme.mute, fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {['Date','Merchant','Category','Project','GST','Total'].map((h, i) => (
                <th key={h} style={{
                  padding: i === 0 ? '12px 8px 12px 28px' : i === 5 ? '12px 28px 12px 8px' : '12px 8px',
                  borderBottom: `1px solid ${theme.line}`, fontWeight: 600,
                  textAlign: i >= 4 ? 'right' : 'left',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {receipts.map((r) => {
              const cat = r.category_id ? catMap[r.category_id] : null;
              const proj = r.project_id ? projMap[r.project_id] : null;
              const hasNote = !!(r.note && r.note.trim());
              const warranty = warrantyInfo(r.date, r.warranty_months);
              return (
                <tr key={r.id} style={{ borderBottom: `1px solid ${theme.line}` }}>
                  <td style={{ padding: '10px 8px 10px 28px', verticalAlign: 'top' }}>
                    <Mono size={11} color={theme.mute}>{fmtDate(r.date, { style: 'medium' })}</Mono>
                  </td>
                  <td style={{ padding: '10px 8px' }}>
                    <Link to={'/receipts/' + r.id} style={{ color: theme.ink, fontWeight: 500, textDecoration: 'none' }}>{r.merchant}</Link>
                    {r.location && <div style={{ fontSize: 10, color: theme.mute }}>{r.location}</div>}
                    {hasNote && (
                      <div style={{
                        display: 'flex', alignItems: 'flex-start', gap: 5, marginTop: 4,
                        fontSize: 11, color: theme.mute, lineHeight: 1.4,
                        maxWidth: 420,
                      }}>
                        <span style={{ display: 'flex', marginTop: 2, flexShrink: 0, opacity: 0.7 }}>
                          <Icon.note size={10}/>
                        </span>
                        <span style={{
                          overflow: 'hidden', textOverflow: 'ellipsis',
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                        }}>{r.note}</span>
                      </div>
                    )}
                    {warranty && (
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 4,
                        fontSize: 10, fontWeight: 600,
                        color: warranty.inWarranty ? theme.pos : theme.neg,
                      }}>
                        <span style={{
                          width: 6, height: 6, borderRadius: 6,
                          background: 'currentColor', flexShrink: 0,
                        }}/>
                        {warranty.label}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '10px 8px' }}>
                    {cat ? <Tag name={cat.name} color={cat.color} theme={theme} size="xs"/> : <span style={{ color: theme.faint, fontSize: 11 }}>—</span>}
                  </td>
                  <td style={{ padding: '10px 8px' }}>
                    {proj ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: proj.color, fontSize: 11, fontWeight: 500 }}>
                        <Dot color={proj.color} size={6}/>{proj.name}
                      </span>
                    ) : <span style={{ color: theme.faint, fontSize: 11 }}>—</span>}
                  </td>
                  <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                    <Mono size={11} color={theme.mute}>{fmtNZD(Number(r.gst) || 0)}</Mono>
                  </td>
                  <td style={{ padding: '10px 28px 10px 8px', textAlign: 'right' }}>
                    <Mono size={12} color={theme.ink} weight={500}>{fmtNZD(Number(r.total))}</Mono>
                  </td>
                </tr>
              );
            })}
            {!isLoading && !receipts.length && (
              <tr><td colSpan={6} style={{ padding: '48px 24px', textAlign: 'center', color: theme.mute, fontSize: 13 }}>
                No receipts. <Link to="/capture" style={{ color: theme.accent, fontWeight: 600 }}>Add one →</Link>
              </td></tr>
            )}
            {isLoading && (
              <tr><td colSpan={6} style={{ padding: 48, textAlign: 'center', color: theme.mute, fontSize: 12 }}>Loading…</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function chipStyle(on: boolean, color: string): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '4px 9px', borderRadius: 999,
    border: `1px solid ${on ? color : theme.line}`,
    background: on ? `${color}15` : 'transparent',
    color: on ? color : theme.ink,
    fontSize: 11, fontWeight: on ? 600 : 500, cursor: 'pointer', fontFamily: theme.fontSans,
  };
}
