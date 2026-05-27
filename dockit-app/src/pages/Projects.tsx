import { useMemo, useState } from 'react';
import { useProjects, useProjectMutations, useReceipts } from '../hooks/useData';
import { theme } from '../lib/theme';
import { Mono, ButtonPrimary, ButtonGhost, Icon, Dot, Money, Panel } from '../components/ui';
import { PageHeader } from '../components/AppShell';
import { fmtNZD } from '../lib/format';

const PROJ_COLORS = ['#3F6E5A','#A65A2A','#2A4F8C','#7A6A4F','#8B6FAD','#5B6E8C','#C57A4F','#2BAA67'];

export function ProjectsPage() {
  const { data: projects = [] } = useProjects();
  const { data: receipts = [] } = useReceipts();
  const { add, update } = useProjectMutations();

  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: '', color: PROJ_COLORS[0], budget: '' });
  const [budgetEdit, setBudgetEdit] = useState<{ id: string; val: string } | null>(null);

  const spendByProject = useMemo(() => {
    const m: Record<string, number> = {};
    for (const r of receipts) if (r.project_id) m[r.project_id] = (m[r.project_id] || 0) + Number(r.total);
    return m;
  }, [receipts]);

  return (
    <div style={{ padding: '22px 28px', maxWidth: 900, margin: '0 auto' }}>
      <PageHeader title="Projects" sub={`${projects.length} active`}
        right={!adding && <ButtonPrimary theme={theme} icon={Icon.plus} onClick={() => setAdding(true)}>New</ButtonPrimary>}
      />

      {adding && (
        <Panel theme={theme} style={{ marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px auto', gap: 10, alignItems: 'flex-end' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: theme.mute }}>Name</span>
              <input autoFocus placeholder="Bathroom renovation"
                value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                style={inputStyle}/>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: theme.mute }}>Budget (optional)</span>
              <input type="number" placeholder="0"
                value={draft.budget} onChange={(e) => setDraft({ ...draft, budget: e.target.value })}
                style={inputStyle}/>
            </label>
            <div style={{ display: 'flex', gap: 6 }}>
              <ButtonGhost theme={theme} onClick={() => setAdding(false)}>Cancel</ButtonGhost>
              <ButtonPrimary theme={theme} icon={Icon.check}
                disabled={!draft.name}
                onClick={async () => {
                  await add.mutateAsync({ name: draft.name, color: draft.color, budget: draft.budget ? Number(draft.budget) : null });
                  setAdding(false); setDraft({ name: '', color: PROJ_COLORS[0], budget: '' });
                }}>Create</ButtonPrimary>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
            {PROJ_COLORS.map(c => (
              <button key={c} onClick={() => setDraft({ ...draft, color: c })} style={{
                width: 22, height: 22, borderRadius: 6, padding: 0,
                background: c,
                border: draft.color === c ? `2px solid ${theme.ink}` : `1px solid rgba(0,0,0,0.1)`,
                cursor: 'pointer',
              }}/>
            ))}
          </div>
        </Panel>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
        {projects.map((p) => {
          const v = spendByProject[p.id] || 0;
          const pp = p.budget ? Math.round(v / Number(p.budget) * 100) : 0;
          return (
            <div key={p.id} style={{
              background: theme.panel, border: `1px solid ${theme.line}`,
              borderRadius: 12, padding: '16px 18px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Dot color={p.color} size={9}/>
                <div style={{ flex: 1, fontWeight: 600, fontSize: 14, color: theme.ink }}>{p.name}</div>
                <button style={iconBtn} onClick={() => {
                  const next = prompt('Rename project', p.name);
                  if (next && next !== p.name) update.mutate({ id: p.id, patch: { name: next } });
                }}><Icon.edit size={13}/></button>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
                <Money amount={v} size={20} theme={theme}/>
                {budgetEdit?.id === p.id ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <span style={{ fontSize: 11, color: theme.mute, fontFamily: theme.fontMono }}>$</span>
                    <input
                      autoFocus
                      type="number"
                      value={budgetEdit.val}
                      onChange={(e) => setBudgetEdit({ ...budgetEdit, val: e.target.value })}
                      onBlur={async () => {
                        await update.mutateAsync({ id: p.id, patch: { budget: budgetEdit.val ? Number(budgetEdit.val) : null } });
                        setBudgetEdit(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.currentTarget.blur();
                        if (e.key === 'Escape') setBudgetEdit(null);
                      }}
                      style={{ width: 80, padding: '2px 4px', borderRadius: 4, border: `1px solid ${theme.line}`, background: theme.sub, color: theme.ink, fontSize: 11, fontFamily: theme.fontMono, outline: 'none' }}
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => setBudgetEdit({ id: p.id, val: p.budget != null ? String(p.budget) : '' })}
                    style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}
                  >
                    {p.budget != null
                      ? <Mono size={11} color={theme.mute}>of {fmtNZD(Number(p.budget), { cents: false })}</Mono>
                      : <span style={{ fontSize: 11, color: theme.mute, opacity: 0.6 }}>Set budget</span>}
                  </button>
                )}
              </div>
              {p.budget != null && (
                <>
                  <div style={{ height: 6, background: theme.tag, borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
                    <div style={{ width: `${Math.min(100, pp)}%`, height: '100%', background: p.color, borderRadius: 3 }}/>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: theme.mute }}>
                    <span>{receipts.filter(r => r.project_id === p.id).length} receipts</span>
                    <Mono size={10} color={pp > 90 ? theme.neg : theme.mute}>{pp}%</Mono>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {!projects.length && !adding && (
        <div style={{ padding: 48, textAlign: 'center', color: theme.mute, fontSize: 13 }}>
          No projects yet.&nbsp;<button onClick={() => setAdding(true)} style={{ border: 'none', background: 'transparent', color: theme.accent, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Create one →</button>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '8px 10px', borderRadius: 7,
  border: '1px solid rgba(26,23,20,0.14)', background: '#FAF7F1',
  color: '#1A1714', fontSize: 13, fontFamily: '"Geist", ui-sans-serif, system-ui, sans-serif', outline: 'none',
};

const iconBtn: React.CSSProperties = {
  width: 26, height: 26, borderRadius: 6, border: 'none', background: 'transparent',
  color: 'rgba(26,23,20,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
};
