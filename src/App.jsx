import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Partidos from './pages/Partidos';
import Pronosticos from './pages/Pronosticos';
import Usuarios from './pages/Usuarios';
import Admin from './pages/Admin';

export default function App() {
  return (
    <BrowserRouter basename="/TRIBIA-2026-ANTUNEZ">
      <Layout>
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
