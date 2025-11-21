"use client";

import { useState, useEffect } from 'react';
import { toast } from '@/lib/toastBus';

export default function ExchangeRateWidget() {
  const [rate, setRate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [tempRate, setTempRate] = useState('');

  useEffect(() => {
    fetch('/api/config/rate')
      .then(res => res.json())
      .then(data => {
        if (data.success) setRate(data.rate);
      })
      .finally(() => setLoading(false));
  }, []);

  const onSave = async () => {
    try {
      const res = await fetch('/api/config/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rate: tempRate }),
      });
      const json = await res.json();
      if (json.success) {
        setRate(json.rate);
        setEditing(false);
        toast.success('Tasa actualizada');
      } else {
        toast.error(json.error);
      }
    } catch (e) {
      toast.error('Error guardando tasa');
    }
  };

  if (loading) return <div className="h-10 w-32 animate-pulse rounded bg-zinc-100"></div>;

  if (editing) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-purple-200 bg-white p-2 shadow-sm">
        <span className="text-sm font-medium text-zinc-600">1 USD =</span>
        <input
          type="number"
          value={tempRate}
          onChange={(e) => setTempRate(e.target.value)}
          className="w-20 rounded border border-zinc-300 px-2 py-1 text-sm"
          placeholder="0.00"
          autoFocus
        />
        <span className="text-sm font-medium text-zinc-600">VES</span>
        <button onClick={onSave} className="rounded bg-emerald-500 px-2 py-1 text-xs font-bold text-white hover:bg-emerald-600">✓</button>
        <button onClick={() => setEditing(false)} className="rounded bg-zinc-200 px-2 py-1 text-xs font-bold text-zinc-600 hover:bg-zinc-300">✕</button>
      </div>
    );
  }

  return (
    <div 
      onClick={() => { setTempRate(rate); setEditing(true); }}
      className="cursor-pointer rounded-lg border border-purple-100 bg-white px-4 py-2 shadow-sm hover:bg-purple-50 transition-colors"
      title="Clic para editar tasa del día"
    >
      <div className="text-xs font-medium text-zinc-500">Tasa del día</div>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-bold text-zinc-800">{rate ? rate.toLocaleString('es-VE', { minimumFractionDigits: 2 }) : '-'}</span>
        <span className="text-xs font-medium text-zinc-500">VES/USD</span>
      </div>
    </div>
  );
}
