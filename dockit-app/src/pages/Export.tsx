import { useState } from 'react';
import Papa from 'papaparse';
import { useReceipts, useCategories, useProjects } from '../hooks/useData';
import { fmtNZD, fmtDate } from '../lib/format';
import { theme } from '../lib/theme';
import { ButtonPrimary, ButtonGhost, Icon, Panel } from '../components/ui';
import { PageHeader } from '../components/AppShell';

export function ExportPage() {
  const [from, setFrom] = useState<string>(new Date().getFullYear() + '-04-01'); // NZ tax year start
  const [to,   setTo]   = useState<string>(new Date().toISOString().slice(0, 10));

  const { data: receipts = [] } = useReceipts({ from, to });
  const { data: categories = [] } = useCategories();
  const { data: projects = [] } = useProjects();

  const catMap = Object.fromEntries(categories.map(c => [c.id, c]));
  const projMap = Object.fromEntries(projects.map(p => [p.id, p]));

  const total = receipts.reduce((a, r) => a + Number(r.total), 0);
  const gst   = receipts.reduce((a, r) => a + (Number(r.gst) || 0), 0);

  function downloadCsv() {
    const rows = receipts.map(r => ({
      date: r.date,
      merchant: r.merchant,
      location: r.location || '',
      category: r.category_id ? catMap[r.category_id]?.name : '',
      project:  r.project_id  ? projMap[r.project_id]?.name : '',
      tags: r.tags.join(', '),
      total: Number(r.total).toFixed(2),
      gst:  r.gst != null ? Number(r.gst).toFixed(2) : '',
      note: r.note || '',
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `dockit_${from}_to_${to}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div style={{ padding: '22px 28px', maxWidth: 720, margin: '0 auto' }}>
      <PageHeader title="Export" sub="For tax returns, accountants, or backup"/>

      <Panel theme={theme} label="Date range" style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="From" value={from} onChange={setFrom}/>
          <Field label="To"   value={to}   onChange={setTo}/>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
          {[
            ['This month',     monthStart(0), today()],
            ['Last month',     monthStart(-1), monthEnd(-1)],
            ['Quarter',        monthStart(-2), today()],
            ['Tax year (NZ)',  '2025-04-01', '2026-03-31'],
          ].map(([label, f, t]) => (
            <button key={label} onClick={() => { setFrom(f); setTo(t); }} style={{
              padding: '5px 11px', borderRadius: 999, border: `1px solid ${theme.line}`,
              background: 'transparent', color: theme.ink, fontSize: 11, fontWeight: 500,
              cursor: 'pointer', fontFamily: theme.fontSans,
            }}>{label}</button>
          ))}
        </div>
      </Panel>

      <Panel theme={theme} label="Summary" style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, fontSize: 13 }}>
          <Stat label="Receipts" value={receipts.length.toString()}/>
          <Stat label="Total spend" value={fmtNZD(total)}/>
          <Stat label="GST claimable" value={fmtNZD(gst)} color={theme.pos}/>
        </div>
      </Panel>

      <Panel theme={theme} label="Formats">
        <div style={{ display: 'grid', gap: 10 }}>
          <FormatRow
            title="CSV spreadsheet"
            desc="Opens in Excel, Numbers, Google Sheets. One row per receipt."
            action={<ButtonPrimary theme={theme} onClick={downloadCsv} icon={Icon.download} disabled={!receipts.length}>Download .csv</ButtonPrimary>}
          />
          <FormatRow
            title="Tax-ready PDF"
            desc="Coming soon — a print-ready summary with totals by category and GST."
            action={<ButtonGhost theme={theme} disabled>Soon</ButtonGhost>}
          />
        </div>
      </Panel>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: theme.mute }}>{label}</span>
      <input type="date" value={value} onChange={(e) => onChange(e.target.value)}
        style={{
          padding: '8px 10px', borderRadius: 7,
          border: `1px solid ${theme.line}`, background: theme.sub,
          color: theme.ink, fontSize: 13, fontFamily: theme.fontSans, outline: 'none',
        }}/>
    </label>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: theme.mute, marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: theme.fontMono, fontSize: 20, fontWeight: 500, color: color || theme.ink, letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
}

function FormatRow({ title, desc, action }: { title: string; desc: string; action: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '14px 16px', borderRadius: 10,
      background: theme.sub, border: `1px solid ${theme.line}`,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: theme.ink }}>{title}</div>
        <div style={{ fontSize: 11, color: theme.mute, marginTop: 2 }}>{desc}</div>
      </div>
      {action}
    </div>
  );
}

function today() { return new Date().toISOString().slice(0, 10); }
function monthStart(off: number) {
  const d = new Date(); d.setMonth(d.getMonth() + off); d.setDate(1);
  return d.toISOString().slice(0, 10);
}
function monthEnd(off: number) {
  const d = new Date(); d.setMonth(d.getMonth() + off + 1); d.setDate(0);
  return d.toISOString().slice(0, 10);
}
