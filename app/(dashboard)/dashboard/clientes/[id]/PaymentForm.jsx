"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PaymentForm({ customerId }) {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [membershipMonths, setMembershipMonths] = useState(1);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setError('El monto debe ser un número mayor que 0');
      return;
    }
    if (paymentMethod === 'Pago Movil' && !referenceNumber.trim()) {
      setError('El número de referencia es requerido para Pago Móvil');
      return;
    }
    try {
      setLoading(true);
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: customerId,
          amount: amt,
          paymentMethod,
          referenceNumber: referenceNumber || undefined,
          membershipMonths: Number(membershipMonths) || 1,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Error registrando pago');
      setSuccess('Pago registrado correctamente');
      setAmount('');
      setMembershipMonths(1);
      setReferenceNumber('');
      router.refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      {error && <div className="rounded border border-red-900 bg-red-950 p-2 text-sm text-red-300">{error}</div>}
      {success && <div className="rounded border border-emerald-900 bg-emerald-950 p-2 text-sm text-emerald-300">{success}</div>}
      <div>
        <label className="mb-1 block text-sm text-zinc-400">Monto *</label>
        <input value={amount} onChange={(e)=>setAmount(e.target.value)} type="number" step="0.01" min="0" className="w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 outline-none focus:border-zinc-600" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-zinc-400">Método *</label>
          <select value={paymentMethod} onChange={(e)=>setPaymentMethod(e.target.value)} className="w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 outline-none focus:border-zinc-600">
            <option>Efectivo</option>
            <option>Pago Movil</option>
            <option>Otro</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-400">Meses de membresía</label>
          <input value={membershipMonths} onChange={(e)=>setMembershipMonths(e.target.value)} type="number" min="1" className="w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 outline-none focus:border-zinc-600" />
        </div>
      </div>
      {paymentMethod === 'Pago Movil' && (
        <div>
          <label className="mb-1 block text-sm text-zinc-400">Referencia</label>
          <input value={referenceNumber} onChange={(e)=>setReferenceNumber(e.target.value)} className="w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 outline-none focus:border-zinc-600" />
        </div>
      )}
      <div className="mt-2 flex justify-end">
        <button disabled={loading} className="rounded bg-emerald-600 px-4 py-2 font-medium hover:bg-emerald-500 disabled:opacity-60">{loading ? 'Guardando...' : 'Registrar pago'}</button>
      </div>
    </form>
  );
}
