import Link from 'next/link';
import { requireAuth } from '@/lib/serverAuth';
import { getCustomerById, getPaymentsByCustomer, getAttendanceByCustomer } from '@/lib/customerData';
import AttendanceChart from './AttendanceChart';
import PaymentsTimeline from './PaymentsTimeline';
import PaymentsTable from './PaymentsTable';
import BackButton from './BackButton';

function StatusBadge({ customer }) {
  const active = customer?.paymentStatus === 'Activo' && customer?.membershipEndDate && new Date() <= new Date(customer.membershipEndDate);
  const label = active ? 'Activo' : 'Inactivo';
  const cls = active ? 'bg-emerald-700' : 'bg-zinc-700';
  return <span className={`rounded px-2 py-0.5 text-xs text-white ${cls}`}>{label}</span>;
}

export const metadata = { title: 'Detalle de Cliente' };

export default async function ClienteDetallePage({ params }) {
  requireAuth();
  const { id } = params;
  const [rawCustomer, rawPayments, rawAttendance] = await Promise.all([
    getCustomerById(id), 
    getPaymentsByCustomer(id),
    getAttendanceByCustomer(id)
  ]);
  
  if (!rawCustomer) {
    return (
      <main className="py-6">
        <p className="text-zinc-400">Cliente no encontrado.</p>
        <BackButton className="mt-4" />
      </main>
    );
  }

  // Serializar datos para pasar a Client Components (elimina warnings de ObjectId)
  const customer = JSON.parse(JSON.stringify(rawCustomer));
  const payments = JSON.parse(JSON.stringify(rawPayments));
  const attendance = JSON.parse(JSON.stringify(rawAttendance));

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
        <BackButton />
      </div>

      <ExpirationAlert endDate={customer.membershipEndDate} />

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

      <div className="grid gap-6">
        <section className="rounded-xl border border-purple-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-zinc-800">Registrar pago</h2>
          <PaymentForm customerId={id} initialPlanName={customer.membershipType} />
        </section>

        <section className="rounded-xl border border-purple-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-zinc-800">Historial de pagos</h2>
          <PaymentsTable payments={payments} />
        </section>

        <section className="rounded-xl border border-purple-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-zinc-800">Cronología de membresía</h2>
          <PaymentsTimeline payments={payments} />
        </section>

        <section className="rounded-xl border border-purple-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-zinc-800">Gráfico de Asistencias</h2>
          <AttendanceChart attendance={attendance} />
        </section>

        <section className="rounded-xl border border-purple-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-zinc-800">Editar datos del cliente</h2>
          <CustomerEditForm customer={customer} />
        </section>
      </div>
    </main>
  );
}





import PaymentForm from './PaymentForm';
import CustomerEditForm from './CustomerEditForm';

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

function ExpirationAlert({ endDate }) {
  const days = daysRemaining(endDate);
  if (days !== null && days >= 0 && days <= 3) {
    return (
      <div className="mb-6 rounded-md bg-orange-50 p-4 border border-orange-200">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-orange-800">Membresía por vencer</h3>
            <div className="mt-1 text-sm text-orange-700">
              <p>A este cliente le quedan <strong>{days} días</strong> de vigencia.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
}


