import { useState } from 'react';
import useStore from '../store';
import { isSupabaseConfigured } from '../lib/supabase';

const AVATARS = ['⚽','🦁','🐯','🦊','🦅','🐉','🦈','🐺','🦋','🌟','🔥','💫','🎯','👑','🏆','🎪','🤠','🧙','🦝','🐸','🦜','🐻','🦩','🐧'];

export default function Usuarios() {
  const { users, currentUserId, addUser, removeUser, setCurrentUser } = useStore();
  const [showForm, setShowForm] = useState(false);
  // Solo quien desbloqueó Admin con el PIN puede eliminar usuarios
  const adminUnlocked =
    typeof sessionStorage !== 'undefined' && sessionStorage.getItem('tribia-admin-unlocked') === '1';
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('⚽');

  const handleAdd = async () => {
    if (!name.trim()) return;
    const id = await addUser(name, avatar);
    if (id) setCurrentUser(id);
    setName('');
    setAvatar('⚽');
    setShowForm(false);
  };

  const handleRemove = (userId, userName) => {
    if (window.confirm(`¿Eliminar a ${userName} y todos sus pronósticos?`)) {
      removeUser(userId);
    }
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <span>👥</span> Usuarios
        </h1>
        <button onClick={() => setShowForm(v => !v)} className="btn-primary">
          + Nuevo usuario
        </button>
      </div>

      {/* Formulario de nuevo usuario */}
      {showForm && (
        <div className="card border-yellow-900/40 bg-yellow-950/10">
          <h3 className="font-bold text-white mb-4">Crear nuevo participante</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1">Nombre</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                placeholder="Tu nombre o apodo"
                className="input"
                maxLength={30}
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-2">Elige tu avatar</label>
              <div className="flex flex-wrap gap-2">
                {AVATARS.map(a => (
                  <button
                    key={a}
                    onClick={() => setAvatar(a)}
                    className={`text-2xl p-2 rounded-lg border-2 transition-all ${
                      avatar === a ? 'border-yellow-500 bg-yellow-500/20 scale-110' : 'border-gray-700 hover:border-gray-500'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleAdd} disabled={!name.trim()} className="btn-primary flex-1">
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de usuarios */}
      {users.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">👤</div>
          <p className="text-gray-400 mb-2">No hay participantes aún</p>
          <p className="text-xs text-gray-600">Crea un usuario para empezar a pronosticar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map(user => (
            <div
              key={user.id}
              className={`card flex items-center gap-4 transition-all ${
                user.id === currentUserId
                  ? 'border-yellow-500/60 bg-yellow-950/20'
                  : 'hover:border-gray-700'
              }`}
            >
              <span className="text-4xl">{user.avatar}</span>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white flex items-center gap-2">
                  {user.name}
                  {user.id === currentUserId && (
                    <span className="badge bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-xs">
                      Activo
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  Desde {new Date(user.createdAt).toLocaleDateString('es-ES', { day:'numeric', month:'short', year:'numeric' })}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {user.id !== currentUserId && (
                  <button
                    onClick={() => setCurrentUser(user.id)}
                    className="btn-secondary text-sm py-1.5 px-3"
                  >
                    Seleccionar
                  </button>
                )}
                {user.id === currentUserId && (
                  <span className="text-yellow-400 text-sm font-medium">✓ Seleccionado</span>
                )}
                {adminUnlocked && (
                  <button
                    onClick={() => handleRemove(user.id, user.name)}
                    className="text-gray-600 hover:text-red-400 transition-colors p-1"
                    title="Eliminar usuario (admin)"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      <div className="card bg-gray-900/50 text-sm">
        <p className="text-gray-400">
          {isSupabaseConfigured
            ? <>☁️ Los usuarios se guardan en <strong className="text-white">Supabase</strong> y se comparten en tiempo real entre todos los dispositivos.</>
            : <>💡 Los datos se guardan localmente en este dispositivo. Configura <strong className="text-white">Supabase</strong> para sincronizar entre todos.</>}
        </p>
      </div>
    </div>
  );
}
