"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from '@/lib/toastBus';

export default function CustomersClient() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // "" | "Activo" | "Inactivo"
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", cedulaPrefix: "V-", cedulaNumber: "", email: "", phone: "", membershipType: "", photoUrl: "" });
  const [plans, setPlans] = useState([]);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchList = async (q = "", status = "", pageArg = 1, append = false) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (status) params.set('status', status);
      params.set('page', pageArg);
      
      const res = await fetch(`/api/customers?${params.toString()}`, { cache: 'no-store' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Error cargando clientes');
      setItems(append ? [...items, ...(json.data || [])] : (json.data || []));
      setTotal(json.total || 0);
      setHasMore(!!json.hasMore);
      setPage(json.page || pageArg);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/plans?active=true');
      const json = await res.json();
      if (json.success) setPlans(json.data);
    } catch {}
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchList(query, statusFilter, 1, false);
    }, 500);
    return () => clearTimeout(timer);
  }, [query, statusFilter]);

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 1024 * 1024) { // 1MB limit
      toast.error('La imagen es muy grande (máx 1MB)');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(prev => ({ ...prev, photoUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const fullCedula = `${form.cedulaPrefix}${form.cedulaNumber}`;
      if (!form.name || !form.cedulaNumber) throw new Error('Nombre y cédula son requeridos');
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, cedula: fullCedula, membershipType: form.membershipType || undefined }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Error creando cliente');
      setShowModal(false);
      setForm({ name: "", cedulaPrefix: "V-", cedulaNumber: "", email: "", phone: "", membershipType: "", photoUrl: "" });
      toast.success('Cliente creado correctamente');
      fetchList(query, statusFilter);
    } catch (e) {
      setError(e.message);
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };


  const loadMore = () => fetchList(query, statusFilter, page + 1, true);

  const onDelete = async (id) => {
    if (!id) return;
    if (!confirm('¿Eliminar este cliente? Esta acción no se puede deshacer.')) return;
    try {
      setDeletingId(id);
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'No se pudo eliminar el cliente');
      setItems((prev)=> prev.filter((c)=> c._id !== id));
      toast.success('Cliente eliminado');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDeletingId(null);
    }
  };

  const statusBadge = (c) => {
    const active = c.paymentStatus === 'Activo' && c.membershipEndDate && new Date() <= new Date(c.membershipEndDate);
    const label = active ? 'Activo' : 'Inactivo';
    const cls = active ? 'bg-emerald-600 text-white' : 'bg-zinc-200 text-zinc-700';
    return <span className={`rounded px-2 py-0.5 text-xs font-medium ${cls}`}>{label}</span>;
  };

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full gap-2 sm:w-auto">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o cédula"
            className="w-full rounded border border-purple-200 bg-white px-3 py-2 outline-none focus:border-purple-500 sm:w-80"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded border border-purple-200 bg-white px-3 py-2 outline-none focus:border-purple-500"
          >
            <option value="">Todos</option>
            <option value="Activo">Activos</option>
            <option value="Inactivo">Inactivos</option>
          </select>
          <div className="flex items-center justify-center px-3 py-2 bg-white border border-purple-100 rounded text-purple-700 font-medium shadow-sm" title="Total de clientes">
            {total}
          </div>
        </div>
        <div className="flex gap-2">
          <a
            href={`/api/customers/export?format=csv${query ? `&q=${encodeURIComponent(query)}` : ''}`}
            className="btn-brand px-4 py-2"
          >Exportar CSV</a>
          <button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 font-bold rounded-lg px-6 py-2">Nuevo cliente</button>
        </div>
      </div>

      {error && <div className="mb-3 rounded border border-red-200 bg-red-50 p-2 text-red-700">{error}</div>}

      <div className="overflow-x-auto rounded-lg border border-purple-100 bg-white shadow-sm">
        <table className="w-full min-w-[820px] border-collapse">
          <thead>
            <tr className="text-left text-zinc-500 bg-purple-50/50">
              <th className="border-b border-purple-100 px-3 py-2 font-medium">Nombre</th>
              <th className="border-b border-purple-100 px-3 py-2 font-medium">Cédula</th>
              <th className="border-b border-purple-100 px-3 py-2 font-medium">Membresía</th>
              <th className="border-b border-purple-100 px-3 py-2 font-medium">Vence</th>
              <th className="border-b border-purple-100 px-3 py-2 font-medium">Estado</th>
              <th className="border-b border-purple-100 px-3 py-2 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && items.length === 0 ? (
              [...Array(4)].map((_,i)=>(
                <tr key={i}>
                  <td colSpan={6} className="px-3 py-4"><div className="h-6 w-full skeleton rounded bg-zinc-100" /></td>
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-4 text-center text-zinc-500">Sin resultados</td></tr>
            ) : (
              items.map((c) => (
                <tr key={c._id} className="hover:bg-purple-50/50 transition-colors">
                  <td className="border-b border-purple-50 px-3 py-2 font-medium text-zinc-800">
                    <div className="flex items-center gap-3">
                      {c.photoUrl ? (
                        <img src={c.photoUrl} alt="" className="h-8 w-8 rounded-full object-cover bg-zinc-100" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-600">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <Link className="hover:underline hover:text-brand-via" href={`/dashboard/clientes/${c._id}`}>{c.name}</Link>
                    </div>
                  </td>
                  <td className="border-b border-purple-50 px-3 py-2 text-zinc-600">{c.cedula}</td>
                  <td className="border-b border-purple-50 px-3 py-2 text-zinc-600">{c.membershipType || '-'}</td>
                  <td className="border-b border-purple-50 px-3 py-2 text-zinc-600">{c.membershipEndDate ? new Date(c.membershipEndDate).toLocaleDateString() : '-'}</td>
                  <td className="border-b border-purple-50 px-3 py-2">{statusBadge(c)}</td>
                  <td className="border-b border-purple-50 px-3 py-2">
                    <div className="flex gap-2">
                      <a href={`/dashboard/clientes/${c._id}`} className="rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900">Editar</a>
                      <button
                        disabled={deletingId===c._id}
                        onClick={()=>onDelete(c._id)}
                        className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-600 hover:bg-red-100 disabled:opacity-60"
                      >{deletingId===c._id?'Eliminando...':'Eliminar'}</button>
                    </div>
                  </td>
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
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-purple-100 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-800">Registrar nuevo cliente</h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-600">✕</button>
            </div>
            <form onSubmit={onSubmit} className="grid gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-600">Nombre *</label>
                <input value={form.name} onChange={(e)=>setForm({ ...form, name: e.target.value })} className="w-full rounded border border-purple-200 bg-white px-3 py-2 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-600">Cédula *</label>
                <div className="flex w-full rounded border border-purple-200 bg-white focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500">
                  <select
                    value={form.cedulaPrefix}
                    onChange={(e) => setForm({ ...form, cedulaPrefix: e.target.value })}
                    className="rounded-l bg-transparent px-3 py-2 text-zinc-700 outline-none hover:bg-purple-50"
                  >
                    <option value="V-">V-</option>
                    <option value="J-">J-</option>
                    <option value="E-">E-</option>
                  </select>
                  <div className="h-auto w-px bg-purple-100"></div>
                  <input
                    value={form.cedulaNumber}
                    onChange={(e) => setForm({ ...form, cedulaNumber: e.target.value })}
                    type="number"
                    className="w-full rounded-r bg-transparent px-3 py-2 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-600">Email</label>
                  <input value={form.email} onChange={(e)=>setForm({ ...form, email: e.target.value })} className="w-full rounded border border-purple-200 bg-white px-3 py-2 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-600">Teléfono</label>
                  <input value={form.phone} onChange={(e)=>setForm({ ...form, phone: e.target.value })} className="w-full rounded border border-purple-200 bg-white px-3 py-2 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-600">Foto de Perfil</label>
                <div className="flex items-center gap-4">
                  {form.photoUrl && (
                    <img src={form.photoUrl} alt="Preview" className="h-12 w-12 rounded-full object-cover border border-purple-200" />
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange}
                    className="text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-600">Tipo de membresía</label>
                <select value={form.membershipType} onChange={(e)=>setForm({ ...form, membershipType: e.target.value })} className="w-full rounded border border-purple-200 bg-white px-3 py-2 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500">
                  <option value="">Selecciona...</option>
                  {plans.length > 0 ? (
                    plans.map(p => <option key={p._id} value={p.name}>{p.name}</option>)
                  ) : (
                    <>
                      <option>Gym</option>
                      <option>Xtrembike</option>
                      <option>Diario</option>
                      <option>Mensual</option>
                      <option>Otro</option>
                    </>
                  )}
                </select>
              </div>
              <div className="mt-2 flex justify-end gap-2">
                <button type="button" onClick={()=>setShowModal(false)} className="rounded px-4 py-2 text-zinc-600 hover:bg-zinc-100">Cancelar</button>
                <button type="submit" className="btn-brand btn-animated px-4 py-2">{loading ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
