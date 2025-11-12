"use client";

import { useEffect, useState } from 'react';
import { toast } from '@/lib/toastBus';

export default function UsuariosPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ username: '', password: '', role: 'editor' });
  const [me, setMe] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/users', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Error cargando usuarios');
      setItems(json.data || []);
    } catch (e) {
      setError(e.message);
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/auth/me', { cache: 'no-store' });
        const j = await r.json();
        if (r.ok && j.success) setMe(j.data);
      } catch {}
    })();
    fetchUsers();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.username || !form.password) { setError('Usuario y contraseña requeridos'); return; }
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Error creando usuario');
      toast.success('Usuario creado');
      setForm({ username: '', password: '', role: 'editor' });
      fetchUsers();
    } catch (e) {
      setError(e.message);
      toast.error(e.message);
    }
  };

  const onChangeRole = async (id, newRole) => {
    try {
      setSavingId(id);
      const res = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Error actualizando rol');
      toast.success('Rol actualizado');
      setItems(items.map(u => u.id === id ? { ...u, role: newRole } : u));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSavingId(null);
    }
  };

  const onDelete = async (id) => {
    if (!confirm('¿Eliminar este usuario?')) return;
    try {
      setDeletingId(id);
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Error eliminando usuario');
      toast.success('Usuario eliminado');
      setItems(items.filter(u => u.id !== id));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="grid gap-6">
      <h1 className="text-xl font-semibold">Usuarios</h1>

      <form onSubmit={onSubmit} className="grid max-w-md gap-3 rounded border border-zinc-800 p-4">
        <div>
          <label className="mb-1 block text-sm text-zinc-400">Usuario</label>
          <input value={form.username} onChange={(e)=>setForm({ ...form, username: e.target.value })} className="w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 outline-none focus:border-zinc-600" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-400">Contraseña</label>
          <input type="password" value={form.password} onChange={(e)=>setForm({ ...form, password: e.target.value })} className="w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 outline-none focus:border-zinc-600" />
          <p className="mt-1 text-xs text-zinc-500">Mínimo 8 caracteres.</p>
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-400">Rol</label>
          <select value={form.role} onChange={(e)=>setForm({ ...form, role: e.target.value })} className="w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 outline-none focus:border-zinc-600">
            <option value="editor">editor</option>
            <option value="admin">admin</option>
          </select>
        </div>
        {error && <div className="rounded border border-red-900 bg-red-950 p-2 text-sm text-red-300">{error}</div>}
        <div className="mt-2 flex justify-end">
          <button className="rounded bg-emerald-600 px-4 py-2 font-medium hover:bg-emerald-500">Crear usuario</button>
        </div>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse">
          <thead>
            <tr className="text-left text-zinc-400">
              <th className="border-b border-zinc-800 px-3 py-2">Usuario</th>
              <th className="border-b border-zinc-800 px-3 py-2">Rol</th>
              <th className="border-b border-zinc-800 px-3 py-2">Creado</th>
              <th className="border-b border-zinc-800 px-3 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-3 py-4 text-center text-zinc-400">Cargando...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={4} className="px-3 py-4 text-center text-zinc-500">Sin usuarios</td></tr>
            ) : (
              items.map(u => (
                <tr key={u.id} className="hover:bg-zinc-900/50">
                  <td className="border-b border-zinc-900 px-3 py-2">{u.username}</td>
                  <td className="border-b border-zinc-900 px-3 py-2">
                    <select value={u.role} onChange={(e)=>onChangeRole(u.id, e.target.value)} disabled={savingId===u.id}
                      className="rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-sm outline-none focus:border-zinc-600">
                      <option value="editor">editor</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="border-b border-zinc-900 px-3 py-2">{new Date(u.createdAt).toLocaleString()}</td>
                  <td className="border-b border-zinc-900 px-3 py-2">
                    <button disabled={deletingId===u.id || (me && me.id === u.id)}
                      onClick={()=>onDelete(u.id)}
                      className="rounded bg-red-800 px-2 py-1 text-sm hover:bg-red-700 disabled:opacity-50">
                      {deletingId===u.id ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
