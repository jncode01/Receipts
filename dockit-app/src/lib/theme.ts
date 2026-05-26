// Single source of truth for theme tokens. No dark-mode hook yet — wire one
// in by reading prefers-color-scheme or a localStorage flag and swapping the
// returned object.

export type Theme = ReturnType<typeof makeTheme>;

export function makeTheme(opts: { dark?: boolean; accent?: string; density?: 'compact' | 'regular' | 'comfy' } = {}) {
  const dark = !!opts.dark;
  const accent = opts.accent ?? '#3F6E5A';
  const density = opts.density ?? 'regular';
  const rowH = density === 'compact' ? 38 : density === 'comfy' ? 52 : 44;

  return {
    dark, accent, density, rowH,
    ink:    dark ? '#EDEAE3' : '#1A1714',
    mute:   dark ? 'rgba(237,234,227,0.62)' : 'rgba(26,23,20,0.58)',
    faint:  dark ? 'rgba(237,234,227,0.42)' : 'rgba(26,23,20,0.38)',
    bg:     dark ? '#161310' : '#F7F4EE',
    panel:  dark ? '#1F1B17' : '#FFFFFF',
    sub:    dark ? '#1A1714' : '#FAF7F1',
    line:   dark ? 'rgba(237,234,227,0.10)' : 'rgba(26,23,20,0.08)',
    lineStrong: dark ? 'rgba(237,234,227,0.16)' : 'rgba(26,23,20,0.14)',
    pos: '#2F8B5C',
    neg: '#C25040',
    tag: dark ? 'rgba(237,234,227,0.08)' : 'rgba(26,23,20,0.05)',
    fontSans: '"Geist", ui-sans-serif, system-ui, -apple-system, sans-serif',
    fontMono: '"Geist Mono", ui-monospace, "SF Mono", Menlo, monospace',
  };
}

export const theme = makeTheme();
