export const metadata = { title: 'Dashboard' };
import { requireAuth } from '@/lib/serverAuth';
import { getDashboardMetrics } from '@/lib/metrics';
import DashboardFilters from './DashboardFilters';
import ExchangeRateWidget from './ExchangeRateWidget';

export default async function DashboardPage({ searchParams }) {
  // Enforce auth on server and compute metrics directly (sin fetch HTTP)
  await requireAuth();
  const metrics = await getDashboardMetrics(searchParams);
  const isFiltered = metrics.isFiltered;

  return (
    <main className="py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-800">Dashboard</h1>
          <p className="mt-1 text-zinc-500">Métricas y accesos rápidos a módulos clave.</p>
        </div>
        <ExchangeRateWidget />
      </div>

      <div className="mt-6">
        <DashboardFilters />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-purple-100 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-zinc-500">Pagos recibidos {isFiltered ? '(rango)' : '(total)'}</div>
          <div className="mt-2 text-3xl font-bold text-zinc-800">{'$'}{metrics.totalPayments.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div className="rounded-xl border border-purple-100 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-zinc-500">Inscritos {isFiltered ? '(rango)' : 'en el mes'}</div>
          <div className="mt-2 text-3xl font-bold text-zinc-800">{metrics.newCustomersCount}</div>
        </div>
        <div className="rounded-xl border border-purple-100 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-zinc-500">Clientes totales</div>
          <div className="mt-2 text-3xl font-bold text-zinc-800">{metrics.totalCustomers}</div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-purple-100 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-zinc-500">Clientes activos</div>
          <div className="mt-2 text-3xl font-bold text-emerald-600">{metrics.activeCustomers ?? '-'}</div>
        </div>
        <div className="rounded-xl border border-purple-100 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-zinc-500">Asistencias {isFiltered ? '(rango)' : 'de hoy'}</div>
          <div className="mt-2 text-3xl font-bold text-brand-via">{metrics.attendancesCount ?? '-'}</div>
        </div>
      </div>
    </main>
  );
}
