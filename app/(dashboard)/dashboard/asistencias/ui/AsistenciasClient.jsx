"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from '@/lib/toastBus';

export default function AsistenciasClient() {
  const [cedulaPrefix, setCedulaPrefix] = useState("V-");
  const [cedulaNumber, setCedulaNumber] = useState("");
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
  const [editing, setEditing] = useState(null); // { id, cedula, dateTime }
  const [deletingId, setDeletingId] = useState(null);

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

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchRecent({ reset: true });
    }, 500);
    return () => clearTimeout(timer);
  }, [q, from, to]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setInfo(null);
    if (!cedulaNumber.trim()) { setError('Ingrese el número de cédula'); return; }
    const fullCedula = `${cedulaPrefix}${cedulaNumber.trim()}`;
    try {
      setLoading(true);
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula: fullCedula })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Error registrando asistencia');
      setSuccess('¡Asistencia registrada!');
      toast.success('Asistencia registrada');
      setInfo(json.data);
      setCedulaNumber("");
  fetchRecent();
    } catch (e) {
      setError(e.message);
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fmtDateTimeLocal = (d) => {
    const dt = new Date(d);
    const pad = (n) => String(n).padStart(2,'0');
    const yyyy = dt.getFullYear();
    const mm = pad(dt.getMonth()+1);
    const dd = pad(dt.getDate());
    const hh = pad(dt.getHours());
    const mi = pad(dt.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  };

  const onEdit = (a) => {
    setEditing({ id: a._id, cedula: a.customer?.cedula || '', dateTime: fmtDateTimeLocal(a.checkInTime || a.createdAt) });
  };

  const onDelete = async (id) => {
    if (!id) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/attendance/${id}`, { method: 'DELETE' });
      const json = await res.json().catch(()=>({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'Error eliminando asistencia');
      setRecent((prev)=> prev.filter((x)=> x._id !== id));
      toast.success('Asistencia eliminada');
      setTotal((t)=> Math.max(0, t-1));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDeletingId(null);
    }
  };

  const onSubmitEdit = async (e) => {
    e.preventDefault();
    if (!editing) return;
    try {
      const payload = {};
      if (editing.cedula && editing.cedula.trim()) payload.cedula = editing.cedula.trim();
      if (editing.dateTime) payload.checkInTime = new Date(editing.dateTime).toISOString();
      const res = await fetch(`/api/attendance/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Error actualizando asistencia');
      const updated = json.data;
      setRecent((prev)=> prev.map((x)=> x._id === updated._id ? { ...x, ...updated } : x));
      toast.success('Asistencia actualizada');
      setEditing(null);
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className="grid gap-8">
      {/* Sección de Registro Destacada */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 p-1 shadow-lg">
        <div className="relative rounded-xl bg-white p-6 sm:p-8">
          <h2 className="mb-6 text-center text-2xl font-bold text-gray-800 sm:text-3xl">
            Registrar Asistencia
          </h2>
          
          <form onSubmit={onSubmit} className="mx-auto flex max-w-2xl flex-col gap-4 sm:flex-row">
            <div className="flex flex-1 rounded-xl border-2 border-purple-100 bg-gray-50 transition-colors focus-within:border-purple-500 focus-within:bg-white">
              <select
                value={cedulaPrefix}
                onChange={(e) => setCedulaPrefix(e.target.value)}
                className="rounded-l-xl bg-transparent px-4 py-3 text-lg font-medium text-gray-700 outline-none hover:bg-purple-50"
              >
                <option value="V-">V-</option>
                <option value="J-">J-</option>
                <option value="E-">E-</option>
              </select>
              <div className="my-2 w-px bg-gray-300"></div>
              <input
                value={cedulaNumber}
                onChange={(e) => setCedulaNumber(e.target.value)}
                placeholder="Cédula de Identidad"
                type="number"
                autoFocus
                className="w-full rounded-r-xl bg-transparent px-4 py-3 text-lg font-medium text-gray-900 placeholder-gray-400 outline-none"
              />
            </div>
            <button 
              disabled={loading} 
              className="group relative overflow-hidden rounded-xl bg-purple-600 px-8 py-3 text-lg font-bold text-white shadow-md transition-all hover:bg-purple-700 hover:shadow-lg disabled:opacity-70 sm:w-auto"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                    Procesando...
                  </>
                ) : (
                  <>
                    CHECK-IN
                    <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Mensajes de estado grandes */}
          {error && (
            <div className="mt-6 animate-pulse rounded-lg bg-red-50 p-4 text-center text-lg font-medium text-red-600 border border-red-100">
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div className="mt-6 rounded-lg bg-green-50 p-4 text-center text-lg font-medium text-green-600 border border-green-100">
              ✅ {success}
            </div>
          )}

          {/* Tarjeta de Información del Cliente (Resultado) */}
          {info && (
            <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mx-auto max-w-2xl overflow-hidden rounded-xl border border-purple-100 bg-white shadow-md">
                <div className="bg-purple-50 px-6 py-4 border-b border-purple-100 flex justify-between items-center">
                  <span className="text-sm font-semibold text-purple-800 uppercase tracking-wider">Acceso Permitido</span>
                  <span className="text-xs font-medium text-purple-600">{new Date(info.attendance?.checkInTime || info.attendance?.createdAt).toLocaleString()}</span>
                </div>
                <div className="p-6 flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-2xl font-bold text-purple-600">
                    {info.customer?.name?.charAt(0)}
                  </div>
                  <div>
                    <Link href={`/dashboard/clientes/${info.customer?._id}`} className="text-2xl font-bold text-gray-800 hover:text-purple-600 hover:underline">
                      {info.customer?.name}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="rounded bg-gray-100 px-2 py-0.5 text-sm font-medium text-gray-600">{info.customer?.cedula}</span>
                      <span className="rounded bg-green-100 px-2 py-0.5 text-sm font-medium text-green-700">Membresía Activa</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <section className="rounded-xl border border-purple-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-zinc-800">Últimas asistencias</h2>
        <div className="mb-4 flex flex-wrap items-end gap-2">
          <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Buscar por nombre o cédula" className="w-full max-w-xs rounded border border-purple-200 bg-white px-3 py-2 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-zinc-800" />
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">Desde</label>
            <input type="date" value={from} onChange={(e)=>setFrom(e.target.value)} className="rounded border border-purple-200 bg-white px-3 py-2 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-zinc-800" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">Hasta</label>
            <input type="date" value={to} onChange={(e)=>setTo(e.target.value)} className="rounded border border-purple-200 bg-white px-3 py-2 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-zinc-800" />
          </div>
          <button onClick={()=>{ setQ(''); setFrom(''); setTo(''); setPage(1); toast.success('Filtros limpiados'); }} className="btn-brand px-4 py-2">Limpiar</button>
          <a href={(function(){ const p=new URLSearchParams(); if(q.trim())p.set('q',q.trim()); if(from)p.set('from',from); if(to)p.set('to',to); return `/api/attendance/export?${p.toString()}`; })()} className="ml-auto btn-brand px-4 py-2">Exportar CSV</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-zinc-500">
                <th className="border-b border-purple-100 px-3 py-2 font-medium">Fecha</th>
                <th className="border-b border-purple-100 px-3 py-2 font-medium">Nombre</th>
                <th className="border-b border-purple-100 px-3 py-2 font-medium">Cédula</th>
                <th className="border-b border-purple-100 px-3 py-2 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr><td colSpan={4} className="px-3 py-8 text-center text-zinc-500">Sin asistencias</td></tr>
              ) : (
                recent.map((a) => (
                  <tr key={a._id} className="hover:bg-purple-50/50 text-zinc-700">
                    <td className="border-b border-purple-50 px-3 py-3">{new Date(a.checkInTime || a.createdAt).toLocaleString()}</td>
                    <td className="border-b border-purple-50 px-3 py-3 font-medium">
                      {a.customer ? (
                        <Link className="hover:underline hover:text-brand-via text-zinc-800" href={`/dashboard/clientes/${a.customer._id}`}>
                          {a.customer.name}
                        </Link>
                      ) : '-'}
                    </td>
                    <td className="border-b border-purple-50 px-3 py-3">{a.customer?.cedula || '-'}</td>
                    <td className="border-b border-purple-50 px-3 py-3">
                      <div className="flex gap-2">
                        <button onClick={()=>onEdit(a)} className="rounded border border-purple-200 px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-purple-50 hover:text-purple-700">Editar</button>
                        <button disabled={deletingId===a._id} onClick={()=>onDelete(a._id)} className="rounded border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-60">{deletingId===a._id?'Eliminando...':'Eliminar'}</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-purple-100 pt-4">
          <div className="text-sm text-zinc-500">Total: {total}</div>
          {hasMore && (
            <button onClick={()=>{ const next = page + 1; setPage(next); fetchRecent(); }} className="btn-brand px-4 py-2">Cargar más</button>
          )}
        </div>
      </section>
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-purple-100 bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-zinc-800">Editar asistencia</h3>
            <form onSubmit={onSubmitEdit} className="grid gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600">Cédula (opcional)</label>
                <input value={editing.cedula} onChange={(e)=>setEditing((s)=>({ ...s, cedula: e.target.value }))} placeholder="Cédula del cliente" className="w-full rounded border border-purple-200 bg-white px-3 py-2 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-zinc-800" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600">Fecha y hora</label>
                <input type="datetime-local" value={editing.dateTime} onChange={(e)=>setEditing((s)=>({ ...s, dateTime: e.target.value }))} className="w-full rounded border border-purple-200 bg-white px-3 py-2 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-zinc-800" />
              </div>
              <div className="mt-2 flex justify-end gap-2">
                <button type="button" onClick={()=>setEditing(null)} className="rounded px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100">Cancelar</button>
                <button className="btn-brand px-4 py-2 text-sm">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
