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
  const [rawCustomer, rawPayments] = await Promise.all([getCustomerById(id), getPaymentsByCustomer(id)]);
  
  if (!rawCustomer) {
    return (
      <main className="py-6">
        <p className="text-zinc-400">Cliente no encontrado.</p>
        <Link href="/dashboard/clientes" className="mt-4 inline-block text-emerald-400 hover:underline">Volver</Link>
      </main>
    );
  }

  // Serializar datos para pasar a Client Components (elimina warnings de ObjectId)
  const customer = JSON.parse(JSON.stringify(rawCustomer));
  const payments = JSON.parse(JSON.stringify(rawPayments));

  return (
    <main className="py-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {customer.photoUrl ? (
            <img src={customer.photoUrl} alt={customer.name} className="h-16 w-16 rounded-full object-cover border-2 border-zinc-700" />
          ) : (
            <div className="h-16 w-16 rounded-full bg-zinc-800 flex items-center justify-center text-2xl font-bold text-zinc-500 border-2 border-zinc-700">
              {customer.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-semibold">{customer.name}</h1>
            <p className="text-sm text-zinc-400">Cédula: {customer.cedula}</p>
          </div>
        </div>
        <Link href="/dashboard/clientes" className="text-emerald-400 hover:underline">Volver</Link>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-purple-100 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-zinc-500">Membresía</div>
          <div className="text-lg font-semibold text-zinc-800">{customer.membershipType || '-'}</div>
        </div>
        <div className="rounded-xl border border-purple-100 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-zinc-500">Vence</div>
          <div className="text-lg font-semibold text-zinc-800">{customer.membershipEndDate ? new Date(customer.membershipEndDate).toLocaleDateString() : '-'}</div>
        </div>
        <div className="rounded-xl border border-purple-100 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-zinc-500">Estado</div>
          <div className="text-lg font-semibold"><StatusBadge customer={customer} /></div>
        </div>
        <div className="rounded-xl border border-purple-100 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-zinc-500">Días restantes</div>
          <div className="text-lg font-semibold">{renderDaysBadge(customer.membershipEndDate)}</div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-purple-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-zinc-800">Registrar pago</h2>
          <PaymentForm customerId={id} initialPlanName={customer.membershipType} />
        </section>

        <section className="rounded-xl border border-purple-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-zinc-800">Historial de pagos</h2>
          <PaymentsTable payments={payments} />
        </section>
      </div>

      <div className="mt-6 grid gap-6">
        <section className="rounded-xl border border-purple-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-zinc-800">Cronología de membresía</h2>
          <PaymentsTimeline payments={payments} />
        </section>
        <section className="rounded-xl border border-purple-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-zinc-800">Editar datos del cliente</h2>
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
    <div className="overflow-x-auto rounded-xl border border-purple-100 bg-white shadow-sm">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="text-left text-zinc-500">
            <th className="border-b border-purple-100 px-4 py-3 font-medium">Fecha</th>
            <th className="border-b border-purple-100 px-4 py-3 font-medium">Monto</th>
            <th className="border-b border-purple-100 px-4 py-3 font-medium">Método</th>
            <th className="border-b border-purple-100 px-4 py-3 font-medium">Meses</th>
            <th className="border-b border-purple-100 px-4 py-3 font-medium">Referencia</th>
            <th className="border-b border-purple-100 px-4 py-3 font-medium">Nuevo vencimiento</th>
            <th className="border-b border-purple-100 px-4 py-3 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {payments.map(p => (
            <tr key={p._id} className="hover:bg-purple-50/50 text-zinc-700">
              <td className="border-b border-purple-50 px-4 py-3">{new Date(p.paymentDate || p.createdAt).toLocaleString()}</td>
              <td className="border-b border-purple-50 px-4 py-3 font-medium">
                ${p.amount.toFixed(2)}
                {p.currency === 'VES' && <div className="text-xs text-zinc-500">{p.amountVES?.toLocaleString('es-VE')} Bs</div>}
              </td>
              <td className="border-b border-purple-50 px-4 py-3">{p.paymentMethod}</td>
              <td className="border-b border-purple-50 px-4 py-3">{p.membershipMonths || 1}</td>
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
  if (days === null) return <span className="text-zinc-500">-</span>;
  const isExpired = days < 0;
  const cls = days > 7
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : days >= 0
      ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
      : 'bg-red-50 text-red-700 border-red-200';
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-sm ${cls}`}>
      {isExpired ? `${Math.abs(days)} días vencido` : `${days} días`}
    </span>
  );
}

function PaymentsTimeline({ payments }) {
  if (!payments?.length) {
    return <div className="text-sm text-zinc-500">Sin eventos en la cronología.</div>;
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
      currency: p.currency,
      amountVES: p.amountVES,
    }));

  return (
    <ol className="relative ml-2 border-l border-purple-200">
      {items.map((it, idx) => (
        <li key={it.id} className="mb-6 ml-4">
          <div className="absolute -left-1.5 mt-1 h-3 w-3 rounded-full bg-gradient-to-r from-brand-from to-brand-to"></div>
          <time className="text-xs text-zinc-500">{it.date.toLocaleString()}</time>
          <div className="mt-1 text-sm">
            <div className="font-medium text-zinc-800">
              Pago {idx+1}: {'$'}{it.amount.toFixed(2)} 
              {it.currency === 'VES' && it.amountVES && <span className="text-xs text-zinc-500 ml-1">({it.amountVES.toLocaleString('es-VE')} Bs)</span>}
              {' · '}{it.months} {it.months===1?'mes':'meses'} · {it.method}
            </div>
            <div className="text-zinc-500">Ref: {it.ref || '-'}{it.end ? ` · Nuevo vencimiento: ${it.end.toLocaleDateString()}` : ''}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}
