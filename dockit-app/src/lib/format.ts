// Small util surface used across the app.

export function fmtNZD(n: number | null | undefined, { cents = true } = {}): string {
  if (n == null || isNaN(n)) return '—';
  return '$' + n.toLocaleString('en-NZ', {
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  });
}

export function fmtDate(iso: string, opts: { style?: 'short' | 'medium' | 'long' } = {}): string {
  const style = opts.style ?? 'short';
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''));
  if (style === 'long')   return d.toLocaleDateString('en-NZ', { day: 'numeric', month: 'long',  year: 'numeric' });
  if (style === 'medium') return d.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' });
  return d.toLocaleDateString('en-NZ', { day: '2-digit', month: 'short' });
}

export function sum<T>(arr: T[], fn: (x: T) => number): number {
  return arr.reduce((a, x) => a + fn(x), 0);
}

export function groupBy<T, K extends string>(arr: T[], key: (x: T) => K): Record<K, T[]> {
  return arr.reduce((acc, x) => {
    const k = key(x);
    (acc[k] = acc[k] || []).push(x);
    return acc;
  }, {} as Record<K, T[]>);
}

export function monthlySpend(receipts: { date: string; total: number }[]) {
  const m: Record<string, number> = {};
  for (const r of receipts) {
    const k = r.date.slice(0, 7);
    m[k] = (m[k] || 0) + r.total;
  }
  return Object.keys(m).sort().map((k) => ({ month: k, total: m[k] }));
}

// Today as YYYY-MM-DD in local tz
export function todayISO(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 10);
}
