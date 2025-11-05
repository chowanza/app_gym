import Link from 'next/link';

async function getCustomer(id) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/customers/${id}`, { cache: 'no-store' });
  if (!res.ok) return null;
  const json = await res.json();
  return json?.data || null;
}

async function getPayments(id) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/payments?customer=${id}`, { cache: 'no-store' });
  if (!res.ok) return [];
  const json = await res.json();
  return json?.data || [];
}

function StatusBadge({ customer }) {
  const active = customer?.paymentStatus === 'Activo' && customer?.membershipEndDate && new Date() <= new Date(customer.membershipEndDate);
  const label = active ? 'Activo' : 'Inactivo';
  const cls = active ? 'bg-emerald-700' : 'bg-zinc-700';
  return <span className={`rounded px-2 py-0.5 text-xs ${cls}`}>{label}</span>;
}

export const metadata = { title: 'Detalle de Cliente' };

export default async function ClienteDetallePage({ params }) {
  const { id } = params;
  const [customer, payments] = await Promise.all([getCustomer(id), getPayments(id)]);
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

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
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
    </main>
  );
}

function PaymentsTable({ payments }) {
  if (!payments?.length) {
    return <div className="text-sm text-zinc-400">Sin pagos registrados.</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse">
        <thead>
          <tr className="text-left text-zinc-400">
            <th className="border-b border-zinc-800 px-3 py-2">Fecha</th>
            <th className="border-b border-zinc-800 px-3 py-2">Monto</th>
            <th className="border-b border-zinc-800 px-3 py-2">Método</th>
            <th className="border-b border-zinc-800 px-3 py-2">Meses</th>
            <th className="border-b border-zinc-800 px-3 py-2">Referencia</th>
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import PaymentForm from './PaymentForm';
