import { NavLink, useLocation } from 'react-router-dom';
import { Icon } from './ui';
import { useAuth } from '../hooks/useAuth';
import { theme } from '../lib/theme';

const items = [
  { to: '',           l: 'Overview',   i: Icon.spark  },
  { to: 'receipts',   l: 'Receipts',   i: Icon.folder },
  { to: 'projects',   l: 'Projects',   i: Icon.pin    },
  { to: 'categories', l: 'Categories', i: Icon.tag    },
  { to: 'export',     l: 'Export',     i: Icon.download },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const loc = useLocation();
  const isMobile = window.matchMedia('(max-width: 720px)').matches;

  return (
    <div style={{
      minHeight: '100vh', background: theme.bg, color: theme.ink,
      fontFamily: theme.fontSans, display: 'flex', flexDirection: isMobile ? 'column' : 'row',
    }}>
      {!isMobile && <Sidebar onSignOut={() => auth.signOut()} />}
      <main style={{ flex: 1, minWidth: 0, paddingBottom: isMobile ? 80 : 0 }}>
        {children}
      </main>
      {isMobile && <BottomTabs path={loc.pathname} />}
    </div>
  );
}

function Sidebar({ onSignOut }: { onSignOut: () => void }) {
  return (
    <aside style={{
      width: 220, minHeight: '100vh', background: theme.sub,
      borderRight: `1px solid ${theme.line}`,
      padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 6px 18px' }}>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: theme.ink, color: theme.panel, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>D</div>
        <div style={{ fontWeight: 600, fontSize: 15 }}>Dockit</div>
      </div>
      {items.map((it) => (
        <NavLink key={it.l} to={'/' + it.to} end={it.to === ''} style={({ isActive }) => ({
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 10px', borderRadius: 8,
          background: isActive ? theme.tag : 'transparent',
          color: isActive ? theme.ink : theme.mute,
          fontSize: 13, fontWeight: isActive ? 600 : 500,
          textDecoration: 'none',
        })}>
          <it.i size={15} />
          <span>{it.l}</span>
        </NavLink>
      ))}
      <div style={{ flex: 1 }} />
      <button onClick={onSignOut} style={{
        padding: '8px 10px', borderRadius: 8, border: 'none', background: 'transparent',
        color: theme.mute, fontSize: 12, cursor: 'pointer', textAlign: 'left', fontFamily: theme.fontSans,
      }}>Sign out</button>
    </aside>
  );
}

function BottomTabs({ path }: { path: string }) {
  const tabs = [
    { to: '/',           l: 'Home',     i: Icon.spark  },
    { to: '/receipts',   l: 'Receipts', i: Icon.folder },
    { to: '/capture',    l: '',         i: Icon.camera, fab: true },
    { to: '/projects',   l: 'Projects', i: Icon.pin    },
    { to: '/categories', l: 'More',     i: Icon.dots   },
  ];
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'rgba(247,244,238,0.92)', backdropFilter: 'blur(14px)',
      borderTop: `1px solid ${theme.line}`,
      padding: '8px 12px max(env(safe-area-inset-bottom, 8px), 8px)',
      display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', zIndex: 10,
    }}>
      {tabs.map((tb) => {
        const active = tb.to === '/' ? path === '/' : path.startsWith(tb.to);
        if (tb.fab) {
          return (
            <NavLink key={tb.to} to={tb.to} style={{ transform: 'translateY(-18px)' }}>
              <div style={{
                width: 56, height: 56, borderRadius: 28, background: theme.accent, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 6px 20px ${theme.accent}55, 0 2px 6px rgba(0,0,0,0.15)`,
              }}>
                <tb.i size={22} />
              </div>
            </NavLink>
          );
        }
        return (
          <NavLink key={tb.to} to={tb.to} style={{
            color: active ? theme.accent : theme.mute,
            textDecoration: 'none',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            fontSize: 10, fontWeight: 500, padding: '4px 8px',
          }}>
            <tb.i size={18} />
            {tb.l}
          </NavLink>
        );
      })}
    </nav>
  );
}

export function PageHeader({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18, gap: 12, flexWrap: 'wrap' }}>
      <div>
        {sub && <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: theme.mute, marginBottom: 4 }}>{sub}</div>}
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', color: theme.ink }}>{title}</h1>
      </div>
      {right && <div>{right}</div>}
    </div>
  );
}
