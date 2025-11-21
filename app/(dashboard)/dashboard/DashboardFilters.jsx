"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from '@/lib/toastBus';

export default function DashboardFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [from, setFrom] = useState(searchParams.get('from') || '');
  const [to, setTo] = useState(searchParams.get('to') || '');

  const onApply = () => {
    if (!from || !to) {
      toast.error('Seleccione ambas fechas');
      return;
    }
    const params = new URLSearchParams(searchParams);
    params.set('from', from);
    params.set('to', to);
    router.push(`/dashboard?${params.toString()}`);
    toast.success('Filtros aplicados');
  };

  const onClear = () => {
    setFrom('');
    setTo('');
    router.push('/dashboard');
    toast.success('Filtros limpiados');
  };

  const applyPreset = (type) => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    const fmt = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    switch (type) {
      case 'today':
        break;
      case 'week':
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);
        end.setDate(start.getDate() + 6);
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        break;
    }
    
    setFrom(fmt(start));
    setTo(fmt(end));
  };

  return (
    <div className="mb-6 flex flex-col gap-4 rounded-xl border border-purple-100 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => applyPreset('today')} className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 hover:bg-purple-100">Hoy</button>
        <button onClick={() => applyPreset('week')} className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 hover:bg-purple-100">Esta semana</button>
        <button onClick={() => applyPreset('month')} className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 hover:bg-purple-100">Este mes</button>
        <button onClick={() => applyPreset('year')} className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 hover:bg-purple-100">Este año</button>
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">Desde</label>
          <input 
            type="date" 
            value={from} 
            onChange={(e) => setFrom(e.target.value)} 
            className="rounded border border-purple-200 bg-white px-3 py-2 text-sm text-zinc-800 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" 
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">Hasta</label>
          <input 
            type="date" 
            value={to} 
            onChange={(e) => setTo(e.target.value)} 
            className="rounded border border-purple-200 bg-white px-3 py-2 text-sm text-zinc-800 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" 
          />
        </div>
        <div className="flex gap-2">
          <button onClick={onApply} className="btn-brand px-4 py-2 text-sm">Filtrar</button>
          <button onClick={onClear} className="rounded border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50">Limpiar</button>
        </div>
      </div>
    </div>
  );
}
