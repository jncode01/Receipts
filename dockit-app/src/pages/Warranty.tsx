import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useReceipts, useCategories, useProjects, type ReceiptFilter } from '../hooks/useData';
import { fmtNZD, fmtDate, warrantyInfo } from '../lib/format';
import { theme } from '../lib/theme';
import { Icon, Mono, Dot, Tag } from '../components/ui';
import { PageHeader } from '../components/AppShell';

const DATE_PRESETS: [string, { from: string; to: string } | null][] = [
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

type StatusFilter = 'all' | 'active' | 'expired';

export function WarrantyPage() {
  const [search, setSearch] = useState('');
  const [preset, setPreset] = useState<string>('All');
  const [cats, setCats] = useState<string[]>([]);
  const [projs, setProjs] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const { data: categories = [] } = useCategories();
  const { data: projects = [] }   = useProjects();

  const filter: ReceiptFilter = useMemo(() => {
    const p = DATE_PRESETS.find(([k]) => k === preset)?.[1] || null;
    return {
      search: search || undefined,
      from: p?.from, to: p?.to,
      categoryIds: cats.length ? cats : undefined,
      projectIds:  projs.length ? projs : undefined,
    };
  }, [search, preset, cats, projs]);

  const { data: allReceipts = [], isLoading } = useReceipts(filter);

  const catMap  = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c])), [categories]);
  const projMap = useMemo(() => Object.fromEntries(projects.map(p => [p.id, p])), [projects]);

  // Only receipts that have warranty info, optionally filtered by status
  const receipts = useMemo(() => {
    return allReceipts
      .filter(r => !!(r.warranty_months && r.warranty_months > 0))
      .filter(r => {
        if (statusFilter === 'all') return true;
        const w = warrantyInfo(r.date, r.warranty_months);
        if (!w) return false;
        return statusFilter === 'active' ? w.inWarranty : !w.inWarranty;
      })
      .sort((a, b) => {
        const wa = warrantyInfo(a.date, a.warranty_months);
        const wb = warrantyInfo(b.date, b.warranty_months);
        if (!wa || !wb) return 0;
        // Active first, then expired
        if (wa.inWarranty !== wb.inWarranty) return wa.inWarranty ? -1 : 1;
        // Within active: soonest expiry first; within expired: most recent expiry first
        const expiryA = new Date(a.date + 'T00:00:00');
        expiryA.setMonth(expiryA.getMonth() + (a.warranty_months ?? 0));
        const expiryB = new Date(b.date + 'T00:00:00');
        expiryB.setMonth(expiryB.getMonth() + (b.warranty_months ?? 0));
        return wa.inWarranty
          ? expiryA.getTime() - expiryB.getTime()
          : expiryB.getTime() - expiryA.getTime();
      });
  }, [allReceipts, statusFilter]);

  // Count active across unfiltered warranty set (before status filter)
  const allWithWarranty = useMemo(
    () => allReceipts.filter(r => !!(r.warranty_months && r.warranty_months > 0)),
    [allReceipts],
  );
  const activeCount = useMemo(
    () => allWithWarranty.filter(r => warrantyInfo(r.date, r.warranty_months)?.inWarranty).length,
    [allWithWarranty],
  );

  const toggle = (arr: string[], setArr: (v: string[]) => void, id: string) =>
    setArr(arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id]);

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ padding: '22px 28px 16px', borderBottom: `1px solid ${theme.line}` }}>
        <PageHeader
          sub="Warranty tracker"
          title={`${receipts.length} item${receipts.length !== 1 ? 's' : ''} · ${activeCount} active`}
        />

        {/* Search + date presets + status filter */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative', minWidth: 220, flex: '1 1 200px', maxWidth: 360 }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: theme.mute, display: 'flex' }}>
              <Icon.search size={13}/>
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search merchant…"
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '8px 10px 8px 30px', borderRadius: 8,
                border: `1px solid ${theme.line}`, background: theme.panel,
                color: theme.ink, fontSize: 12, fontFamily: theme.fontSans, outline: 'none',
              }}
            />
          </div>

          {/* Date preset */}
          <div style={{ display: 'inline-flex', padding: 2, background: theme.tag, borderRadius: 8 }}>
            {DATE_PRESETS.map(([k]) => {
              const on = preset === k;
              return (
                <button key={k} onClick={() => setPreset(k)} style={{
                  padding: '4px 10px', borderRadius: 6, border: 'none',
                  background: on ? theme.panel : 'transparent',
                  color: on ? theme.ink : theme.mute,
                  fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: theme.fontSans,
                  boxShadow: on ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                }}>{k}</button>
              );
            })}
          </div>

          {/* Warranty status filter */}
          <div style={{ display: 'inline-flex', padding: 2, background: theme.tag, borderRadius: 8 }}>
            {([
              ['all',     'All',     theme.ink],
              ['active',  'Active',  theme.pos],
              ['expired', 'Expired', theme.neg],
            ] as [StatusFilter, string, string][]).map(([s, label, color]) => {
              const on = statusFilter === s;
              return (
                <button key={s} onClick={() => setStatusFilter(s)} style={{
                  padding: '4px 10px', borderRadius: 6, border: 'none',
                  background: on ? theme.panel : 'transparent',
                  color: on ? color : theme.mute,
                  fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: theme.fontSans,
                  boxShadow: on ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                }}>{label}</button>
              );
            })}
          </div>
        </div>

        {/* Category + project chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12, alignItems: 'center' }}>
          {categories.map((c) => {
            const on = cats.includes(c.id);
            return (
              <button key={c.id} onClick={() => toggle(cats, setCats, c.id)} style={chipStyle(on, c.color)}>
                <Dot color={c.color} size={6}/>{c.name}
              </button>
            );
          })}
          {projects.length > 0 && (
            <span style={{ width: 1, height: 14, background: theme.line, margin: '0 6px' }}/>
          )}
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

      {/* ── Table ── */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ color: theme.mute, fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {['Date', 'Merchant', 'Category', 'Project', 'Warranty', 'Total'].map((h, i) => (
                <th key={h} style={{
                  padding: i === 0 ? '12px 8px 12px 28px' : i === 5 ? '12px 28px 12px 8px' : '12px 8px',
                  borderBottom: `1px solid ${theme.line}`, fontWeight: 600,
                  textAlign: i === 5 ? 'right' : 'left',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {receipts.map((r) => {
              const cat  = r.category_id ? catMap[r.category_id]  : null;
              const proj = r.project_id  ? projMap[r.project_id]  : null;
              const w    = warrantyInfo(r.date, r.warranty_months)!;
              return (
                <tr key={r.id} style={{ borderBottom: `1px solid ${theme.line}` }}>
                  <td style={{ padding: '10px 8px 10px 28px', verticalAlign: 'top' }}>
                    <Mono size={11} color={theme.mute}>{fmtDate(r.date, { style: 'medium' })}</Mono>
                  </td>
                  <td style={{ padding: '10px 8px' }}>
                    <Link to={'/receipts/' + r.id} style={{ color: theme.ink, fontWeight: 500, textDecoration: 'none' }}>
                      {r.merchant}
                    </Link>
                    {r.location && <div style={{ fontSize: 10, color: theme.mute }}>{r.location}</div>}
                  </td>
                  <td style={{ padding: '10px 8px' }}>
                    {cat
                      ? <Tag name={cat.name} color={cat.color} theme={theme} size="xs"/>
                      : <span style={{ color: theme.faint, fontSize: 11 }}>—</span>}
                  </td>
                  <td style={{ padding: '10px 8px' }}>
                    {proj
                      ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: proj.color, fontSize: 11, fontWeight: 500 }}>
                          <Dot color={proj.color} size={6}/>{proj.name}
                        </span>
                      )
                      : <span style={{ color: theme.faint, fontSize: 11 }}>—</span>}
                  </td>
                  <td style={{ padding: '10px 8px' }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      fontSize: 10, fontWeight: 600,
                      color: w.inWarranty ? theme.pos : theme.neg,
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: 6, background: 'currentColor', flexShrink: 0 }}/>
                      {w.label}
                    </div>
                  </td>
                  <td style={{ padding: '10px 28px 10px 8px', textAlign: 'right' }}>
                    <Mono size={12} color={theme.ink} weight={500}>{fmtNZD(Number(r.total))}</Mono>
                  </td>
                </tr>
              );
            })}

            {!isLoading && receipts.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '48px 24px', textAlign: 'center', color: theme.mute, fontSize: 13 }}>
                  {allWithWarranty.length === 0
                    ? <>No items with warranty tracked yet. Set warranty months when <Link to="/capture" style={{ color: theme.accent, fontWeight: 600 }}>adding a receipt</Link>.</>
                    : 'No items match your filters.'}
                </td>
              </tr>
            )}
            {isLoading && (
              <tr>
                <td colSpan={6} style={{ padding: 48, textAlign: 'center', color: theme.mute, fontSize: 12 }}>Loading…</td>
              </tr>
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
