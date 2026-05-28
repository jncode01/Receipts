import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useReceipt, useCategories, useProjects, useReceiptMutations, getImageUrl } from '../hooks/useData';
import { fmtNZD, fmtDate, warrantyInfo } from '../lib/format';
import { theme } from '../lib/theme';
import { Money, Mono, Dot, Tag, Icon, ButtonGhost, ButtonPrimary, Panel } from '../components/ui';

function useIsMobile(breakpoint = 720) {
  const get = () => typeof window !== 'undefined' && window.matchMedia(`(max-width: ${breakpoint}px)`).matches;
  const [m, setM] = useState(get);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const h = () => setM(mq.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, [breakpoint]);
  return m;
}

export function ReceiptDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { data: r, isLoading } = useReceipt(id);
  const { data: categories = [] } = useCategories();
  const { data: projects = [] } = useProjects();
  const { update, remove } = useReceiptMutations();

  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState(false);
  useEffect(() => {
    if (r?.image_path) getImageUrl(r.image_path).then(setImgUrl).catch(() => setImgUrl(null));
  }, [r?.image_path]);

  const isPdf = !!r?.image_path && /\.pdf($|\?)/i.test(r.image_path);

  useEffect(() => {
    if (!lightbox) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightbox(false); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [lightbox]);

  // ── Edit state ─────────────────────────────────────────────────────────
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>(null);
  const [tagInput, setTagInput] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);

  // Initialise the form from the loaded receipt on enter-edit
  function startEdit() {
    if (!r) return;
    setForm({
      date: r.date,
      merchant: r.merchant,
      total: String(r.total),
      gstClaimable: r.gst != null,
      location: r.location || '',
      warranty_months: r.warranty_months ? String(r.warranty_months) : '',
      category_id: r.category_id,
      project_id: r.project_id,
      tags: [...r.tags],
      note: r.note || '',
    });
    setEditing(true);
  }
  function cancelEdit() { setEditing(false); setForm(null); setTagInput(''); setSaveError(null); }
  async function saveEdit() {
    if (!r || !form) return;
    setSaveError(null);
    try {
      await update.mutateAsync({
        id: r.id,
        patch: {
          date: form.date,
          merchant: form.merchant,
          total: Number(form.total),
          gst: form.gstClaimable ? Math.round(Number(form.total) * 15) / 100 : null,
          location: form.location || null,
          warranty_months: form.warranty_months ? Number(form.warranty_months) : null,
          category_id: form.category_id,
          project_id: form.project_id,
          tags: form.tags,
          note: form.note || null,
        },
      });
      setEditing(false); setForm(null); setTagInput(''); setSaveError(null);
    } catch (err: any) {
      setSaveError(err?.message || 'Save failed. Please try again.');
    }
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
    <div style={{ padding: isMobile ? '14px 16px 80px' : '20px 28px 80px', maxWidth: 880, margin: '0 auto' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: isMobile ? 14 : 18, flexWrap: 'wrap' }}>
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
            {saveError && (
              <span style={{ color: theme.neg, fontSize: 11, flexBasis: '100%', marginTop: 2 }}>
                {saveError}
              </span>
            )}
          </>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: imgUrl && !isMobile ? 'minmax(0, 260px) minmax(0, 1fr)' : '1fr',
        gap: isMobile ? 16 : 24,
      }}>
        {imgUrl && (
          <div style={{
            position: isMobile ? 'static' : 'sticky', top: 24,
            borderRadius: 6, overflow: 'hidden', background: theme.sub,
            border: `1px solid ${theme.line}`, alignSelf: 'flex-start',
            maxWidth: isMobile ? 240 : undefined,
            margin: isMobile ? '0 auto' : undefined,
            width: isMobile ? '100%' : undefined,
          }}>
            {isPdf ? (
              <div>
                <object
                  data={imgUrl + '#toolbar=0&navpanes=0&view=FitH'}
                  type="application/pdf"
                  style={{ width: '100%', height: 360, display: 'block', background: theme.panel }}
                >
                  <div style={{
                    padding: '32px 18px', textAlign: 'center',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                    fontSize: 12, color: theme.mute,
                  }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 10, background: theme.tag,
                      color: theme.mute, display: 'grid', placeItems: 'center',
                    }}>
                      <Icon.pdf size={20}/>
                    </div>
                    <div style={{ color: theme.ink, fontWeight: 600, fontSize: 13 }}>PDF receipt</div>
                    <div>Inline preview unavailable.</div>
                  </div>
                </object>
                <div style={{
                  display: 'flex', gap: 6, padding: 8,
                  borderTop: `1px solid ${theme.line}`, background: theme.panel,
                }}>
                  <button onClick={() => setLightbox(true)} style={previewBtnStyle}>
                    <Icon.expand size={11}/> Enlarge
                  </button>
                  <a href={imgUrl} target="_blank" rel="noreferrer" style={{ ...previewBtnStyle, textDecoration: 'none' }}>
                    <Icon.download size={11}/> Open
                  </a>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setLightbox(true)}
                title="Click to enlarge"
                style={{
                  display: 'block', width: '100%', padding: 0, border: 'none',
                  background: 'transparent', cursor: 'zoom-in',
                }}
              >
                <img src={imgUrl} alt="receipt" style={{ width: '100%', display: 'block' }}/>
              </button>
            )}
          </div>
        )}

        {/* RIGHT — read mode vs edit mode */}
        {!editing ? (
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: theme.mute, marginBottom: 6 }}>
              {fmtDate(r.date, { style: 'long' })}
            </div>
            <h1 style={{ margin: '0 0 4px', fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em' }}>{r.merchant}</h1>
            {r.location && <div style={{ fontSize: 13, color: theme.mute, marginBottom: 10 }}>{r.location}</div>}

            {(() => {
              const w = warrantyInfo(r.date, r.warranty_months);
              if (!w) return null;
              return (
                <div style={{ marginBottom: 16 }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    padding: '6px 11px', borderRadius: 8,
                    background: w.inWarranty ? `${theme.pos}14` : `${theme.neg}12`,
                    border: `1px solid ${w.inWarranty ? theme.pos + '30' : theme.neg + '30'}`,
                    color: w.inWarranty ? theme.pos : theme.neg,
                    fontSize: 12, fontWeight: 600,
                  }}>
                    <span style={{ width: 7, height: 7, borderRadius: 7, background: 'currentColor', display: 'inline-block', flexShrink: 0 }}/>
                    {w.label}
                  </div>
                </div>
              );
            })()}

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
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <Field label="Merchant" value={form.merchant} onChange={(v) => setForm({ ...form, merchant: v })} wide/>
              <Field label="Date" type="date" value={form.date} onChange={(v) => setForm({ ...form, date: v })}/>
              <Field label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })}/>
              <Field label="Total" type="number" prefix="$" value={form.total} onChange={(v) => setForm({ ...form, total: v })}/>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: theme.mute }}>GST</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px', borderRadius: 8, border: `1px solid ${theme.line}`, background: theme.sub, cursor: 'pointer' }}
                  onClick={() => setForm({ ...form, gstClaimable: !form.gstClaimable })}>
                  <input type="checkbox" checked={form.gstClaimable} readOnly style={{ cursor: 'pointer', accentColor: theme.accent, width: 14, height: 14 }}/>
                  <span style={{ fontSize: 13, color: theme.ink, flex: 1 }}>Claimable</span>
                  {form.gstClaimable && form.total && (
                    <span style={{ fontSize: 12, color: theme.mute, fontFamily: theme.fontMono }}>
                      {fmtNZD(Math.round(Number(form.total) * 15) / 100)}
                    </span>
                  )}
                </div>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: theme.mute }}>Warranty</span>
                <div style={{ display: 'flex', alignItems: 'center', padding: '0 10px', borderRadius: 8, border: `1px solid ${theme.line}`, background: theme.sub }}>
                  <input type="number" min="0" value={form.warranty_months} onChange={(e) => setForm({ ...form, warranty_months: e.target.value })}
                    placeholder="0"
                    style={{ flex: 1, border: 'none', background: 'transparent', padding: '9px 0', color: theme.ink, fontSize: 13, fontFamily: theme.fontSans, outline: 'none', minWidth: 0 }}/>
                  <span style={{ color: theme.mute, fontSize: 12, fontFamily: theme.fontMono, marginLeft: 4, flexShrink: 0 }}>mo</span>
                </div>
              </label>
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

      {lightbox && imgUrl && (
        <div
          onClick={() => setLightbox(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(20,18,15,0.86)',
            display: 'grid', placeItems: 'center',
            padding: 32, animation: 'lbFade 120ms ease-out',
            cursor: 'zoom-out',
          }}
        >
          <style>{`@keyframes lbFade { from { opacity: 0 } to { opacity: 1 } }`}</style>
          <button
            onClick={(e) => { e.stopPropagation(); setLightbox(false); }}
            aria-label="Close"
            style={{
              position: 'absolute', top: 18, right: 20,
              width: 36, height: 36, borderRadius: 999,
              border: 'none', background: 'rgba(255,255,255,0.12)',
              color: '#fff', cursor: 'pointer',
              display: 'grid', placeItems: 'center',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Icon.close size={14}/>
          </button>
          <a
            href={imgUrl} target="_blank" rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute', top: 18, right: 64,
              padding: '8px 12px', borderRadius: 999,
              background: 'rgba(255,255,255,0.12)', color: '#fff',
              fontSize: 11, fontWeight: 600, fontFamily: theme.fontSans,
              textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6,
              backdropFilter: 'blur(8px)',
            }}
          >
            <Icon.download size={11}/> Open in new tab
          </a>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '92vw', maxHeight: '88vh',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'default',
            }}
          >
            {isPdf ? (
              <iframe
                src={imgUrl}
                title="receipt PDF"
                style={{
                  width: 'min(900px, 92vw)', height: '88vh',
                  border: 'none', borderRadius: 8, background: '#fff',
                  boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
                }}
              />
            ) : (
              <img
                src={imgUrl}
                alt="receipt enlarged"
                style={{
                  maxWidth: '92vw', maxHeight: '88vh',
                  display: 'block', objectFit: 'contain',
                  borderRadius: 4,
                  boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const previewBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 5,
  padding: '5px 10px', borderRadius: 6,
  border: `1px solid ${theme.line}`, background: theme.sub,
  color: theme.ink, fontSize: 11, fontWeight: 500, fontFamily: theme.fontSans,
  cursor: 'pointer', flex: 1, justifyContent: 'center',
};

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
