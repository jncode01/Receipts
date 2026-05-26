import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { theme } from '../lib/theme';
import { ButtonPrimary } from '../components/ui';

export function LoginPage() {
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent]   = useState(false);
  const [err, setErr]     = useState<string | null>(null);
  const [busy, setBusy]   = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const { error } = await auth.signIn(email.trim());
    setBusy(false);
    if (error) setErr(error.message);
    else setSent(true);
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'grid', placeItems: 'center',
      background: theme.bg, color: theme.ink, fontFamily: theme.fontSans, padding: 24,
    }}>
      <div style={{
        width: '100%', maxWidth: 360,
        background: theme.panel, border: `1px solid ${theme.line}`,
        borderRadius: 14, padding: '32px 28px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: theme.ink, color: theme.panel, display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 16 }}>D</div>
          <div style={{ fontSize: 20, fontWeight: 600 }}>Dockit</div>
        </div>
        <h1 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em' }}>
          {sent ? 'Check your email' : 'Sign in'}
        </h1>
        <p style={{ margin: '0 0 22px', fontSize: 13, color: theme.mute, lineHeight: 1.5 }}>
          {sent
            ? <>We sent a magic link to <b>{email}</b>. Open it on this device to finish signing in.</>
            : <>We'll email you a magic link — no password to remember.</>}
        </p>

        {!sent && (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              type="email" required autoFocus placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)}
              style={{
                padding: '10px 12px', borderRadius: 8, border: `1px solid ${theme.lineStrong}`,
                background: theme.sub, color: theme.ink, fontSize: 14, fontFamily: theme.fontSans, outline: 'none',
              }}
            />
            {err && <div style={{ fontSize: 12, color: theme.neg }}>{err}</div>}
            <ButtonPrimary theme={theme} disabled={busy} style={{ justifyContent: 'center', padding: '11px 14px' }}>
              {busy ? 'Sending…' : 'Send magic link'}
            </ButtonPrimary>
          </form>
        )}
      </div>
    </div>
  );
}
