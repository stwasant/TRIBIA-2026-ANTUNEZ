import { Link, useLocation } from 'react-router-dom';
import useStore from '../../store';
import { isSupabaseConfigured } from '../../lib/supabase';

export default function Layout({ children }) {
  const location = useLocation();
  const { users, currentUserId, setCurrentUser } = useStore();
  const currentUser = users.find(u => u.id === currentUserId);

  const navLinks = [
    { to: '/', label: '🏆 Ranking', exact: true },
    { to: '/partidos', label: '⚽ Partidos' },
    { to: '/pronosticos', label: '🎯 Pronósticos' },
    { to: '/usuarios', label: '👥 Usuarios' },
    { to: '/admin', label: '⚙️ Admin' },
  ];

  const isActive = (to, exact) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <div className="min-h-screen flex flex-col bg-gray-950">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl">⚽</span>
              <div>
                <div className="text-yellow-400 font-bold text-lg leading-tight">TRIBIA 2026</div>
                <div className="text-gray-400 text-xs">Pronósticos Mundial</div>
              </div>
            </Link>

            {/* Nav desktop */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.to, link.exact)
                      ? 'bg-yellow-500 text-gray-950'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Usuario actual */}
            <div className="flex items-center gap-2">
              {currentUser ? (
                <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-1.5">
                  <span className="text-xl">{currentUser.avatar}</span>
                  <span className="text-sm font-medium text-white hidden sm:block">{currentUser.name}</span>
                </div>
              ) : (
                <Link
                  to="/usuarios"
                  className="text-sm text-yellow-400 hover:text-yellow-300 font-medium"
                >
                  Seleccionar usuario →
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Nav móvil */}
        <nav className="md:hidden flex border-t border-gray-800">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex-1 text-center py-2 text-xs font-medium transition-colors ${
                isActive(link.to, link.exact)
                  ? 'bg-yellow-500 text-gray-950'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {link.label.split(' ')[0]}
              <div className="text-xs">{link.label.split(' ').slice(1).join(' ')}</div>
            </Link>
          ))}
        </nav>
      </header>

      {/* Banner: Supabase no configurado */}
      {!isSupabaseConfigured && (
        <div className="bg-orange-900/80 border-b border-orange-700 text-orange-200 text-xs text-center py-1.5 px-4">
          ⚠️ Modo local — Los datos solo se guardan en este dispositivo.{' '}
          <Link to="/admin" className="underline hover:text-white">Configura Supabase</Link>{' '}
          para compartir con todos.
        </div>
      )}

      {/* Contenido principal */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-4 text-center text-gray-500 text-xs">
        ⚽ Tribia 2026 · Pronósticos Mundial de Fútbol · Antunez Family
      </footer>
    </div>
  );
}
