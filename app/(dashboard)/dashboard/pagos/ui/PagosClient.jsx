"use client";

import { useEffect, useState } from 'react';
import { toast } from '@/lib/toastBus';
import PaymentEditModal from './PaymentEditModal';

export default function PagosClient() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [editing, setEditing] = useState(null);

  const limit = 20;

  const fetchPayments = async ({ reset = false } = {}) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.set('populate', '1');
      params.set('limit', String(limit));
      params.set('page', String(reset ? 1 : page));
      if (q.trim()) params.set('q', q.trim());
      if (from) params.set('from', from);
      if (to) params.set('to', to);

      const res = await fetch(`/api/payments?${params.toString()}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Error cargando pagos');
      setTotal(json.total || 0);
      setHasMore(!!json.hasMore);
      setItems(prev => (reset ? (json.data || []) : [...prev, ...(json.data || [])]));
    } catch (e) {
      setError(e.message);
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayments({ reset: true }); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const onSearch = async () => {
    setPage(1);
    await fetchPayments({ reset: true });
    toast.success('Filtros aplicados');
  };

  const loadMore = async () => {
    if (loading || !hasMore) return;
    const next = page + 1;
    setPage(next);
    await fetchPayments();
  };

  const exportHref = () => {
    const params = new URLSearchParams({ format: 'csv' });
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    return `/api/payments/export?${params.toString()}`;
  };

  const onRefresh = async () => {
    setQ(''); setFrom(''); setTo(''); setPage(1);
    await fetchPayments({ reset: true });
    toast.success('Listado actualizado');
  };

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3">
        <div className="flex max-w-xl gap-2">
          <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Buscar por nombre o cédula" className="w-full rounded border border-purple-200 bg-white px-3 py-2 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" />
          <button onClick={onSearch} className="btn-brand btn-animated px-4 py-2">{loading ? '...' : 'Buscar'}</button>
          <button onClick={onRefresh} className="btn-brand px-4 py-2">Refrescar</button>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">Desde</label>
            <input type="date" value={from} onChange={(e)=>setFrom(e.target.value)} className="rounded border border-purple-200 bg-white px-3 py-2 outline-none focus:border-purple-500" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">Hasta</label>
            <input type="date" value={to} onChange={(e)=>setTo(e.target.value)} className="rounded border border-purple-200 bg-white px-3 py-2 outline-none focus:border-purple-500" />
          </div>
          <button onClick={onSearch} className="btn-brand px-4 py-2">Aplicar filtros</button>
          <a href={exportHref()} className="ml-auto btn-brand px-4 py-2">Exportar CSV</a>
        </div>
      </div>

      {error && <div className="max-w-xl rounded border border-red-200 bg-red-50 p-2 text-sm text-red-600">{error}</div>}

      <div className="overflow-x-auto rounded-lg border border-purple-100 bg-white shadow-sm">
        <table className="w-full min-w-[860px] border-collapse">
          <thead>
            <tr className="text-left text-zinc-500 bg-purple-50/50">
              <th className="border-b border-purple-100 px-3 py-2 font-medium">Fecha</th>
              <th className="border-b border-purple-100 px-3 py-2 font-medium">Cliente</th>
              <th className="border-b border-purple-100 px-3 py-2 font-medium">Cédula</th>
              <th className="border-b border-purple-100 px-3 py-2 font-medium">Monto</th>
              <th className="border-b border-purple-100 px-3 py-2 font-medium">Método</th>
              <th className="border-b border-purple-100 px-3 py-2 font-medium">Duración</th>
              <th className="border-b border-purple-100 px-3 py-2 font-medium">Referencia</th>
              <th className="border-b border-purple-100 px-3 py-2 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && items.length === 0 ? (
              [...Array(5)].map((_,i)=>(
                <tr key={i}><td colSpan={8} className="px-3 py-3"><div className="h-6 w-full skeleton rounded bg-zinc-100" /></td></tr>
              ))
            ) : items.length === 0 ? (
              <tr><td colSpan={8} className="px-3 py-4 text-center text-zinc-500">Sin resultados</td></tr>
            ) : (
              items.map(p => (
                <tr key={p._id} className="hover:bg-purple-50/50 transition-colors">
                  <td className="border-b border-purple-50 px-3 py-2 text-zinc-600">{new Date(p.paymentDate || p.createdAt).toLocaleString()}</td>
                  <td className="border-b border-purple-50 px-3 py-2 font-medium"><a className="hover:underline hover:text-brand-via text-zinc-800" href={`/dashboard/clientes/${p.customer?._id || p.customer}`}>{p.customer?.name || '-'}</a></td>
                  <td className="border-b border-purple-50 px-3 py-2 text-zinc-600">{p.customer?.cedula || '-'}</td>
                  <td className="border-b border-purple-50 px-3 py-2 font-semibold text-emerald-600">{'$'}{p.amount.toFixed(2)}</td>
                  <td className="border-b border-purple-50 px-3 py-2 text-zinc-600">{p.paymentMethod}</td>
                  <td className="border-b border-purple-50 px-3 py-2 text-zinc-600">{p.durationValue || p.membershipMonths || 1} {p.durationType === 'days' ? 'días' : 'meses'}</td>
                  <td className="border-b border-purple-50 px-3 py-2 text-zinc-600">{p.referenceNumber || '-'}</td>
                  <td className="border-b border-purple-50 px-3 py-2 space-x-2">
                    <button
                      className="rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                      onClick={() => setEditing(p)}
                    >Editar</button>
                    <button
                      className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-600 hover:bg-red-100"
                      onClick={async () => {
                        if (!confirm('¿Eliminar este pago? Se recalculará la membresía del cliente.')) return;
                        try {
                          const res = await fetch(`/api/payments/${p._id}`, { method: 'DELETE' });
                          const json = await res.json();
                          if (!res.ok || !json.success) throw new Error(json.error || 'No se pudo eliminar');
                          // Refresh list from first page
                          setPage(1);
                          await fetchPayments({ reset: true });
                          toast.success('Pago eliminado');
                        } catch (e) {
                          toast.error(e.message);
                        }
                      }}
                    >Eliminar</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <PaymentEditModal
        open={!!editing}
        payment={editing}
        onClose={() => setEditing(null)}
        onSaved={async ()=>{ setEditing(null); setPage(1); await fetchPayments({ reset: true }); }}
      />
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-zinc-400">Total: {total}</div>
        <div className="ml-auto">
          {hasMore && (
            <button disabled={loading} onClick={loadMore} className="btn-brand px-4 py-2 disabled:opacity-50">{loading ? 'Cargando...' : 'Cargar más'}</button>
          )}
        </div>
      </div>
    </div>
  );
}
