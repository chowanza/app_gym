"use client";

import { useEffect, useState } from 'react';
import { toast } from '@/lib/toastBus';

export default function AsistenciasClient() {
  const [cedula, setCedula] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [info, setInfo] = useState(null);
  const [recent, setRecent] = useState([]);
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  const limit = 20;

  const fetchRecent = async ({ reset = false } = {}) => {
    try {
      const params = new URLSearchParams();
      params.set('limit', String(limit));
      params.set('page', String(reset ? 1 : page));
      if (q.trim()) params.set('q', q.trim());
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const res = await fetch(`/api/attendance?${params.toString()}`, { cache: 'no-store' });
      const json = await res.json();
      if (res.ok && json.success) {
        setTotal(json.total || 0);
        setHasMore(!!json.hasMore);
        setRecent(prev => (reset ? (json.data || []) : [...prev, ...(json.data || [])]));
      }
    } catch {}
  };

  useEffect(() => { fetchRecent({ reset: true }); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setInfo(null);
    if (!cedula.trim()) { setError('Ingrese la cédula'); return; }
    try {
      setLoading(true);
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula: cedula.trim() })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Error registrando asistencia');
      setSuccess('¡Asistencia registrada!');
      toast.success('Asistencia registrada');
      setInfo(json.data);
      setCedula("");
  fetchRecent();
    } catch (e) {
      setError(e.message);
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6">
      <form onSubmit={onSubmit} className="flex max-w-xl gap-2">
        <input
          value={cedula}
          onChange={(e)=>setCedula(e.target.value)}
          placeholder="Cédula del cliente"
          className="w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 outline-none focus:border-zinc-600"
        />
        <button disabled={loading} className="rounded bg-emerald-600 px-4 py-2 font-medium hover:bg-emerald-500 disabled:opacity-60">{loading ? 'Registrando...' : 'Registrar'}</button>
      </form>

      {error && <div className="max-w-xl rounded border border-red-900 bg-red-950 p-2 text-sm text-red-300">{error}</div>}
      {success && <div className="max-w-xl rounded border border-emerald-900 bg-emerald-950 p-2 text-sm text-emerald-300">{success}</div>}

      {info && (
        <div className="max-w-xl rounded border border-zinc-800 p-4">
          <div className="text-sm text-zinc-400">Cliente</div>
          <div className="text-lg font-semibold">{info.customer?.name} <span className="ml-2 rounded bg-zinc-700 px-2 py-0.5 text-xs">{info.customer?.cedula}</span></div>
          <div className="mt-2 text-sm text-zinc-400">Fecha de check-in</div>
          <div>{new Date(info.attendance?.checkInTime || info.attendance?.createdAt).toLocaleString()}</div>
        </div>
      )}

      <section>
        <h2 className="mb-2 text-lg font-semibold">Últimas asistencias</h2>
        <div className="mb-3 flex flex-wrap items-end gap-2">
          <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Buscar por nombre o cédula" className="w-full max-w-xs rounded border border-zinc-800 bg-zinc-900 px-3 py-2 outline-none focus:border-zinc-600" />
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Desde</label>
            <input type="date" value={from} onChange={(e)=>setFrom(e.target.value)} className="rounded border border-zinc-800 bg-zinc-900 px-3 py-2 outline-none focus:border-zinc-600" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Hasta</label>
            <input type="date" value={to} onChange={(e)=>setTo(e.target.value)} className="rounded border border-zinc-800 bg-zinc-900 px-3 py-2 outline-none focus:border-zinc-600" />
          </div>
          <button onClick={async ()=>{ setPage(1); await fetchRecent({ reset: true }); toast.success('Filtros aplicados'); }} className="rounded bg-zinc-800 px-3 py-2 hover:bg-zinc-700">Aplicar filtros</button>
          <button onClick={async ()=>{ setQ(''); setFrom(''); setTo(''); setPage(1); await fetchRecent({ reset: true }); toast.success('Filtros limpiados'); }} className="rounded bg-zinc-800 px-3 py-2 hover:bg-zinc-700">Limpiar</button>
          <a href={(function(){ const p=new URLSearchParams(); if(q.trim())p.set('q',q.trim()); if(from)p.set('from',from); if(to)p.set('to',to); return `/api/attendance/export?${p.toString()}`; })()} className="ml-auto rounded bg-zinc-800 px-3 py-2 hover:bg-zinc-700">Exportar CSV</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse">
            <thead>
              <tr className="text-left text-zinc-400">
                <th className="border-b border-zinc-800 px-3 py-2">Fecha</th>
                <th className="border-b border-zinc-800 px-3 py-2">Nombre</th>
                <th className="border-b border-zinc-800 px-3 py-2">Cédula</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr><td colSpan={3} className="px-3 py-4 text-center text-zinc-500">Sin asistencias</td></tr>
              ) : (
                recent.map((a) => (
                  <tr key={a._id} className="hover:bg-zinc-900/50">
                    <td className="border-b border-zinc-900 px-3 py-2">{new Date(a.checkInTime || a.createdAt).toLocaleString()}</td>
                    <td className="border-b border-zinc-900 px-3 py-2">{a.customer?.name || '-'}</td>
                    <td className="border-b border-zinc-900 px-3 py-2">{a.customer?.cedula || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="text-sm text-zinc-400">Total: {total}</div>
          {hasMore && (
            <button onClick={()=>{ const next = page + 1; setPage(next); fetchRecent(); }} className="rounded bg-zinc-800 px-3 py-2 hover:bg-zinc-700">Cargar más</button>
          )}
        </div>
      </section>
    </div>
  );
}
