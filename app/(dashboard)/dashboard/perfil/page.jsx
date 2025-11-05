"use client";

import { useState } from 'react';
import { toast } from '@/lib/toastBus';

export default function PerfilPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!currentPassword || !newPassword) { setError('Complete ambos campos'); return; }
    try {
      setLoading(true);
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Error al cambiar la contraseña');
      setCurrentPassword('');
      setNewPassword('');
      setSuccess('Contraseña actualizada');
      toast.success('Contraseña actualizada');
    } catch (e) {
      setError(e.message);
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-4 text-xl font-semibold">Perfil</h1>
      <form onSubmit={onSubmit} className="grid gap-3 rounded border border-zinc-800 p-4">
        <div>
          <label className="mb-1 block text-sm text-zinc-400">Contraseña actual</label>
          <input type="password" value={currentPassword} onChange={(e)=>setCurrentPassword(e.target.value)} className="w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 outline-none focus:border-zinc-600" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-400">Nueva contraseña</label>
          <input type="password" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} className="w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 outline-none focus:border-zinc-600" />
          <p className="mt-1 text-xs text-zinc-500">Mínimo 8 caracteres.</p>
        </div>
        {error && <div className="rounded border border-red-900 bg-red-950 p-2 text-sm text-red-300">{error}</div>}
        {success && <div className="rounded border border-emerald-900 bg-emerald-950 p-2 text-sm text-emerald-300">{success}</div>}
        <div className="mt-2 flex justify-end">
          <button disabled={loading} className="rounded bg-emerald-600 px-4 py-2 font-medium hover:bg-emerald-500 disabled:opacity-60">{loading ? 'Guardando...' : 'Guardar cambios'}</button>
        </div>
      </form>
    </div>
  );
}
