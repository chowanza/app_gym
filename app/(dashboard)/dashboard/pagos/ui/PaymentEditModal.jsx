"use client";

import { useState, useEffect } from 'react';
import { toast } from '@/lib/toastBus';

export default function PaymentEditModal({ open, onClose, payment, onSaved }) {
  const [form, setForm] = useState(() => init(payment));
  const [saving, setSaving] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(0);

  useEffect(() => {
    if (open) {
      fetch('/api/config/rate')
        .then(res => res.json())
        .then(data => { if (data.success) setExchangeRate(data.rate); })
        .catch(() => {});
    }
  }, [open]);

  // Reset form when payment changes or modal opens
  if (open && form._id !== payment?._id) {
    setForm(init(payment));
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!payment?._id) return;
    try {
      setSaving(true);
      const payload = {
        amount: Number(form.amount) || 0,
        membershipMonths: Number(form.membershipMonths) || 1,
        paymentMethod: form.paymentMethod,
        referenceNumber: form.referenceNumber || '',
        paymentDate: form.paymentDate ? new Date(form.paymentDate).toISOString() : undefined,
      };
      const res = await fetch(`/api/payments/${payment._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Error actualizando pago');
      const vence = json?.data?.customer?.membershipEndDate ? new Date(json.data.customer.membershipEndDate).toLocaleDateString() : null;
      toast.success(vence ? `Pago actualizado · Vence: ${vence}` : 'Pago actualizado');
      onSaved?.(json.data?.payment);
      onClose?.();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-purple-100 bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-zinc-800">Editar pago</h3>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">Monto</label>
            <input type="number" step="0.01" value={form.amount} onChange={(e)=>setForm({...form, amount:e.target.value})}
              className="w-full rounded border border-purple-200 bg-white px-3 py-2 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" />
            {exchangeRate > 0 && form.amount > 0 && (
              <div className="mt-1 text-xs text-zinc-500">
                Bs {(form.amount * exchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Tasa: {exchangeRate})
              </div>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">Meses</label>
            <input type="number" min={1} value={form.membershipMonths} onChange={(e)=>setForm({...form, membershipMonths:e.target.value})}
              className="w-full rounded border border-purple-200 bg-white px-3 py-2 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">Método</label>
            <select value={form.paymentMethod} onChange={(e)=>setForm({...form, paymentMethod:e.target.value})}
              className="w-full rounded border border-purple-200 bg-white px-3 py-2 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500">
              <option value="Efectivo">Efectivo</option>
              <option value="Pago Movil">Pago Movil</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">Referencia{form.paymentMethod === 'Pago Movil' ? ' *' : ''}</label>
            <input value={form.referenceNumber} onChange={(e)=>setForm({...form, referenceNumber:e.target.value})}
              placeholder={form.paymentMethod === 'Pago Movil' ? 'Requerido para Pago Móvil' : ''}
              className="w-full rounded border border-purple-200 bg-white px-3 py-2 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">Fecha del pago</label>
            <input type="datetime-local" value={form.paymentDate}
              onChange={(e)=>setForm({...form, paymentDate:e.target.value})}
              className="w-full rounded border border-purple-200 bg-white px-3 py-2 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" />
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100">Cancelar</button>
            <button disabled={saving} className="btn-brand px-4 py-2 text-sm disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function init(p) {
  if (!p) return { _id: undefined, amount: '', membershipMonths: 1, paymentMethod: 'Efectivo', referenceNumber: '', paymentDate: '' };
  const dt = p.paymentDate ? new Date(p.paymentDate) : (p.createdAt ? new Date(p.createdAt) : null);
  const paymentDate = dt ? toLocalInput(dt) : '';
  return {
    _id: p._id,
    amount: p.amount ?? '',
    membershipMonths: p.membershipMonths ?? 1,
    paymentMethod: p.paymentMethod || 'Efectivo',
    referenceNumber: p.referenceNumber || '',
    paymentDate,
  };
}

function toLocalInput(date) {
  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mi = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}
