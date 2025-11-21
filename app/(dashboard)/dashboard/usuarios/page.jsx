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
      <h1 className="text-xl font-semibold text-zinc-800">Usuarios</h1>

      <form onSubmit={onSubmit} className="grid max-w-md gap-4 rounded-xl border border-purple-100 bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-600">Usuario</label>
          <input value={form.username} onChange={(e)=>setForm({ ...form, username: e.target.value })} 
            className="w-full rounded border border-purple-200 bg-white px-3 py-2 text-zinc-800 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-600">Contraseña</label>
          <input type="password" value={form.password} onChange={(e)=>setForm({ ...form, password: e.target.value })} 
            className="w-full rounded border border-purple-200 bg-white px-3 py-2 text-zinc-800 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" />
          <p className="mt-1 text-xs text-zinc-500">Mínimo 8 caracteres.</p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-600">Rol</label>
          <select value={form.role} onChange={(e)=>setForm({ ...form, role: e.target.value })} 
            className="w-full rounded border border-purple-200 bg-white px-3 py-2 text-zinc-800 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500">
            <option value="editor">editor</option>
            <option value="admin">admin</option>
          </select>
        </div>
        {error && <div className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-600">{error}</div>}
        <div className="mt-2 flex justify-end">
          <button className="btn-brand px-4 py-2">Crear usuario</button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-xl border border-purple-100 bg-white shadow-sm">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead>
            <tr className="text-left text-zinc-500">
              <th className="border-b border-purple-100 px-4 py-3 font-medium">Usuario</th>
              <th className="border-b border-purple-100 px-4 py-3 font-medium">Rol</th>
              <th className="border-b border-purple-100 px-4 py-3 font-medium">Creado</th>
              <th className="border-b border-purple-100 px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-zinc-500">Cargando...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-zinc-500">Sin usuarios</td></tr>
            ) : (
              items.map(u => (
                <tr key={u.id} className="hover:bg-purple-50/50 text-zinc-700">
                  <td className="border-b border-purple-50 px-4 py-3 font-medium">{u.username}</td>
                  <td className="border-b border-purple-50 px-4 py-3">
                    <select value={u.role} onChange={(e)=>onChangeRole(u.id, e.target.value)} disabled={savingId===u.id}
                      className="rounded border border-purple-200 bg-white px-2 py-1 text-xs outline-none focus:border-purple-500">
                      <option value="editor">editor</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="border-b border-purple-50 px-4 py-3">{new Date(u.createdAt).toLocaleString()}</td>
                  <td className="border-b border-purple-50 px-4 py-3">
                    <button disabled={deletingId===u.id || (me && me.id === u.id)}
                      onClick={()=>onDelete(u.id)}
                      className="rounded border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">
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
