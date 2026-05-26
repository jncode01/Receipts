import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useReceipt, useCategories, useProjects, useReceiptMutations, getImageUrl } from '../hooks/useData';
import { fmtNZD, fmtDate } from '../lib/format';
import { theme } from '../lib/theme';
import { Money, Mono, Dot, Tag, Icon, ButtonGhost, ButtonPrimary, Panel } from '../components/ui';

export function ReceiptDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: r, isLoading } = useReceipt(id);
  const { data: categories = [] } = useCategories();
  const { data: projects = [] } = useProjects();
  const { update, remove } = useReceiptMutations();

  const [imgUrl, setImgUrl] = useState<string | null>(null);
  useEffect(() => {
    if (r?.image_path) getImageUrl(r.image_path).then(setImgUrl).catch(() => setImgUrl(null));
  }, [r?.image_path]);

  // ── Edit state ─────────────────────────────────────────────────────────
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>(null);
  const [tagInput, setTagInput] = useState('');

  // Initialise the form from the loaded receipt on enter-edit
  function startEdit() {
    if (!r) return;
    setForm({
      date: r.date,
      merchant: r.merchant,
      total: String(r.total),
      gst: r.gst != null ? String(r.gst) : '',
      location: r.location || '',
      category_id: r.category_id,
      project_id: r.project_id,
      tags: [...r.tags],
      note: r.note || '',
    });
    setEditing(true);
  }
  function cancelEdit() { setEditing(false); setForm(null); setTagInput(''); }
  async function saveEdit() {
    if (!r || !form) return;
    await update.mutateAsync({
      id: r.id,
      patch: {
        date: form.date,
        merchant: form.merchant,
        total: Number(form.total),
        gst: form.gst ? Number(form.gst) : null,
        location: form.location || null,
        category_id: form.category_id,
        project_id: form.project_id,
        tags: form.tags,
        note: form.note || null,
      },
    });
    setEditing(false); setForm(null); setTagInput('');
  }
  function addTag() {
    const t = tagInput.trim().replace(/^#/, '');
    if (t && form && !form.tags.includes(t)) setForm({ ...form, tags: [...form.tags, t] });
    setTagInput('');
  }

  if (isLoading) return <div style={{ padding: 32, color: theme.mute }}>Loading…</div>;
  if (!r) return <div style={{ padding: 32, color: theme.mute }}>Not found. <Link to="/receipts" style={{ color: theme.accent }}>Back to receipts</Link></div>;

  const cat  = (editing ? form.category_id : r.category_id) ? categories.find(c => c.id === (editing ? form.category_id : r.category_id)) : null;
  const proj = (editing ? form.project_id  : r.project_id)  ? projects.find(p => p.id === (editing ? form.project_id : r.project_id))   : null;

  return (
    <div style={{ padding: '20px 28px 80px', maxWidth: 880, margin: '0 auto' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
        <Link to="/receipts" style={{ color: theme.mute, display: 'flex', textDecoration: 'none' }}>
          <Icon.chevron size={14} dir={180}/>
        </Link>
        <span style={{ color: theme.mute, fontSize: 13 }}>All receipts</span>
        <div style={{ flex: 1 }}/>
        {!editing ? (
          <>
            <ButtonGhost theme={theme} icon={Icon.edit} onClick={startEdit}>Edit</ButtonGhost>
            <ButtonGhost theme={theme} icon={Icon.trash}
              onClick={async () => {
                if (confirm('Delete this receipt?')) {
                  await remove.mutateAsync(r.id);
                  navigate('/receipts');
                }
              }}>Delete</ButtonGhost>
          </>
        ) : (
          <>
            <ButtonGhost theme={theme} onClick={cancelEdit}>Cancel</ButtonGhost>
            <ButtonPrimary theme={theme} icon={Icon.check} onClick={saveEdit}
              disabled={!form?.merchant || !form?.total || update.isPending}>
              {update.isPending ? 'Saving…' : 'Save'}
            </ButtonPrimary>
          </>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: imgUrl ? 'minmax(0, 280px) minmax(0, 1fr)' : '1fr', gap: 24 }}>
        {imgUrl && (
          <div style={{
            position: 'sticky', top: 24,
            borderRadius: 6, overflow: 'hidden', background: theme.sub,
            border: `1px solid ${theme.line}`, alignSelf: 'flex-start',
          }}>
            <img src={imgUrl} alt="receipt" style={{ width: '100%', display: 'block' }}/>
          </div>
        )}

        {/* RIGHT — read mode vs edit mode */}
        {!editing ? (
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: theme.mute, marginBottom: 6 }}>
              {fmtDate(r.date, { style: 'long' })}
            </div>
            <h1 style={{ margin: '0 0 4px', fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em' }}>{r.merchant}</h1>
            {r.location && <div style={{ fontSize: 13, color: theme.mute, marginBottom: 18 }}>{r.location}</div>}

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 20, marginBottom: 24 }}>
              <Money amount={Number(r.total)} size={36} theme={theme}/>
              {r.gst != null && <div style={{ fontSize: 12, color: theme.mute }}>incl. GST <Mono size={12} color={theme.ink}>{fmtNZD(Number(r.gst))}</Mono></div>}
            </div>

            <Panel theme={theme} style={{ padding: '4px 16px', marginBottom: 16 }}>
              {[
                cat ? { l: 'Category', v: <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: cat.color, fontWeight: 600, fontSize: 13 }}><Dot color={cat.color} size={7}/> {cat.name}</span> } : null,
                proj ? { l: 'Project', v: <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: proj.color, fontWeight: 600, fontSize: 13 }}><Icon.folder size={11}/> {proj.name}</span> } : null,
                r.items ? { l: 'Items', v: <Mono size={13} color={theme.ink}>{r.items}</Mono> } : null,
              ].filter(Boolean).map((row: any, i, arr) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 0', borderBottom: i < arr.length - 1 ? `1px solid ${theme.line}` : 'none', fontSize: 13,
                }}>
                  <div style={{ color: theme.mute }}>{row.l}</div>
                  <div>{row.v}</div>
                </div>
              ))}
            </Panel>

            {r.tags.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={SectionLabel}>Tags</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {r.tags.map(t => <Tag key={t} name={t} theme={theme} />)}
                </div>
              </div>
            )}

            {r.note && (
              <div>
                <div style={SectionLabel}>Note</div>
                <div style={{ background: theme.panel, borderRadius: 10, border: `1px solid ${theme.line}`, padding: '12px 14px', fontSize: 13, lineHeight: 1.5, color: theme.ink }}>
                  {r.note}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <Field label="Merchant" value={form.merchant} onChange={(v) => setForm({ ...form, merchant: v })} wide/>
              <Field label="Date" type="date" value={form.date} onChange={(v) => setForm({ ...form, date: v })}/>
              <Field label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })}/>
              <Field label="Total" type="number" prefix="$" value={form.total} onChange={(v) => setForm({ ...form, total: v })}/>
              <Field label="GST" type="number" prefix="$" value={form.gst} onChange={(v) => setForm({ ...form, gst: v })}/>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={SectionLabel}>Category</div>
              <ChipRow>
                {categories.map((c) => {
                  const on = form.category_id === c.id;
                  return (
                    <button key={c.id} onClick={() => setForm({ ...form, category_id: on ? null : c.id })} style={pillStyle(on, c.color)}>
                      <Dot color={c.color} size={7}/> {c.name}
                    </button>
                  );
                })}
              </ChipRow>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={SectionLabel}>Project</div>
              <ChipRow>
                {projects.map((p) => {
                  const on = form.project_id === p.id;
                  return (
                    <button key={p.id} onClick={() => setForm({ ...form, project_id: on ? null : p.id })} style={pillStyle(on, p.color)}>
                      <Icon.folder size={11}/> {p.name}
                    </button>
                  );
                })}
              </ChipRow>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={SectionLabel}>Tags</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                {form.tags.map((t: string) => (
                  <span key={t} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '4px 8px', borderRadius: 999, background: theme.ink, color: theme.panel,
                    fontSize: 11, fontWeight: 500,
                  }}>
                    {t}
                    <button onClick={() => setForm({ ...form, tags: form.tags.filter((x: string) => x !== t) })}
                      style={{ border: 'none', background: 'transparent', color: 'inherit', opacity: 0.7, cursor: 'pointer', padding: 0, display: 'flex' }}>
                      <Icon.close size={10}/>
                    </button>
                  </span>
                ))}
                <input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); } }}
                  placeholder="+ add tag"
                  style={{
                    padding: '5px 8px', borderRadius: 999, border: `1px dashed ${theme.lineStrong}`,
                    background: 'transparent', color: theme.ink, fontSize: 11, outline: 'none',
                    fontFamily: theme.fontSans, width: 90,
                  }}/>
              </div>
            </div>

            <div>
              <div style={SectionLabel}>Note</div>
              <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })}
                rows={3} placeholder="Optional…"
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8,
                  border: `1px solid ${theme.line}`, background: theme.sub, color: theme.ink,
                  fontSize: 13, fontFamily: theme.fontSans, outline: 'none', resize: 'vertical',
                }}/>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const SectionLabel: React.CSSProperties = {
  fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
  color: theme.mute, marginBottom: 8,
};

function ChipRow({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{children}</div>;
}

function pillStyle(on: boolean, color: string): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '7px 11px', borderRadius: 10,
    border: `1px solid ${on ? color : theme.line}`,
    background: on ? `${color}14` : 'transparent',
    color: on ? color : theme.ink,
    fontSize: 12, fontWeight: on ? 600 : 500, cursor: 'pointer', fontFamily: theme.fontSans,
  };
}

function Field({ label, value, onChange, type = 'text', prefix, wide }:
  { label: string; value: string; onChange: (v: string) => void; type?: string; prefix?: string; wide?: boolean }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: wide ? '1 / -1' : undefined }}>
      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: theme.mute }}>{label}</span>
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '0 10px', borderRadius: 8,
        border: `1px solid ${theme.line}`, background: theme.sub,
      }}>
        {prefix && <span style={{ color: theme.mute, fontSize: 13, fontFamily: theme.fontMono, marginRight: 4 }}>{prefix}</span>}
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
          style={{ flex: 1, border: 'none', background: 'transparent', padding: '9px 0', color: theme.ink, fontSize: 13, fontFamily: theme.fontSans, outline: 'none', minWidth: 0 }}/>
      </div>
    </label>
  );
}
