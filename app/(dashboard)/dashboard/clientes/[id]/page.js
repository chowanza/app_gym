import Link from 'next/link';
import { requireAuth } from '@/lib/serverAuth';
import { getCustomerById, getPaymentsByCustomer } from '@/lib/customerData';

function StatusBadge({ customer }) {
  const active = customer?.paymentStatus === 'Activo' && customer?.membershipEndDate && new Date() <= new Date(customer.membershipEndDate);
  const label = active ? 'Activo' : 'Inactivo';
  const cls = active ? 'bg-emerald-700' : 'bg-zinc-700';
  return <span className={`rounded px-2 py-0.5 text-xs ${cls}`}>{label}</span>;
}

export const metadata = { title: 'Detalle de Cliente' };

export default async function ClienteDetallePage({ params }) {
  requireAuth();
  const { id } = params;
  const [customer, payments] = await Promise.all([getCustomerById(id), getPaymentsByCustomer(id)]);
  if (!customer) {
    return (
      <main className="py-6">
        <p className="text-zinc-400">Cliente no encontrado.</p>
        <Link href="/dashboard/clientes" className="mt-4 inline-block text-emerald-400 hover:underline">Volver</Link>
      </main>
    );
  }

  return (
    <main className="py-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{customer.name}</h1>
          <p className="text-sm text-zinc-400">Cédula: {customer.cedula}</p>
        </div>
        <Link href="/dashboard/clientes" className="text-emerald-400 hover:underline">Volver</Link>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <div className="rounded border border-zinc-800 p-4">
          <div className="text-sm text-zinc-400">Membresía</div>
          <div className="text-lg">{customer.membershipType || '-'}</div>
        </div>
        <div className="rounded border border-zinc-800 p-4">
          <div className="text-sm text-zinc-400">Vence</div>
          <div className="text-lg">{customer.membershipEndDate ? new Date(customer.membershipEndDate).toLocaleDateString() : '-'}</div>
        </div>
        <div className="rounded border border-zinc-800 p-4">
          <div className="text-sm text-zinc-400">Estado</div>
          <div className="text-lg"><StatusBadge customer={customer} /></div>
        </div>
        <div className="rounded border border-zinc-800 p-4">
          <div className="text-sm text-zinc-400">Días restantes</div>
          <div className="text-lg">{renderDaysBadge(customer.membershipEndDate)}</div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded border border-zinc-800 p-4">
          <h2 className="mb-3 text-lg font-semibold">Registrar pago</h2>
          <PaymentForm customerId={id} />
        </section>

        <section className="rounded border border-zinc-800 p-4">
          <h2 className="mb-3 text-lg font-semibold">Historial de pagos</h2>
          <PaymentsTable payments={payments} />
        </section>
      </div>

      <div className="mt-6 grid gap-6">
        <section className="rounded border border-zinc-800 p-4">
          <h2 className="mb-3 text-lg font-semibold">Cronología de membresía</h2>
          <PaymentsTimeline payments={payments} />
        </section>
        <section className="rounded border border-zinc-800 p-4">
          <h2 className="mb-3 text-lg font-semibold">Editar datos del cliente</h2>
          <CustomerEditForm customer={customer} />
        </section>
      </div>
    </main>
  );
}

function PaymentsTable({ payments }) {
  if (!payments?.length) {
    return <div className="text-sm text-zinc-400">Sin pagos registrados.</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse">
        <thead>
          <tr className="text-left text-zinc-400">
            <th className="border-b border-zinc-800 px-3 py-2">Fecha</th>
            <th className="border-b border-zinc-800 px-3 py-2">Monto</th>
            <th className="border-b border-zinc-800 px-3 py-2">Método</th>
            <th className="border-b border-zinc-800 px-3 py-2">Meses</th>
            <th className="border-b border-zinc-800 px-3 py-2">Referencia</th>
            <th className="border-b border-zinc-800 px-3 py-2">Nuevo vencimiento</th>
            <th className="border-b border-zinc-800 px-3 py-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {payments.map(p => (
            <tr key={p._id} className="hover:bg-zinc-900/50">
              <td className="border-b border-zinc-900 px-3 py-2">{new Date(p.paymentDate || p.createdAt).toLocaleString()}</td>
              <td className="border-b border-zinc-900 px-3 py-2">${'{'}p.amount.toFixed(2){'}'}</td>
              <td className="border-b border-zinc-900 px-3 py-2">{p.paymentMethod}</td>
              <td className="border-b border-zinc-900 px-3 py-2">{p.membershipMonths || 1}</td>
              <td className="border-b border-zinc-900 px-3 py-2">{p.referenceNumber || '-'}</td>
              <td className="border-b border-zinc-900 px-3 py-2">{p.membershipEndAfter ? new Date(p.membershipEndAfter).toLocaleDateString() : '-'}</td>
              <td className="border-b border-zinc-900 px-3 py-2">
                <PaymentActions payment={p} onChanged={()=>{ /* force refresh via navigation */ location.reload(); }} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import PaymentForm from './PaymentForm';
import CustomerEditForm from './CustomerEditForm';
import PaymentActions from './PaymentActions';

function daysRemaining(end) {
  if (!end) return null;
  const now = new Date();
  const endDate = new Date(end);
  const diff = endDate.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (isNaN(days)) return null;
  return days;
}

function renderDaysBadge(end) {
  const days = daysRemaining(end);
  if (days === null) return <span className="text-zinc-400">-</span>;
  const isExpired = days < 0;
  const cls = days > 7
    ? 'bg-emerald-900/40 text-emerald-300 border-emerald-700'
    : days >= 0
      ? 'bg-yellow-900/40 text-yellow-300 border-yellow-700'
      : 'bg-red-900/40 text-red-300 border-red-800';
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-sm ${cls}`}>
      {isExpired ? `${Math.abs(days)} días vencido` : `${days} días`}
    </span>
  );
}

function PaymentsTimeline({ payments }) {
  if (!payments?.length) {
    return <div className="text-sm text-zinc-400">Sin eventos en la cronología.</div>;
  }
  const items = [...payments]
    .sort((a,b)=> new Date(a.paymentDate || a.createdAt) - new Date(b.paymentDate || b.createdAt))
    .map(p => ({
      id: p._id,
      date: new Date(p.paymentDate || p.createdAt),
      months: p.membershipMonths || 1,
      method: p.paymentMethod,
      ref: p.referenceNumber,
      end: p.membershipEndAfter ? new Date(p.membershipEndAfter) : null,
      amount: p.amount,
    }));

  return (
    <ol className="relative ml-2 border-l border-zinc-800">
      {items.map((it, idx) => (
        <li key={it.id} className="mb-6 ml-4">
          <div className="absolute -left-1.5 mt-1 h-3 w-3 rounded-full bg-gradient-to-r from-brand-from to-brand-to"></div>
          <time className="text-xs text-zinc-400">{it.date.toLocaleString()}</time>
          <div className="mt-1 text-sm">
            <div className="font-medium">Pago {idx+1}: {'$'}{it.amount.toFixed(2)} · {it.months} {it.months===1?'mes':'meses'} · {it.method}</div>
            <div className="text-zinc-400">Ref: {it.ref || '-'}{it.end ? ` · Nuevo vencimiento: ${it.end.toLocaleDateString()}` : ''}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}
