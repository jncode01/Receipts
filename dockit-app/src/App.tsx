import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from './hooks/useAuth';
import { AppShell } from './components/AppShell';
import { LoginPage } from './pages/Login';
import { OverviewPage } from './pages/Overview';
import { ReceiptsPage } from './pages/Receipts';
import { ReceiptDetailPage } from './pages/ReceiptDetail';
import { CapturePage } from './pages/Capture';
import { CategoriesPage } from './pages/Categories';
import { ProjectsPage } from './pages/Projects';
import { ExportPage } from './pages/Export';
import { theme } from './lib/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, refetchOnWindowFocus: false },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Gate />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

function Gate() {
  const auth = useAuth();
  if (auth.loading) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: theme.mute, fontFamily: theme.fontSans }}>Loading…</div>;
  }
  if (!auth.session) return <LoginPage />;
  return (
    <AppShell>
      <Routes>
        <Route path="/"             element={<OverviewPage />} />
        <Route path="/receipts"     element={<ReceiptsPage />} />
        <Route path="/receipts/:id" element={<ReceiptDetailPage />} />
        <Route path="/capture"      element={<CapturePage />} />
        <Route path="/categories"   element={<CategoriesPage />} />
        <Route path="/projects"     element={<ProjectsPage />} />
        <Route path="/export"       element={<ExportPage />} />
        <Route path="*"             element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
