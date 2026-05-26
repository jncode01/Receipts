import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useReceipts, useCategories, useProjects } from '../hooks/useData';
import { fmtNZD, fmtDate, monthlySpend } from '../lib/format';
import { theme } from '../lib/theme';
import { Panel, Donut, HBars, AreaChart, Money, Mono, Dot, Tag, Icon, ButtonPrimary, ButtonGhost } from '../components/ui';
import { PageHeader } from '../components/AppShell';

export function OverviewPage() {
  const { data: receipts = [] } = useReceipts();
  const { data: categories = [] } = useCategories();
  const { data: projects = [] } = useProjects();

  const catMap = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c])), [categories]);
  const projMap = useMemo(() => Object.fromEntries(projects.map(p => [p.id, p])), [projects]);

  const total = receipts.reduce((a, r) => a + Number(r.total), 0);
  const totalGST = receipts.reduce((a, r) => a + (Number(r.gst) || 0), 0);
  const monthly = monthlySpend(receipts.map(r => ({ date: r.date, total: Number(r.total) })));

  const byCat = receipts.reduce<Record<string, number>>((acc, r) => {
    const id = r.category_id || 'uncategorised';
    acc[id] = (acc[id] || 0) + Number(r.total);
    return acc;
  }, {});
  const catRows = Object.entries(byCat).map(([id, v]) => ({
    value: v, color: catMap[id]?.color || '#999', label: catMap[id]?.name || 'Uncategorised', id,
  })).sort((a, b) => b.value - a.value);

  return (
    <div style={{ padding: '22px 28px' }}>
      <PageHeader sub="Last 6 months" title="Overview"
        right={
          <div style={{ display: 'flex', gap: 8 }}>
            <Link to="/export"><ButtonGhost theme={theme} icon={Icon.download}>Export</ButtonGhost></Link>
            <Link to="/capture"><ButtonPrimary theme={theme} icon={Icon.camera}>Add receipt</ButtonPrimary></Link>
          </div>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
        <Panel theme={theme}>
          <div style={{ fontSize: 11, color: theme.mute, fontWeight: 600, marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Spent</div>
          <Money amount={total} size={24} theme={theme}/>
        </Panel>
        <Panel theme={theme}>
          <div style={{ fontSize: 11, color: theme.mute, fontWeight: 600, marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>GST claimable</div>
          <Money amount={totalGST} size={24} theme={theme} color={theme.pos}/>
        </Panel>
        <Panel theme={theme}>
          <div style={{ fontSize: 11, color: theme.mute, fontWeight: 600, marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Receipts</div>
          <Mono size={24} color={theme.ink}>{receipts.length}</Mono>
        </Panel>
        <Panel theme={theme}>
          <div style={{ fontSize: 11, color: theme.mute, fontWeight: 600, marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Projects</div>
          <Mono size={24} color={theme.ink}>{projects.length}</Mono>
        </Panel>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 16, marginBottom: 16 }}>
        <Panel theme={theme} label="Monthly spend">
          {monthly.length ? <AreaChart data={monthly} color={theme.accent} theme={theme} w={700} h={200}/> : <Empty label="No receipts yet"/>}
        </Panel>
        <Panel theme={theme} label="By category">
          {catRows.length ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Donut data={catRows.map(c => ({ value: c.value, color: c.color }))} size={150} thickness={18}/>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {catRows.slice(0, 6).map(c => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12 }}>
                    <Dot color={c.color} size={7}/>
                    <span style={{ flex: 1, color: theme.ink }}>{c.label}</span>
                    <Mono size={11} color={theme.mute}>{Math.round(c.value/total*100)}%</Mono>
                  </div>
                ))}
              </div>
            </div>
          ) : <Empty label="No categories used"/>}
        </Panel>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 16 }}>
        <Panel theme={theme} label="Project budgets">
          {projects.length ? (
            <HBars theme={theme}
              valueFmt={(v) => fmtNZD(v, { cents: false })}
              rows={projects.map(p => {
                const v = receipts.filter(r => r.project_id === p.id).reduce((a, r) => a + Number(r.total), 0);
                return { label: p.name, value: v, color: p.color, cap: p.budget };
              })}
            />
          ) : <Empty label="No projects yet"/>}
        </Panel>
        <Panel theme={theme} label="Recent" action={<Link to="/receipts" style={{ color: theme.accent, fontSize: 11, fontWeight: 600, textDecoration: 'none' }}>See all →</Link>}>
          {receipts.length ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {receipts.slice(0, 5).map((r, i, arr) => {
                const cat = r.category_id ? catMap[r.category_id] : null;
                return (
                  <Link key={r.id} to={'/receipts/' + r.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
                    borderBottom: i < arr.length - 1 ? `1px solid ${theme.line}` : 'none',
                    textDecoration: 'none', color: 'inherit',
                  }}>
                    <Dot color={cat?.color || theme.faint} size={9}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ fontWeight: 500, color: theme.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.merchant}</span>
                        <Mono size={12} color={theme.ink}>{fmtNZD(Number(r.total))}</Mono>
                      </div>
                      <div style={{ fontSize: 10, color: theme.mute, marginTop: 2 }}>
                        {cat?.name || '—'} · {fmtDate(r.date, { style: 'short' })}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : <Empty label="No receipts yet" cta="Add your first" to="/capture"/>}
        </Panel>
      </div>
    </div>
  );
}

function Empty({ label, cta, to }: { label: string; cta?: string; to?: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '24px 0', color: theme.mute, fontSize: 13 }}>
      <div style={{ marginBottom: cta ? 12 : 0 }}>{label}</div>
      {cta && to && (
        <Link to={to} style={{ color: theme.accent, fontWeight: 600, textDecoration: 'none', fontSize: 13 }}>{cta} →</Link>
      )}
    </div>
  );
}
