"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/toastBus';

export default function PaymentForm({ customerId, initialPlanName }) {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [durationValue, setDurationValue] = useState(1);
  const [durationType, setDurationType] = useState('months');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState('');
  
  // Multi-moneda
  const [currency, setCurrency] = useState('USD'); // 'USD' | 'VES'
  const [exchangeRate, setExchangeRate] = useState(1);
  const [amountVES, setAmountVES] = useState('');

  useEffect(() => {
    // Cargar tasa del día
    fetch('/api/config/rate')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.rate) setExchangeRate(data.rate);
      })
      .catch(() => {});

    fetch('/api/plans?active=true')
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setPlans(json.data);
          // Pre-seleccionar si hay coincidencia por nombre
          if (initialPlanName) {
            const match = json.data.find(p => p.name === initialPlanName);
            if (match) {
              setSelectedPlan(match._id);
              setAmount(match.price);
              setDurationValue(match.durationValue || match.durationMonths || 1);
              setDurationType(match.durationType || 'months');
            }
          }
        }
      })
      .catch(() => {});
  }, [initialPlanName]);

  // Recalcular VES cuando cambia USD o Tasa
  useEffect(() => {
    if (amount && exchangeRate) {
      setAmountVES((Number(amount) * exchangeRate).toFixed(2));
    } else {
      setAmountVES('');
    }
  }, [amount, exchangeRate]);

  const onPlanChange = (e) => {
    const planId = e.target.value;
    setSelectedPlan(planId);
    if (planId) {
      const plan = plans.find(p => p._id === planId);
      if (plan) {
        setAmount(plan.price);
        setDurationValue(plan.durationValue || plan.durationMonths || 1);
        setDurationType(plan.durationType || 'months');
      }
    }
  };

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

    const planObj = plans.find(p => p._id === selectedPlan);
    const planName = planObj ? planObj.name : undefined;

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
          durationValue: Number(durationValue) || 1,
          durationType,
          currency,
          exchangeRate: exchangeRate,
          amountVES: Number(amountVES),
          planName,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Error registrando pago');
      setSuccess('Pago registrado correctamente');
      toast.success('Pago registrado');
      setAmount('');
      setAmountVES('');
      setDurationValue(1);
      setReferenceNumber('');
      router.refresh();
    } catch (e) {
      setError(e.message);
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-xl border border-purple-100 bg-white p-4 shadow-sm">
      {error && <div className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-600">{error}</div>}
      {success && <div className="rounded border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-600">{success}</div>}
      
      {plans.length > 0 && (
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-600">Seleccionar Plan (Opcional)</label>
          <select value={selectedPlan} onChange={onPlanChange} className="w-full rounded border border-purple-200 bg-white px-3 py-2 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500">
            <option value="">Personalizado / Manual</option>
            {plans.map(p => (
              <option key={p._id} value={p._id}>{p.name} - ${p.price} ({p.durationValue || p.durationMonths} {p.durationType === 'days' ? 'días' : 'meses'})</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-600">Monto (USD) *</label>
        <div className="flex gap-2">
          <input value={amount} onChange={(e)=>setAmount(e.target.value)} type="number" step="0.01" min="0" className="w-full rounded border border-purple-200 bg-white px-3 py-2 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" placeholder="0.00" />
          <div className="flex items-center rounded border border-purple-200 bg-purple-50 px-3">
            <select value={currency} onChange={(e)=>setCurrency(e.target.value)} className="bg-transparent text-sm font-medium text-purple-700 outline-none">
              <option value="USD">USD</option>
              <option value="VES">VES</option>
            </select>
          </div>
        </div>
      </div>

      <div className="rounded bg-purple-50 p-3 text-sm text-purple-800">
        <div className="flex justify-between">
          <span>Tasa del día:</span>
          <span className="font-bold">{exchangeRate.toLocaleString('es-VE', { minimumFractionDigits: 2 })} VES/USD</span>
        </div>
        <div className="mt-1 flex justify-between border-t border-purple-200 pt-1">
          <span>Equivalente en Bolívares:</span>
          <span className="font-bold text-lg">{Number(amountVES).toLocaleString('es-VE', { minimumFractionDigits: 2 })} VES</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-600">Método *</label>
          <select value={paymentMethod} onChange={(e)=>setPaymentMethod(e.target.value)} className="w-full rounded border border-purple-200 bg-white px-3 py-2 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500">
            <option>Efectivo</option>
            <option>Pago Movil</option>
            <option>Otro</option>
          </select>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-zinc-600">Duración</label>
            <input value={durationValue} onChange={(e)=>setDurationValue(e.target.value)} type="number" min="1" className="w-full rounded border border-purple-200 bg-white px-3 py-2 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" />
          </div>
          <div className="w-24">
            <label className="mb-1 block text-sm font-medium text-zinc-600">Unidad</label>
            <select value={durationType} onChange={(e)=>setDurationType(e.target.value)} className="w-full rounded border border-purple-200 bg-white px-3 py-2 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500">
              <option value="months">Meses</option>
              <option value="days">Días</option>
            </select>
          </div>
        </div>
      </div>
      {paymentMethod === 'Pago Movil' && (
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-600">Referencia *</label>
          <input value={referenceNumber} onChange={(e)=>setReferenceNumber(e.target.value)}
            placeholder="Últimos 6-10 dígitos de la operación"
            className="w-full rounded border border-purple-200 bg-white px-3 py-2 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" />
        </div>
      )}
      <div className="mt-2 flex justify-end">
        <button disabled={loading} className="btn-brand btn-animated px-4 py-2 disabled:opacity-60">{loading ? 'Guardando...' : 'Registrar pago'}</button>
      </div>
    </form>
  );
}
