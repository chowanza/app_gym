"use client";

import { useEffect, useState } from 'react';
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

  useEffect(() => { fetchRecent({ reset: true }); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

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
    <div className="grid gap-6">
      <form onSubmit={onSubmit} className="flex max-w-xl gap-2">
        <div className="flex w-full rounded border border-purple-200 bg-white focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500">
          <select
            value={cedulaPrefix}
            onChange={(e) => setCedulaPrefix(e.target.value)}
            className="rounded-l bg-transparent px-3 py-2 text-zinc-700 outline-none hover:bg-purple-50"
          >
            <option value="V-">V-</option>
            <option value="J-">J-</option>
            <option value="E-">E-</option>
          </select>
          <div className="h-auto w-px bg-purple-100"></div>
          <input
            value={cedulaNumber}
            onChange={(e) => setCedulaNumber(e.target.value)}
            placeholder="Número de cédula"
            type="number"
            className="w-full rounded-r bg-transparent px-3 py-2 text-zinc-800 outline-none"
          />
        </div>
        <button disabled={loading} className="btn-brand btn-animated px-4 py-2 disabled:opacity-60">{loading ? 'Registrando...' : 'Registrar'}</button>
      </form>

      {error && <div className="max-w-xl rounded border border-red-200 bg-red-50 p-2 text-sm text-red-600">{error}</div>}
      {success && <div className="max-w-xl rounded border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-600">{success}</div>}

      {info && (
        <div className="max-w-xl rounded border border-purple-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-zinc-500">Cliente</div>
          <div className="text-lg font-semibold text-zinc-800">{info.customer?.name} <span className="ml-2 rounded bg-purple-100 px-2 py-0.5 text-xs text-purple-700">{info.customer?.cedula}</span></div>
          <div className="mt-2 text-sm text-zinc-500">Fecha de check-in</div>
          <div className="text-zinc-800">{new Date(info.attendance?.checkInTime || info.attendance?.createdAt).toLocaleString()}</div>
        </div>
      )}

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
          <button onClick={async ()=>{ setPage(1); await fetchRecent({ reset: true }); toast.success('Filtros aplicados'); }} className="btn-brand px-4 py-2">Aplicar filtros</button>
          <button onClick={async ()=>{ setQ(''); setFrom(''); setTo(''); setPage(1); await fetchRecent({ reset: true }); toast.success('Filtros limpiados'); }} className="btn-brand px-4 py-2">Limpiar</button>
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
                    <td className="border-b border-purple-50 px-3 py-3 font-medium">{a.customer?.name || '-'}</td>
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
