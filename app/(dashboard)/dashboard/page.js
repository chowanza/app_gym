export const metadata = { title: 'Dashboard' };
import { requireAuth } from '@/lib/serverAuth';
import { getDashboardMetrics } from '@/lib/metrics';
import DashboardFilters from './DashboardFilters';
import ExchangeRateWidget from './ExchangeRateWidget';
import dbConnect from '@/lib/dbConnect';
import Config from '@/models/Config';

export default async function DashboardPage({ searchParams }) {
  // Enforce auth on server and compute metrics directly (sin fetch HTTP)
  await requireAuth();
  await dbConnect();
  const [metrics, config] = await Promise.all([
    getDashboardMetrics(searchParams),
    Config.findOne({ key: 'exchange_rate' })
  ]);
  const rate = config?.value || 0;
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
          <div className="text-sm font-medium text-zinc-500">Pagos recibidos {metrics.isToday ? '(hoy)' : '(rango)'}</div>
          <div className="mt-2">
            <div className="text-3xl font-bold text-zinc-800">{'$'}{metrics.totalPayments.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            {rate > 0 && metrics.isToday && (
              <div className="text-sm text-zinc-500 font-medium mt-1">
                Bs {(metrics.totalPayments * rate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
          </div>
          {metrics.paymentsByMethod?.length > 0 && (
            <div className="mt-4 border-t border-purple-50 pt-3 space-y-1">
              {metrics.paymentsByMethod.map((m) => (
                <div key={m._id} className="flex justify-between text-xs text-zinc-600">
                  <span>{m._id || 'Otros'}</span>
                  <span className="font-medium">${m.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-xl border border-purple-100 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-zinc-500">Inscritos {metrics.isToday ? '(hoy)' : '(rango)'}</div>
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
          <div className="text-sm font-medium text-zinc-500">Asistencias {metrics.isToday ? '(hoy)' : '(rango)'}</div>
          <div className="mt-2 text-3xl font-bold text-brand-via">{metrics.attendancesCount ?? '-'}</div>
        </div>
      </div>
    </main>
  );
}
