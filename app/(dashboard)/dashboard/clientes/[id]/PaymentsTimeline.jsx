"use client";

import { useState, useMemo } from 'react';

export default function PaymentsTimeline({ payments }) {
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'
  const [filterMethod, setFilterMethod] = useState('all'); // 'all' | 'Efectivo' | 'Pago Movil' | 'Otro'

  const paymentMethods = useMemo(() => {
    const methods = new Set(payments.map(p => p.paymentMethod));
    return ['all', ...Array.from(methods)];
  }, [payments]);

  const filteredAndSortedPayments = useMemo(() => {
    let items = [...payments];

    // Filter
    if (filterMethod !== 'all') {
      items = items.filter(p => p.paymentMethod === filterMethod);
    }

    // Sort
    items.sort((a, b) => {
      const dateA = new Date(a.paymentDate || a.createdAt);
      const dateB = new Date(b.paymentDate || b.createdAt);
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return items.map((p, index) => ({
      id: p._id,
      originalIndex: sortOrder === 'asc' ? index + 1 : items.length - index, // Keep track of "Payment #N" logic if needed, though strictly chronological index might be better
      date: new Date(p.paymentDate || p.createdAt),
      months: p.membershipMonths || 1,
      method: p.paymentMethod,
      ref: p.referenceNumber,
      end: p.membershipEndAfter ? new Date(p.membershipEndAfter) : null,
      amount: p.amount,
      currency: p.currency,
      amountVES: p.amountVES,
      planName: p.planName,
    }));
  }, [payments, sortOrder, filterMethod]);

  if (!payments?.length) {
    return <div className="text-sm text-zinc-500">Sin eventos en la cronología.</div>;
  }

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-zinc-500">Orden:</label>
          <select 
            value={sortOrder} 
            onChange={(e) => setSortOrder(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm text-zinc-700 focus:border-purple-500 focus:outline-none"
          >
            <option value="asc">Más antiguo primero</option>
            <option value="desc">Más reciente primero</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-zinc-500">Método:</label>
          <select 
            value={filterMethod} 
            onChange={(e) => setFilterMethod(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm text-zinc-700 focus:border-purple-500 focus:outline-none"
          >
            <option value="all">Todos</option>
            {paymentMethods.filter(m => m !== 'all').map(method => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Timeline */}
      {filteredAndSortedPayments.length === 0 ? (
        <div className="text-sm text-zinc-400 italic">No hay pagos que coincidan con los filtros.</div>
      ) : (
        <ol className="relative ml-2 border-l border-purple-200">
          {filteredAndSortedPayments.map((it, idx) => (
            <li key={it.id} className="mb-6 ml-4">
              <div className="absolute -left-1.5 mt-1 h-3 w-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
              <time className="text-xs text-zinc-500">{it.date.toLocaleString()}</time>
              <div className="mt-1 text-sm">
                <div className="font-medium text-zinc-800">
                  {it.planName && <span className="font-bold text-purple-700 mr-1">{it.planName}</span>}
                  Pago: {'$'}{it.amount.toFixed(2)} 
                  {it.amountVES && <span className="text-xs text-zinc-500 ml-1">({it.amountVES.toLocaleString('es-VE')} Bs)</span>}
                  {' · '}{it.months} {it.months===1?'mes':'meses'} · {it.method}
                </div>
                <div className="text-zinc-500">Ref: {it.ref || '-'}{it.end ? ` · Nuevo vencimiento: ${it.end.toLocaleDateString()}` : ''}</div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
