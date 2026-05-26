import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCategories, useProjects, useReceiptMutations, uploadReceiptImage } from '../hooks/useData';
import { parseReceipt } from '../lib/ocr';
import { todayISO } from '../lib/format';
import { theme } from '../lib/theme';
import { Icon, Dot, ButtonPrimary, ButtonGhost, Money } from '../components/ui';

type Stage = 'pick' | 'uploading' | 'scanning' | 'review';

export function CapturePage() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const { data: categories = [] } = useCategories();
  const { data: projects = [] } = useProjects();
  const { create } = useReceiptMutations();

  const [stage, setStage] = useState<Stage>('pick');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // form fields
  const [date,     setDate]     = useState(todayISO());
  const [merchant, setMerchant] = useState('');
  const [total,    setTotal]    = useState('');
  const [gst,      setGst]      = useState('');
  const [location, setLocation] = useState('');
  const [catId,    setCatId]    = useState<string | null>(null);
  const [projId,   setProjId]   = useState<string | null>(null);
  const [tags,     setTags]     = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [note,     setNote]     = useState('');

  async function onFile(f: File) {
    setImageFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setStage('uploading');
    try {
      const path = await uploadReceiptImage(f);
      setImagePath(path);
      setStage('scanning');
      const fields = await parseReceipt(path);
      if (fields) {
        if (fields.merchant) setMerchant(fields.merchant);
        if (fields.date)     setDate(fields.date);
        if (fields.total != null) setTotal(String(fields.total));
        if (fields.gst != null)   setGst(String(fields.gst));
        if (fields.location) setLocation(fields.location);
      }
      setStage('review');
    } catch (e) {
      console.error(e);
      setStage('review'); // let them fill in manually
    }
  }

  function addTag() {
    const t = tagInput.trim().replace(/^#/, '');
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput('');
  }

  async function save() {
    if (!merchant || !total) return;
    await create.mutateAsync({
      date,
      merchant,
      total: Number(total),
      gst: gst ? Number(gst) : null,
      location: location || null,
      category_id: catId,
      project_id: projId,
      tags,
      note: note || null,
      image_path: imagePath,
      ocr_status: imagePath ? 'ok' : 'skipped',
    });
    navigate('/receipts');
  }

  // ── Stage: pick ──────────────────────────────────────────────────────────
  if (stage === 'pick') {
    return (
      <div style={{ padding: '22px 24px', maxWidth: 520, margin: '0 auto' }}>
        <h1 style={{ margin: '8px 0 6px', fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>New receipt</h1>
        <p style={{ margin: '0 0 24px', color: theme.mute, fontSize: 13 }}>
          Snap a photo of the receipt — we'll read merchant, total, date and GST automatically.
        </p>

        <div style={{ display: 'grid', gap: 12 }}>
          <Tile
            icon={<Icon.camera size={22}/>}
            title="Take a photo"
            subtitle="Opens your camera"
            onClick={() => {
              const i = document.createElement('input');
              i.type = 'file'; i.accept = 'image/*'; (i as any).capture = 'environment';
              i.onchange = () => i.files?.[0] && onFile(i.files[0]);
              i.click();
            }}
          />
          <Tile
            icon={<Icon.upload size={20}/>}
            title="Upload from device"
            subtitle="JPG, PNG, HEIC, PDF"
            onClick={() => fileRef.current?.click()}
          />
          <input ref={fileRef} type="file" accept="image/*,application/pdf" style={{ display: 'none' }}
            onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          <Tile
            icon={<Icon.edit size={18}/>}
            title="Enter manually"
            subtitle="Skip the photo"
            onClick={() => setStage('review')}
            ghost
          />
        </div>
      </div>
    );
  }

  // ── Stage: uploading / scanning ─────────────────────────────────────────
  if (stage === 'uploading' || stage === 'scanning') {
    return (
      <div style={{ minHeight: '70vh', display: 'grid', placeItems: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center' }}>
          {previewUrl && (
            <div style={{
              width: 180, height: 240, margin: '0 auto 18px',
              borderRadius: 6, overflow: 'hidden',
              background: `url(${previewUrl}) center / cover`,
              boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute', inset: 0,
                background: `linear-gradient(to bottom, transparent 0, ${theme.accent}30 50%, transparent 100%)`,
                animation: 'scan 1.4s linear infinite',
              }}/>
              <style>{`@keyframes scan { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }`}</style>
            </div>
          )}
          <div style={{ fontSize: 14, fontWeight: 500, color: theme.ink }}>
            {stage === 'uploading' ? 'Uploading…' : 'Reading receipt…'}
          </div>
          <div style={{ fontSize: 12, color: theme.mute, marginTop: 4 }}>This usually takes a few seconds.</div>
        </div>
      </div>
    );
  }

  // ── Stage: review ────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '22px 24px 80px', maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>Review</h1>
        {imagePath && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 999, background: `${theme.accent}18`, color: theme.accent, fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            <Icon.spark size={10}/> Auto-filled
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: previewUrl ? '120px 1fr' : '1fr', gap: 16, marginBottom: 22 }}>
        {previewUrl && (
          <div style={{ width: 120, height: 160, borderRadius: 6, overflow: 'hidden', background: `url(${previewUrl}) center / cover`, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}/>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Merchant" value={merchant} onChange={setMerchant} placeholder="Mitre 10" />
          <Field label="Date" type="date" value={date} onChange={setDate} />
          <Field label="Total" type="number" value={total} onChange={setTotal} prefix="$" placeholder="0.00" />
          <Field label="GST" type="number" value={gst} onChange={setGst} prefix="$" placeholder="0.00" />
          <Field label="Location" value={location} onChange={setLocation} placeholder="Mt Wellington" wide/>
        </div>
      </div>

      <Section title="Category">
        <ChipRow>
          {categories.map((c) => {
            const on = catId === c.id;
            return (
              <button key={c.id} onClick={() => setCatId(on ? null : c.id)} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 11px', borderRadius: 10,
                border: `1px solid ${on ? c.color : theme.line}`,
                background: on ? `${c.color}14` : 'transparent',
                color: on ? c.color : theme.ink,
                fontSize: 12, fontWeight: on ? 600 : 500, cursor: 'pointer', fontFamily: theme.fontSans,
              }}>
                <Dot color={c.color} size={7}/> {c.name}
              </button>
            );
          })}
        </ChipRow>
      </Section>

      <Section title="Project">
        <ChipRow>
          {projects.map((p) => {
            const on = projId === p.id;
            return (
              <button key={p.id} onClick={() => setProjId(on ? null : p.id)} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 11px', borderRadius: 10,
                border: `1px solid ${on ? p.color : theme.line}`,
                background: on ? `${p.color}14` : 'transparent',
                color: on ? p.color : theme.ink,
                fontSize: 12, fontWeight: on ? 600 : 500, cursor: 'pointer', fontFamily: theme.fontSans,
              }}>
                <Icon.folder size={11}/> {p.name}
              </button>
            );
          })}
        </ChipRow>
      </Section>

      <Section title="Tags">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
          {tags.map((t) => (
            <span key={t} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '4px 8px', borderRadius: 999, background: theme.ink, color: theme.panel,
              fontSize: 11, fontWeight: 500,
            }}>
              {t}
              <button onClick={() => setTags(tags.filter(x => x !== t))} style={{ border: 'none', background: 'transparent', color: 'inherit', opacity: 0.7, cursor: 'pointer', padding: 0, display: 'flex' }}>
                <Icon.close size={10}/>
              </button>
            </span>
          ))}
          <input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); } }}
            placeholder="+ add tag"
            style={{ padding: '5px 8px', borderRadius: 999, border: `1px dashed ${theme.lineStrong}`, background: 'transparent', color: theme.ink, fontSize: 11, outline: 'none', fontFamily: theme.fontSans, width: 90 }}/>
        </div>
      </Section>

      <Section title="Note">
        <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional…"
          rows={3} style={{
            width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8,
            border: `1px solid ${theme.line}`, background: theme.sub, color: theme.ink,
            fontSize: 13, fontFamily: theme.fontSans, outline: 'none', resize: 'vertical',
          }}/>
      </Section>

      <div style={{ display: 'flex', gap: 8, marginTop: 24, justifyContent: 'flex-end' }}>
        <ButtonGhost theme={theme} onClick={() => navigate(-1)}>Cancel</ButtonGhost>
        <ButtonPrimary theme={theme} onClick={save} icon={Icon.check}
          disabled={!merchant || !total || create.isPending}>
          {create.isPending ? 'Saving…' : 'Save receipt'}
        </ButtonPrimary>
      </div>
    </div>
  );
}

function Tile({ icon, title, subtitle, onClick, ghost }: { icon: React.ReactNode; title: string; subtitle: string; onClick: () => void; ghost?: boolean }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '16px 18px', borderRadius: 12,
      background: ghost ? 'transparent' : theme.panel,
      border: `1px ${ghost ? 'dashed' : 'solid'} ${theme.line}`,
      textAlign: 'left', cursor: 'pointer', fontFamily: theme.fontSans, color: theme.ink,
    }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: ghost ? theme.tag : `${theme.accent}15`, color: ghost ? theme.mute : theme.accent, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: 12, color: theme.mute, marginTop: 2 }}>{subtitle}</div>
      </div>
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: theme.mute, marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}

function ChipRow({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{children}</div>;
}

function Field({ label, value, onChange, type = 'text', placeholder, prefix, wide }:
  { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; prefix?: string; wide?: boolean }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: wide ? '1 / -1' : undefined }}>
      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: theme.mute }}>{label}</span>
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '0 10px', borderRadius: 8,
        border: `1px solid ${theme.line}`, background: theme.sub,
      }}>
        {prefix && <span style={{ color: theme.mute, fontSize: 13, fontFamily: theme.fontMono, marginRight: 4 }}>{prefix}</span>}
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          style={{ flex: 1, border: 'none', background: 'transparent', padding: '9px 0', color: theme.ink, fontSize: 13, fontFamily: theme.fontSans, outline: 'none', minWidth: 0 }}/>
      </div>
    </label>
  );
}
