import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useReceipt, useCategories, useProjects, useReceiptMutations, getImageUrl } from '../hooks/useData';
import { fmtNZD, fmtDate } from '../lib/format';
import { theme } from '../lib/theme';
import { Money, Mono, Dot, Tag, Icon, ButtonGhost, Panel } from '../components/ui';

export function ReceiptDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: r, isLoading } = useReceipt(id);
  const { data: categories = [] } = useCategories();
  const { data: projects = [] } = useProjects();
  const { remove } = useReceiptMutations();

  const [imgUrl, setImgUrl] = useState<string | null>(null);
  useEffect(() => {
    if (r?.image_path) getImageUrl(r.image_path).then(setImgUrl).catch(() => setImgUrl(null));
  }, [r?.image_path]);

  if (isLoading) return <div style={{ padding: 32, color: theme.mute }}>Loading…</div>;
  if (!r) return <div style={{ padding: 32, color: theme.mute }}>Not found. <Link to="/receipts" style={{ color: theme.accent }}>Back to receipts</Link></div>;

  const cat  = r.category_id ? categories.find(c => c.id === r.category_id) : null;
  const proj = r.project_id  ? projects.find(p   => p.id === r.project_id)  : null;

  return (
    <div style={{ padding: '20px 28px', maxWidth: 880, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
        <Link to="/receipts" style={{ color: theme.mute, display: 'flex', textDecoration: 'none' }}>
          <Icon.chevron size={14} dir={180}/>
        </Link>
        <span style={{ color: theme.mute, fontSize: 13 }}>All receipts</span>
        <div style={{ flex: 1 }}/>
        <ButtonGhost theme={theme} icon={Icon.edit}>Edit</ButtonGhost>
        <ButtonGhost theme={theme} icon={Icon.trash}
          onClick={async () => {
            if (confirm('Delete this receipt?')) {
              await remove.mutateAsync(r.id);
              navigate('/receipts');
            }
          }}>Delete</ButtonGhost>
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
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: theme.mute, marginBottom: 8 }}>Tags</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {r.tags.map(t => <Tag key={t} name={t} theme={theme} />)}
              </div>
            </div>
          )}

          {r.note && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: theme.mute, marginBottom: 8 }}>Note</div>
              <div style={{ background: theme.panel, borderRadius: 10, border: `1px solid ${theme.line}`, padding: '12px 14px', fontSize: 13, lineHeight: 1.5, color: theme.ink }}>
                {r.note}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
