import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Partidos from './pages/Partidos';
import Pronosticos from './pages/Pronosticos';
import Usuarios from './pages/Usuarios';
import Admin from './pages/Admin';
import useStore from './store';
import { isSupabaseConfigured } from './lib/supabase';
import { useLiveScores } from './hooks/useLiveScores';

export default function App() {
  const { syncFromSupabase, subscribeRealtime, loading } = useStore();

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    syncFromSupabase();
    const unsubscribe = subscribeRealtime();
    return unsubscribe;
  }, []);

  // Auto-sync live/finished scores from football-data.org every 90s
  useLiveScores();

  return (
    <BrowserRouter basename="/TRIBIA-2026-ANTUNEZ">
      <Layout>
        {loading && (
          <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-yellow-500 animate-pulse" />
        )}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/partidos" element={<Partidos />} />
          <Route path="/pronosticos" element={<Pronosticos />} />
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
