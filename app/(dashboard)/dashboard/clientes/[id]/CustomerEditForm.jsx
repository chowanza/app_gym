"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/toastBus';

export default function CustomerEditForm({ customer }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    membershipType: customer?.membershipType || '',
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const onSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch(`/api/customers/${customer._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Error actualizando cliente');
      toast.success('Cliente actualizado');
      router.refresh();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!confirm('¿Eliminar este cliente?')) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/customers/${customer._id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Error eliminando cliente');
      toast.success('Cliente eliminado');
      router.push('/dashboard/clientes');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <form onSubmit={onSave} className="grid gap-3">
      <div>
        <label className="mb-1 block text-sm text-zinc-400">Nombre</label>
        <input value={form.name} onChange={(e)=>setForm({ ...form, name: e.target.value })}
          className="w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 outline-none focus:border-zinc-600" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-zinc-400">Email</label>
          <input value={form.email} onChange={(e)=>setForm({ ...form, email: e.target.value })}
            className="w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 outline-none focus:border-zinc-600" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-400">Teléfono</label>
          <input value={form.phone} onChange={(e)=>setForm({ ...form, phone: e.target.value })}
            className="w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 outline-none focus:border-zinc-600" />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm text-zinc-400">Tipo de membresía</label>
        <select value={form.membershipType} onChange={(e)=>setForm({ ...form, membershipType: e.target.value })}
          className="w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 outline-none focus:border-zinc-600">
          <option value="">Selecciona...</option>
          <option>Gym</option>
          <option>Xtrembike</option>
          <option>Diario</option>
          <option>Mensual</option>
          <option>Otro</option>
        </select>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <button disabled={saving} className="btn-brand btn-animated px-4 py-2 disabled:opacity-60">
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
        <button type="button" disabled={deleting}
          onClick={onDelete}
          className="rounded bg-red-800 px-4 py-2 font-medium hover:bg-red-700 disabled:opacity-50">
          {deleting ? 'Eliminando...' : 'Eliminar cliente'}
        </button>
      </div>
    </form>
  );
}
