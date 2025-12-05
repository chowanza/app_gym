"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/toastBus';

export default function CustomerEditForm({ customer }) {
  const router = useRouter();
  
  const splitCedula = (c) => {
    if (!c) return { prefix: 'V-', number: '' };
    const match = c.match(/^([VJE]-)(.*)$/);
    if (match) return { prefix: match[1], number: match[2] };
    return { prefix: 'V-', number: c };
  };
  const initialCedula = splitCedula(customer?.cedula);

  const [form, setForm] = useState({
    name: customer?.name || '',
    cedulaPrefix: initialCedula.prefix,
    cedulaNumber: initialCedula.number,
    email: customer?.email || '',
    phone: customer?.phone || '',
    membershipType: customer?.membershipType || '',
    photoUrl: customer?.photoUrl || '',
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 1024 * 1024) { // 1MB limit
      toast.error('La imagen es muy grande (máx 1MB)');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(prev => ({ ...prev, photoUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const onSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const fullCedula = `${form.cedulaPrefix}${form.cedulaNumber}`;
      const payload = { ...form, cedula: fullCedula };
      delete payload.cedulaPrefix;
      delete payload.cedulaNumber;

      const res = await fetch(`/api/customers/${customer._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
    <form onSubmit={onSave} className="grid gap-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-600">Foto de Perfil</label>
        <div className="flex items-center gap-4">
          {form.photoUrl && (
            <img src={form.photoUrl} alt="Preview" className="h-12 w-12 rounded-full object-cover border border-purple-200" />
          )}
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange}
            className="text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-600">Nombre</label>
        <input value={form.name} onChange={(e)=>setForm({ ...form, name: e.target.value })}
          className="w-full rounded border border-purple-200 bg-white px-3 py-2 text-zinc-800 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-600">Cédula</label>
        <div className="flex w-full rounded border border-purple-200 bg-white focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500">
          <select
            value={form.cedulaPrefix}
            onChange={(e) => setForm({ ...form, cedulaPrefix: e.target.value })}
            className="rounded-l bg-transparent px-3 py-2 text-zinc-700 outline-none hover:bg-purple-50"
          >
            <option value="V-">V-</option>
            <option value="J-">J-</option>
            <option value="E-">E-</option>
          </select>
          <div className="h-auto w-px bg-purple-100"></div>
          <input
            value={form.cedulaNumber}
            onChange={(e) => setForm({ ...form, cedulaNumber: e.target.value })}
            type="number"
            className="w-full rounded-r bg-transparent px-3 py-2 text-zinc-800 outline-none"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-600">Email</label>
          <input value={form.email} onChange={(e)=>setForm({ ...form, email: e.target.value })}
            className="w-full rounded border border-purple-200 bg-white px-3 py-2 text-zinc-800 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-600">Teléfono</label>
          <input value={form.phone} onChange={(e)=>setForm({ ...form, phone: e.target.value })}
            className="w-full rounded border border-purple-200 bg-white px-3 py-2 text-zinc-800 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-600">Tipo de membresía</label>
        <select value={form.membershipType} onChange={(e)=>setForm({ ...form, membershipType: e.target.value })}
          className="w-full rounded border border-purple-200 bg-white px-3 py-2 text-zinc-800 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500">
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
          className="rounded border border-red-200 bg-red-50 px-4 py-2 font-medium text-red-600 hover:bg-red-100 disabled:opacity-50">
          {deleting ? 'Eliminando...' : 'Eliminar cliente'}
        </button>
      </div>
    </form>
  );
}
