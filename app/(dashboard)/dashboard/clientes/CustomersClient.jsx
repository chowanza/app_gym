"use client";

import { useEffect, useMemo, useState } from 'react';
import { toast } from '@/lib/toastBus';

export default function CustomersClient() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", cedula: "", email: "", phone: "", membershipType: "" });

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchList = async (q = "", pageArg = 1, append = false) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/customers?q=${encodeURIComponent(q)}&page=${pageArg}`, { cache: 'no-store' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Error cargando clientes');
      setItems(append ? [...items, ...(json.data || [])] : (json.data || []));
      setHasMore(!!json.hasMore);
      setPage(json.page || pageArg);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList("", 1, false);
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (!form.name || !form.cedula) throw new Error('Nombre y cédula son requeridos');
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, membershipType: form.membershipType || undefined }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Error creando cliente');
      setShowModal(false);
      setForm({ name: "", cedula: "", email: "", phone: "", membershipType: "" });
      toast.success('Cliente creado correctamente');
      fetchList(query);
    } catch (e) {
      setError(e.message);
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const onSearch = () => fetchList(query, 1, false);
  const loadMore = () => fetchList(query, page + 1, true);

  const statusBadge = (c) => {
    const active = c.paymentStatus === 'Activo' && c.membershipEndDate && new Date() <= new Date(c.membershipEndDate);
    const label = active ? 'Activo' : 'Inactivo';
    const cls = active ? 'bg-emerald-700' : 'bg-zinc-700';
    return <span className={`rounded px-2 py-0.5 text-xs ${cls}`}>{label}</span>;
  };

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full gap-2 sm:w-auto">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            placeholder="Buscar por nombre o cédula"
            className="w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 outline-none focus:border-zinc-600 sm:w-80"
          />
          <button onClick={onSearch} className="btn-brand btn-animated px-4 py-2">{loading ? '...' : 'Buscar'}</button>
        </div>
        <div className="flex gap-2">
          <a
            href={`/api/customers/export?format=csv${query ? `&q=${encodeURIComponent(query)}` : ''}`}
            className="btn-brand px-4 py-2"
          >Exportar CSV</a>
          <button onClick={() => setShowModal(true)} className="btn-brand btn-animated px-4 py-2">Nuevo cliente</button>
        </div>
      </div>

      {error && <div className="mb-3 rounded border border-red-900 bg-red-950 p-2 text-red-300">{error}</div>}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr className="text-left text-zinc-400">
              <th className="border-b border-zinc-800 px-3 py-2">Nombre</th>
              <th className="border-b border-zinc-800 px-3 py-2">Cédula</th>
              <th className="border-b border-zinc-800 px-3 py-2">Membresía</th>
              <th className="border-b border-zinc-800 px-3 py-2">Vence</th>
              <th className="border-b border-zinc-800 px-3 py-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            {loading && items.length === 0 ? (
              [...Array(4)].map((_,i)=>(
                <tr key={i}>
                  <td colSpan={5} className="px-3 py-4"><div className="h-6 w-full skeleton rounded" /></td>
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr><td colSpan={5} className="px-3 py-4 text-center text-zinc-500">Sin resultados</td></tr>
            ) : (
              items.map((c) => (
                <tr key={c._id} className="hover:bg-zinc-900/50">
                  <td className="border-b border-zinc-900 px-3 py-2 font-medium"><a className="hover:underline" href={`/dashboard/clientes/${c._id}`}>{c.name}</a></td>
                  <td className="border-b border-zinc-900 px-3 py-2">{c.cedula}</td>
                  <td className="border-b border-zinc-900 px-3 py-2">{c.membershipType || '-'}</td>
                  <td className="border-b border-zinc-900 px-3 py-2">{c.membershipEndDate ? new Date(c.membershipEndDate).toLocaleDateString() : '-'}</td>
                  <td className="border-b border-zinc-900 px-3 py-2">{statusBadge(c)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="mt-4">
          <button onClick={loadMore} disabled={loading} className="btn-brand px-4 py-2 disabled:opacity-60">{loading ? 'Cargando...' : 'Cargar más'}</button>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded border border-zinc-800 bg-zinc-950 p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Registrar nuevo cliente</h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={onSubmit} className="grid gap-3">
              <div>
                <label className="mb-1 block text-sm text-zinc-400">Nombre *</label>
                <input value={form.name} onChange={(e)=>setForm({ ...form, name: e.target.value })} className="w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 outline-none focus:border-zinc-600" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-zinc-400">Cédula *</label>
                <input value={form.cedula} onChange={(e)=>setForm({ ...form, cedula: e.target.value })} className="w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 outline-none focus:border-zinc-600" />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm text-zinc-400">Email</label>
                  <input value={form.email} onChange={(e)=>setForm({ ...form, email: e.target.value })} className="w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 outline-none focus:border-zinc-600" />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-zinc-400">Teléfono</label>
                  <input value={form.phone} onChange={(e)=>setForm({ ...form, phone: e.target.value })} className="w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 outline-none focus:border-zinc-600" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm text-zinc-400">Tipo de membresía</label>
                <select value={form.membershipType} onChange={(e)=>setForm({ ...form, membershipType: e.target.value })} className="w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 outline-none focus:border-zinc-600">
                  <option value="">Selecciona...</option>
                  <option>Gym</option>
                  <option>Xtrembike</option>
                  <option>Diario</option>
                  <option>Mensual</option>
                  <option>Otro</option>
                </select>
              </div>
              <div className="mt-2 flex justify-end gap-2">
                <button type="button" onClick={()=>setShowModal(false)} className="btn-brand px-4 py-2">Cancelar</button>
                <button type="submit" className="btn-brand btn-animated px-4 py-2">{loading ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
