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
      <h1 className="mb-6 text-xl font-semibold text-zinc-800">Perfil</h1>
      <form onSubmit={onSubmit} className="grid gap-4 rounded-xl border border-purple-100 bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-600">Contraseña actual</label>
          <input type="password" value={currentPassword} onChange={(e)=>setCurrentPassword(e.target.value)} 
            className="w-full rounded border border-purple-200 bg-white px-3 py-2 text-zinc-800 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-600">Nueva contraseña</label>
          <input type="password" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} 
            className="w-full rounded border border-purple-200 bg-white px-3 py-2 text-zinc-800 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" />
          <p className="mt-1 text-xs text-zinc-500">Mínimo 8 caracteres.</p>
        </div>
        {error && <div className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-600">{error}</div>}
        {success && <div className="rounded border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-600">{success}</div>}
        <div className="mt-2 flex justify-end">
          <button disabled={loading} className="btn-brand px-4 py-2 disabled:opacity-60">{loading ? 'Guardando...' : 'Guardar cambios'}</button>
        </div>
      </form>
    </div>
  );
}
