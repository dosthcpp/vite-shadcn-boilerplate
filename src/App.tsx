import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import Index from './pages/Index';
import Login from './pages/Login';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

const isAuthed = (): boolean => {
  const expected = (import.meta as any).env?.VITE_PASSWORD as string | undefined;
  // If no password configured, allow access
  if (!expected) return true;
  const ok = localStorage.getItem('auth-ok') === '1';
  if (!ok) return false;
  const expRaw = localStorage.getItem('auth-exp');
  if (!expRaw) return false;
  const exp = Number(expRaw);
  if (Number.isNaN(exp)) return false;
  const now = Date.now();
  if (now > exp) {
    // expired
    localStorage.removeItem('auth-ok');
    localStorage.removeItem('auth-exp');
    return false;
  }
  return true;
};

const RequireAuth = () => {
  const location = useLocation();
  if (!isAuthed()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
};

const LoginGate = () => {
  if (isAuthed()) {
    return <Navigate to="/" replace />;
  }
  return <Login />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginGate />} />
          <Route element={<RequireAuth />}>
            <Route path="/" element={<Index />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
