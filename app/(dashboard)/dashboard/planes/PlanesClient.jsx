"use client";

import { useEffect, useState } from 'react';
import { toast } from '@/lib/toastBus';

export default function PlanesClient() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', price: '', durationValue: 1, durationType: 'months', description: '', active: true });

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/plans', { cache: 'no-store' });
      const json = await res.json();
      if (json.success) setPlans(json.data);
    } catch (e) {
      toast.error('Error cargando planes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlans(); }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editing ? `/api/plans/${editing._id}` : '/api/plans';
      const method = editing ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      
      if (!res.ok || !json.success) throw new Error(json.error || 'Error guardando plan');
      
      toast.success(editing ? 'Plan actualizado' : 'Plan creado');
      setShowModal(false);
      setEditing(null);
      setForm({ name: '', price: '', durationValue: 1, durationType: 'months', description: '', active: true });
      fetchPlans();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const onDelete = async (id) => {
    if (!confirm('¿Eliminar este plan?')) return;
    try {
      const res = await fetch(`/api/plans/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Plan eliminado');
        fetchPlans();
      } else {
        throw new Error('Error eliminando');
      }
    } catch (e) {
      toast.error(e.message);
    }
  };

  const openEdit = (plan) => {
    setEditing(plan);
    setForm({ 
      ...plan, 
      durationValue: plan.durationValue || plan.durationMonths || 1,
      durationType: plan.durationType || 'months'
    });
    setShowModal(true);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', price: '', durationValue: 1, durationType: 'months', description: '', active: true });
    setShowModal(true);
  };

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button onClick={openNew} className="btn-brand btn-animated px-4 py-2">Nuevo Plan</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading && plans.length === 0 ? (
          <div className="text-zinc-500">Cargando...</div>
        ) : plans.map(plan => (
          <div key={plan._id} className={`rounded-xl border p-4 shadow-sm transition-all hover:shadow-md ${plan.active ? 'border-purple-100 bg-white' : 'border-zinc-200 bg-zinc-50 opacity-60'}`}>
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-lg text-zinc-800">{plan.name}</h3>
              <span className="text-brand-via font-bold text-xl">${plan.price}</span>
            </div>
            <div className="text-sm text-zinc-600 mb-4">
              <span className="font-medium">{plan.durationValue || plan.durationMonths} {plan.durationType === 'days' ? 'días' : 'meses'}</span>
              {plan.description && <p className="mt-1 italic text-zinc-500">{plan.description}</p>}
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => openEdit(plan)} className="text-sm text-zinc-600 hover:text-zinc-900 px-3 py-1 rounded border border-zinc-300 hover:bg-zinc-100">Editar</button>
              <button onClick={() => onDelete(plan._id)} className="text-sm text-red-600 hover:text-red-700 px-3 py-1 rounded border border-red-200 bg-red-50 hover:bg-red-100">Eliminar</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-purple-100 bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-zinc-800">{editing ? 'Editar Plan' : 'Nuevo Plan'}</h2>
            <form onSubmit={onSubmit} className="grid gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-600">Nombre</label>
                <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full rounded border border-purple-200 bg-white px-3 py-2 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-600">Precio ($)</label>
                <input required type="number" min="0" step="0.01" value={form.price} onChange={e => setForm({...form, price: Number(e.target.value)})} className="w-full rounded border border-purple-200 bg-white px-3 py-2 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-600">Duración</label>
                  <input required type="number" min="1" value={form.durationValue} onChange={e => setForm({...form, durationValue: Number(e.target.value)})} className="w-full rounded border border-purple-200 bg-white px-3 py-2 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-600">Unidad</label>
                  <select value={form.durationType} onChange={e => setForm({...form, durationType: e.target.value})} className="w-full rounded border border-purple-200 bg-white px-3 py-2 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500">
                    <option value="months">Meses</option>
                    <option value="days">Días</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-600">Descripción (Opcional)</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full rounded border border-purple-200 bg-white px-3 py-2 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" rows="2" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="active" checked={form.active} onChange={e => setForm({...form, active: e.target.checked})} className="accent-brand-via" />
                <label htmlFor="active" className="text-sm text-zinc-600">Plan activo (visible)</label>
              </div>
              <div className="mt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded text-zinc-600 hover:bg-zinc-100">Cancelar</button>
                <button type="submit" className="btn-brand px-4 py-2">{editing ? 'Actualizar' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
