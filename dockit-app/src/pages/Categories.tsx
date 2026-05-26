import { useState } from 'react';
import { useCategories, useCategoryMutations, useReceipts } from '../hooks/useData';
import { theme } from '../lib/theme';
import { Mono, ButtonPrimary, ButtonGhost, Icon } from '../components/ui';
import { PageHeader } from '../components/AppShell';
import { fmtNZD } from '../lib/format';

const COLOR_PICK = [
  '#A65A2A','#7A6A4F','#3F6E5A','#8B6FAD','#C57A4F','#5B6E8C','#B89A3E','#967A6E',
  '#2A6FDB','#E2502A','#7A4FE0','#16A19A','#E83E8C','#2BAA67','#F5C518','#475569',
];

export function CategoriesPage() {
  const { data: cats = [] } = useCategories();
  const { data: receipts = [] } = useReceipts();
  const { add, update, remove } = useCategoryMutations();

  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: '', color: COLOR_PICK[0] });
  const [editingId, setEditingId] = useState<string | null>(null);

  const counts: Record<string, number> = {};
  const totals: Record<string, number> = {};
  for (const r of receipts) {
    if (!r.category_id) continue;
    counts[r.category_id] = (counts[r.category_id] || 0) + 1;
    totals[r.category_id] = (totals[r.category_id] || 0) + Number(r.total);
  }

  return (
    <div style={{ padding: '22px 28px', maxWidth: 720, margin: '0 auto' }}>
      <PageHeader title="Categories" sub="Tag every receipt with one"
        right={!adding && <ButtonPrimary theme={theme} icon={Icon.plus} onClick={() => setAdding(true)}>New</ButtonPrimary>}
      />

      <div style={{
        background: theme.panel, border: `1px solid ${theme.line}`,
        borderRadius: 12, padding: '4px 18px',
      }}>
        {cats.map((c, i) => {
          const editing = editingId === c.id;
          return (
            <div key={c.id} style={{
              display: 'grid', gridTemplateColumns: '28px 1fr 80px 100px 60px',
              gap: 10, padding: '14px 0', alignItems: 'center',
              borderBottom: i < cats.length - 1 ? `1px solid ${theme.line}` : 'none',
            }}>
              <button onClick={() => setEditingId(editing ? null : c.id)} style={{
                width: 22, height: 22, borderRadius: 6, background: c.color,
                border: editing ? `2px solid ${theme.ink}` : `1px solid rgba(0,0,0,0.1)`,
                cursor: 'pointer', padding: 0,
              }}/>
              <div>
                {editing ? (
                  <input
                    defaultValue={c.name}
                    autoFocus
                    onBlur={(e) => { if (e.target.value !== c.name) update.mutate({ id: c.id, patch: { name: e.target.value } }); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                    style={{
                      padding: '5px 8px', borderRadius: 6, border: `1px solid ${theme.lineStrong}`,
                      background: theme.sub, color: theme.ink, fontSize: 13, fontFamily: theme.fontSans, outline: 'none',
                    }}
                  />
                ) : (
                  <span style={{ fontWeight: 500, fontSize: 13, color: theme.ink }}>{c.name}</span>
                )}
                {editing && (
                  <div style={{ marginTop: 10, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {COLOR_PICK.map(hex => (
                      <button key={hex} onClick={() => update.mutate({ id: c.id, patch: { color: hex } })} style={{
                        width: 22, height: 22, borderRadius: 6, padding: 0,
                        background: hex,
                        border: c.color === hex ? `2px solid ${theme.ink}` : `1px solid rgba(0,0,0,0.1)`,
                        cursor: 'pointer',
                      }}/>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <Mono size={12} color={theme.ink}>{counts[c.id] || 0}</Mono>
                <div style={{ fontSize: 10, color: theme.mute }}>receipts</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Mono size={12} color={theme.ink}>{fmtNZD(totals[c.id] || 0, { cents: false })}</Mono>
                <div style={{ fontSize: 10, color: theme.mute }}>total</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                <button style={iconBtn} onClick={() => setEditingId(editing ? null : c.id)}>
                  <Icon.edit size={13}/>
                </button>
                <button style={iconBtn} onClick={() => { if (confirm(`Delete "${c.name}"?`)) remove.mutate(c.id); }}>
                  <Icon.trash size={13}/>
                </button>
              </div>
            </div>
          );
        })}

        {adding && (
          <div style={{
            display: 'grid', gridTemplateColumns: '28px 1fr auto auto',
            gap: 10, padding: '14px 0', alignItems: 'center',
            borderTop: cats.length ? `1px solid ${theme.line}` : 'none',
          }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: draft.color }}/>
            <input autoFocus placeholder="Category name"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              onKeyDown={async (e) => { if (e.key === 'Enter' && draft.name) { await add.mutateAsync(draft); setAdding(false); setDraft({ name: '', color: COLOR_PICK[0] }); } }}
              style={{
                padding: '7px 10px', borderRadius: 7, border: `1px solid ${theme.lineStrong}`,
                background: theme.sub, color: theme.ink, fontSize: 13, fontFamily: theme.fontSans, outline: 'none',
              }}/>
            <ButtonGhost theme={theme} onClick={() => setAdding(false)}>Cancel</ButtonGhost>
            <ButtonPrimary theme={theme} icon={Icon.check}
              disabled={!draft.name}
              onClick={async () => { await add.mutateAsync(draft); setAdding(false); setDraft({ name: '', color: COLOR_PICK[0] }); }}>
              Save
            </ButtonPrimary>
          </div>
        )}

        {!cats.length && !adding && (
          <div style={{ padding: 24, textAlign: 'center', color: theme.mute, fontSize: 13 }}>
            No categories yet. <button onClick={() => setAdding(true)} style={{ border: 'none', background: 'transparent', color: theme.accent, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Add one →</button>
          </div>
        )}
      </div>
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  width: 26, height: 26, borderRadius: 6, border: 'none', background: 'transparent',
  color: 'rgba(26,23,20,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
};
