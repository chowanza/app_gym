"use client";

import { useState, useMemo } from 'react';
import PaymentActions from './PaymentActions';

export default function PaymentsTable({ payments }) {
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'
  const [filterMethod, setFilterMethod] = useState('all');

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

    return items;
  }, [payments, sortOrder, filterMethod]);

  if (!payments?.length) {
    return <div className="text-sm text-zinc-400">Sin pagos registrados.</div>;
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
            <option value="desc">Más reciente primero</option>
            <option value="asc">Más antiguo primero</option>
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

      <div className="overflow-x-auto rounded-xl border border-purple-100 bg-white shadow-sm">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="text-left text-zinc-500">
              <th className="border-b border-purple-100 px-4 py-3 font-medium">Fecha</th>
              <th className="border-b border-purple-100 px-4 py-3 font-medium">Monto</th>
              <th className="border-b border-purple-100 px-4 py-3 font-medium">Método</th>
              <th className="border-b border-purple-100 px-4 py-3 font-medium">Duración</th>
              <th className="border-b border-purple-100 px-4 py-3 font-medium">Referencia</th>
              <th className="border-b border-purple-100 px-4 py-3 font-medium">Nuevo vencimiento</th>
              <th className="border-b border-purple-100 px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedPayments.map(p => (
              <tr key={p._id} className="hover:bg-purple-50/50 text-zinc-700">
                <td className="border-b border-purple-50 px-4 py-3">{new Date(p.paymentDate || p.createdAt).toLocaleString()}</td>
                <td className="border-b border-purple-50 px-4 py-3 font-medium">
                  ${p.amount.toFixed(2)}
                  {p.amountVES && <div className="text-xs text-zinc-500">{p.amountVES?.toLocaleString('es-VE')} Bs</div>}
                </td>
                <td className="border-b border-purple-50 px-4 py-3">{p.paymentMethod}</td>
                <td className="border-b border-purple-50 px-4 py-3">
                  {(() => {
                    const val = p.durationValue ?? p.membershipMonths ?? 1;
                    const type = p.durationType || 'months';
                    const unit = type === 'days' 
                      ? (val === 1 ? 'Día' : 'Días') 
                      : (val === 1 ? 'Mes' : 'Meses');
                    return `${val} ${unit}`;
                  })()}
                </td>
                <td className="border-b border-purple-50 px-4 py-3">{p.referenceNumber || '-'}</td>
                <td className="border-b border-purple-50 px-4 py-3">{p.membershipEndAfter ? new Date(p.membershipEndAfter).toLocaleDateString() : '-'}</td>
                <td className="border-b border-purple-50 px-4 py-3">
                  <PaymentActions payment={p} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
